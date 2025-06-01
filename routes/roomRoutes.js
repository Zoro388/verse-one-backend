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

router.get('/', getAllRooms);
router.get('/:id', getRoomById);

// Use 'parser.array' for multiple images with field name 'images'
router.post('/', protect, allowRoles('admin'), parser.array('images', 5), createRoom);
router.put('/:id', protect, allowRoles('admin'), parser.array('images', 5), updateRoom);
router.delete('/:id', protect, allowRoles('admin'), deleteRoom);

module.exports = router;
