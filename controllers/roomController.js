// const Room = require('../models/Room');

// // @desc Create a new room
// // const Room = require('../models/Room');
// const util = require('util'); // <-- Add this at the top

// @desc Create a new room
const Room = require('../models/Room');

exports.createRoom = async (req, res) => {
  try {
    console.log('=== Incoming req.body ===');
    console.dir(req.body, { depth: null, colors: true });

    console.log('=== Incoming req.files ===');
    console.dir(req.files, { depth: null, colors: true });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images uploaded' });
    }

    const {
      name,
      pricePerNight,
      features,
      description,
      maxNumberOfAdults,
      roomNumber,
      typeOfBed,
      isAvailable,
    } = req.body;

    const featuresArray = typeof features === 'string'
      ? features.split(',').map(f => f.trim())
      : features;

    const room = new Room({
      name,
      pricePerNight: Number(pricePerNight),
      images: req.files.map(file => file.path || file.secure_url),
      features: featuresArray,
      description,
      maxNumberOfAdults: Number(maxNumberOfAdults),
      roomNumber,
      typeOfBed,
      isAvailable: isAvailable === 'true' || isAvailable === true,
    });

    const savedRoom = await room.save();
    res.status(201).json(savedRoom);

  } catch (error) {
    console.error('=== Create room error ===');
    console.dir(error, { depth: null, colors: true });

    res.status(500).json({
      message: error.message || 'Server error while creating room',
      stack: error.stack,
    });
  }
};




// @desc Get all rooms
exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (error) {
    console.error('Get all rooms error:', error);
    res.status(500).json({ message: 'Server error while fetching rooms' });
  }
};

// @desc Get single room by ID
exports.getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ message: 'Server error while fetching room' });
  }
};

// @desc Update room
exports.updateRoom = async (req, res) => {
  try {
    const {
      name,
      pricePerNight,
      features,
      description,
      maxNumberOfAdults,
      roomNumber,
      isAvailable,
    } = req.body;

    // Convert comma-separated features to array if needed
    const featuresArray = typeof features === 'string'
      ? features.split(',').map(f => f.trim())
      : features;

    // Extract image file paths if uploaded
    const images = req.files ? req.files.map(file => file.path) : undefined;

    const updateData = {
      name,
      pricePerNight,
      features: featuresArray,
      description,
      maxNumberOfAdults,
      roomNumber,
      isAvailable,
    };

    if (images !== undefined) {
      updateData.images = images;
    }

    const updatedRoom = await Room.findByIdAndUpdate(req.params.id, updateData, { new: true });

    if (!updatedRoom) return res.status(404).json({ message: 'Room not found' });

    res.json(updatedRoom);
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ message: 'Server error while updating room' });
  }
};

// @desc Delete room
exports.deleteRoom = async (req, res) => {
  try {
    const deleted = await Room.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Room not found' });
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ message: 'Server error while deleting room' });
  }
};
