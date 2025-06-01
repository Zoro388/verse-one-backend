const express = require('express');
const { protect } = require('../middlewares/authMiddleware');      // destructured import
const { allowRoles } = require('../middlewares/roleMiddleware');    // destructured import
const { getAllUsers, getMyProfile } = require('../controllers/userController');

const router = express.Router();

// Admin: Get all users
router.get('/', protect, allowRoles('admin'), getAllUsers);

// Authenticated User: Get own profile
router.get('/me', protect, getMyProfile);

module.exports = router;
