const express = require('express');
const router = express.Router();
const {
  createRoom,
  getAllRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
} = require('../controllers/roomController');

const { protect, allowRoles } = require('../middlewares/authMiddleware');
const parser = require('../middlewares/multer');  // multer for image upload

// Public Routes
router.get('/', getAllRooms);
router.get('/:id', getRoomById);

// Admin-Protected Routes
router.post('/', protect, allowRoles('admin'), parser.array('images', 5), createRoom);

// 🔁 Replaced PUT with PATCH for partial updates
router.patch('/:id', protect, allowRoles('admin'), parser.array('images', 5), updateRoom);

router.delete('/:id', protect, allowRoles('admin'), deleteRoom);

module.exports = router;
