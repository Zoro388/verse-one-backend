const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Needed to fetch full user info

// Middleware to protect routes - verifies token and attaches user to req.user
const protect = async (req, res, next) => {
  // console.log('Authorization Header:', req.headers.authorization);

  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch full user data, exclude password
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Token failed' });
  }
};

// Middleware to allow access only to specific roles
const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: Insufficient role' });
    }
    next();
  };
};

module.exports = {
  protect,
  allowRoles,
};
