const express = require('express');
const router = express.Router();
const {
  createBooking,
  getAllBookings,
  getUserBookings,
} = require('../controllers/bookingController');
const { protect, allowRoles } = require('../middlewares/authMiddleware');

// Public route - Create a new booking (you can add protect if needed)
router.post('/', createBooking);

// Admin route - Get all bookings
router.get('/', protect, allowRoles('admin'), getAllBookings);

// User route - Get bookings for logged-in user
router.get('/my-bookings', protect, getUserBookings);

module.exports = router;
