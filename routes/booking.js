const express = require("express");
const router  = express.Router();
const { isLoggedIn } = require("../middleware.js");
const wrapAsync = require("../utils/wrapAsync.js");
const bookingController = require("../controllers/bookings.js");

// Show booking form for a listing
router.get("/new/:id", isLoggedIn, wrapAsync(bookingController.renderBookingForm));

// Create Razorpay order (AJAX)
router.post("/create-order", isLoggedIn, wrapAsync(bookingController.createOrder));

// Verify payment after Razorpay callback
router.post("/verify", isLoggedIn, wrapAsync(bookingController.verifyPayment));

// View a specific booking
router.get("/my", isLoggedIn, wrapAsync(bookingController.myBookings));

router.get("/:id", isLoggedIn, wrapAsync(bookingController.showBooking));

// Cancel booking
router.post("/:id/cancel", isLoggedIn, wrapAsync(bookingController.cancelBooking));

module.exports = router;
