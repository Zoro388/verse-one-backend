const express = require('express');
const { register, login, forgotPassword, resetPassword } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// Forgot password: User submits their email to get a reset link
router.post('/forgot-password', forgotPassword);

// Reset password: User resets password with token from email link
router.post('/reset-password/:token', resetPassword);

module.exports = router;
