const express = require('express');
const router = express.Router();
const {
  register,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  changePassword,   // ✅ Change password
  updateProfile,    // ✅ Update user profile
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
router.post('/reset-password', resetPassword);

// ✅ Protected routes
router.get('/status', protect, status);
router.post('/logout', protect, logout);
router.post('/change-password', protect, changePassword);
router.patch('/update-profile', protect, updateProfile); // ✅ Add this line

// ✅ Admin-only route
router.get('/users', protect, allowRoles('admin'), getAllUsers);

module.exports = router;
