const express = require('express');
const router = express.Router();
const {
  register,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  status,
  logout,
  getAllUsers,
} = require('../controllers/authController');

const { protect, allowRoles } = require('../middlewares/authMiddleware');

// Public routes
router.post('/register', register);
router.get('/verify-email/:token', verifyEmail);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Protected routes
router.get('/status', protect, status);
router.post('/logout', protect, logout);

// Admin-only route
router.get('/users', protect, allowRoles('admin'), getAllUsers);

module.exports = router;
