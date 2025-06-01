const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  pricePerNight: {
    type: Number,
    required: true,
  },
  images: {
    type: [String],
    default: [],
  },
  features: {
    type: [String],
    default: [],
  },
  description: {
    type: String,
    required: true,
  },
  maxNumberOfAdults: {
    type: Number,
    required: true,
    min: 1,
  },
  roomNumber: {
    type: String,
    default: '',
  },
  isAvailable: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true // createdAt and updatedAt
});

module.exports = mongoose.model('Room', roomSchema);
