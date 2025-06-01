const express = require('express');
const router = express.Router();
const {
  createBooking,
  getAllBookings,
  getUserBookings,
} = require('../controllers/bookingController');
const { protect, allowRoles } = require('../middlewares/authMiddleware');

// Public route for booking creation
router.post('/', createBooking);

// Admin: Get all bookings
router.get('/', protect, allowRoles('admin'), getAllBookings);

// User: Get bookings by their own userId (from token)
router.get('/my-bookings', protect, getUserBookings);

module.exports = router;
