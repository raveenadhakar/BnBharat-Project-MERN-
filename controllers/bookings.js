const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { publishBookingConfirmation } = require("../utils/rabbitmq.js");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// GET /bookings/listing/:id  → Show booking form
module.exports.renderBookingForm = async (req, res) => {
    const listing = await Listing.findById(req.params.id).populate("owner");
    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }

    // Get all confirmed bookings for this listing (to block dates)
    const bookedDates = await Booking.find({
        listing: listing._id,
        status: { $in: ["confirmed", "pending"] },
        checkOut: { $gte: new Date() }
    }).select("checkIn checkOut");

    res.render("bookings/new.ejs", {
        listing,
        bookedDates: JSON.stringify(bookedDates),
        razorpayKeyId: process.env.RAZORPAY_KEY_ID
    });
};

// POST /bookings  → Create Razorpay order
module.exports.createOrder = async (req, res) => {
    const { listingId, checkIn, checkOut, guests } = req.body;

    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    const checkInDate  = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const totalNights  = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

    if (totalNights < 1) {
        return res.status(400).json({ error: "Invalid dates" });
    }

    // Check availability — no overlapping confirmed bookings
    const conflict = await Booking.findOne({
        listing: listingId,
        status: { $in: ["confirmed", "pending"] },
        $or: [
            { checkIn: { $lt: checkOutDate }, checkOut: { $gt: checkInDate } }
        ]
    });
    if (conflict) {
        return res.status(400).json({ error: "These dates are already booked" });
    }

    // Calculate price with discount
    const pricePerNight = listing.discount > 0
        ? Math.round(listing.price - (listing.price * listing.discount / 100))
        : listing.price;

    const totalAmount = pricePerNight * totalNights;

    // Create Razorpay order (amount in paise)
    const order = await razorpay.orders.create({
        amount: totalAmount * 100,
        currency: "INR",
        receipt: `booking_${Date.now()}`,
        notes: {
            listingId,
            checkIn,
            checkOut,
            guests,
            guestId: req.user._id.toString()
        }
    });

    // Save pending booking
    const booking = new Booking({
        listing: listingId,
        guest: req.user._id,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests: parseInt(guests),
        totalNights,
        pricePerNight,
        totalAmount,
        razorpayOrderId: order.id,
        status: "pending",
        paymentStatus: "pending"
    });
    await booking.save();

    res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        bookingId: booking._id,
        keyId: process.env.RAZORPAY_KEY_ID
    });
};

// POST /bookings/verify  → Verify Razorpay payment
module.exports.verifyPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSig = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex");

    if (expectedSig !== razorpay_signature) {
        await Booking.findByIdAndUpdate(bookingId, { paymentStatus: "failed" });
        req.flash("error", "Payment verification failed");
        return res.redirect("/listings");
    }

    // Update booking as confirmed
    const booking = await Booking.findByIdAndUpdate(
        bookingId,
        {
            razorpayPaymentId: razorpay_payment_id,
            paymentStatus: "paid",
            status: "confirmed"
        },
        { new: true }
    ).populate("listing guest");

    // Publish to RabbitMQ for async email notification
    try {
        await publishBookingConfirmation({
            guestEmail: booking.guest.email,
            guestName: booking.guest.username,
            listingTitle: booking.listing.title,
            checkIn: booking.checkIn.toDateString(),
            checkOut: booking.checkOut.toDateString(),
            totalAmount: booking.totalAmount,
            bookingId: booking._id
        });
    } catch (err) {
        console.error("RabbitMQ publish error (non-blocking):", err.message);
    }

    req.flash("success", "Booking confirmed! Confirmation email will be sent shortly.");
    res.redirect(`/bookings/${booking._id}`);
};

// GET /bookings/:id  → Show booking details
module.exports.showBooking = async (req, res) => {
    const booking = await Booking.findById(req.params.id)
        .populate("listing")
        .populate("guest");

    if (!booking) {
        req.flash("error", "Booking not found");
        return res.redirect("/listings");
    }

    // Only guest or listing owner can view
    const isGuest = booking.guest._id.equals(req.user._id);
    const isOwner = booking.listing.owner.equals(req.user._id);
    if (!isGuest && !isOwner) {
        req.flash("error", "Access denied");
        return res.redirect("/listings");
    }

    res.render("bookings/show.ejs", { booking });
};

// GET /bookings/my  → All bookings for current user
module.exports.myBookings = async (req, res) => {
    const bookings = await Booking.find({ guest: req.user._id })
        .populate("listing")
        .sort({ createdAt: -1 });

    res.render("bookings/my-bookings.ejs", { bookings });
};

// POST /bookings/:id/cancel  → Cancel a booking
module.exports.cancelBooking = async (req, res) => {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
        req.flash("error", "Booking not found");
        return res.redirect("/bookings/my");
    }

    if (!booking.guest.equals(req.user._id)) {
        req.flash("error", "Access denied");
        return res.redirect("/bookings/my");
    }

    if (booking.status === "confirmed") {
        booking.status = "cancelled";
        await booking.save();
        req.flash("success", "Booking cancelled");
    } else {
        req.flash("error", "Cannot cancel this booking");
    }

    res.redirect("/bookings/my");
};
