const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');

// ==============================
// Register
exports.register = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !email || !password) {
    return res.status(400).json({ message: 'All required fields must be filled' });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({
      firstName,
      lastName: lastName || '',
      email,
      password,
      role: 'user',
      isVerified: false,
    });

    const verificationToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    // ✅ Use SERVER_URL from .env
    const verifyURL = `${process.env.SERVER_URL}/api/auth/verify-email/${verificationToken}`;

    // Send verification email
    await sendEmail({
      to: user.email,
      subject: 'Verify Your Email - Verse One Hotel',
      text: `Click the link to verify your email: ${verifyURL}`,
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 30px;">
          <h2 style="color: #059669;">Welcome to Verse One Hotel</h2>
          <p>Hello <strong>${firstName}</strong>,</p>
          <p>Click the button below to verify your email and complete your registration.</p>
          <a href="${verifyURL}" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #059669; color: #fff; text-decoration: none; border-radius: 5px;">Verify Email</a>
        </div>
      `,
    });

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};




// ==============================
// VERIFY EMAIL

// const jwt = require('jsonwebtoken');
// const User = require('../models/User');

exports.verifyEmail = async (req, res) => {
  const { token } = req.params;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(400).send(`
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: red;">❌ Invalid Token</h2>
          <p>This verification link is invalid or has expired.</p>
        </div>
      `);
    }

    if (user.isVerified) {
      return res.send(`
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 60px;">
          <h2 style="color: #059669;">✅ Email Already Verified</h2>
          <p>Hello <strong>${user.firstName}</strong>, your email is already verified.</p>
          <a href="https://verseonehotel.netlify.app/auth"
             style="display: inline-block; margin-top: 20px; padding: 12px 24px;
                    background-color: #059669; color: #fff; text-decoration: none;
                    border-radius: 6px; font-weight: bold;">
            Go to Login
          </a>
        </div>
      `);
    }

    user.isVerified = true;
    await user.save();

    return res.send(`
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 60px;">
        <h2 style="color: #059669;">✅ Email Verified Successfully</h2>
        <p>Hello <strong>${user.firstName}</strong>, your email has been verified.</p>
        <p>You can now log in to your account.</p>
        <a href="https://verseonehotel.netlify.app/auth"
           style="display: inline-block; margin-top: 20px; padding: 12px 24px;
                  background-color: #059669; color: #fff; text-decoration: none;
                  border-radius: 6px; font-weight: bold;">
          Go to Login
        </a>
      </div>
    `);
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(400).send(`
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
        <h2 style="color: red;">❌ Invalid or Expired Token</h2>
        <p>Please request a new verification link or contact support.</p>
      </div>
    `);
  }
};



// ==============================
// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    if (!user.isVerified) {
      return res.status(401).json({ message: 'Please verify your email before logging in' });
    }

    return res.json({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ==============================
// Forgot Password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const resetToken = user.generatePasswordResetToken();
    await user.save();

    const FRONTEND_URL = process.env.FRONTEND_URL;
    const resetURL = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: 'Password Reset',
      text: `Click the link to reset your password: ${resetURL}`,
      html: `<p>Click the button below to reset your password:</p>
        <a href="${resetURL}" style="padding:10px 20px; background:#28a745; color:#fff; text-decoration:none;">Reset Password</a>
        <p>This link will expire in 15 minutes.</p>`,
    });

    res.status(200).json({ message: 'Reset link sent to email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to send reset email' });
  }
};

// ==============================
// Reset Password
exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: 'Token and new password are required' });
  }

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==============================
// Status
exports.status = async (req, res) => {
  const user = req.user;
  res.status(200).json({
    loggedIn: true,
    user: {
      id: user._id,
      firstName: user.firstName,
      email: user.email,
      role: user.role,
    },
  });
};

// ==============================
// Logout
exports.logout = async (req, res) => {
  res.status(200).json({ message: 'Logout successful' });
};

// ==============================
// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password -resetPasswordToken -resetPasswordExpires');
    res.status(200).json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==============================
// Change Password
exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Both old and new passwords are required' });
  }

  try {
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Old password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==============================
// UPDATE PROFILE
exports.updateProfile = async (req, res) => {
  const { firstName, lastName } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Only update the fields provided
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    await user.save();

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


