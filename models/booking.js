const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
    listing: {
        type: Schema.Types.ObjectId,
        ref: "Listing",
        required: true
    },
    guest: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    checkIn: {
        type: Date,
        required: true
    },
    checkOut: {
        type: Date,
        required: true
    },
    guests: {
        type: Number,
        required: true,
        min: 1
    },
    totalNights: {
        type: Number,
        required: true
    },
    pricePerNight: {
        type: Number,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "confirmed", "cancelled", "completed"],
        default: "pending"
    },
    // Razorpay payment fields
    razorpayOrderId: {
        type: String
    },
    razorpayPaymentId: {
        type: String
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending"
    }
}, { timestamps: true });

// Validate checkOut is after checkIn
bookingSchema.pre("save", function(next) {
    if (this.checkOut <= this.checkIn) {
        return next(new Error("Check-out date must be after check-in date"));
    }
    next();
});

module.exports = mongoose.model("Booking", bookingSchema);
