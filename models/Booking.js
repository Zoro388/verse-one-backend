const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',           // Optional link to user
    required: false,
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',           // Which room is booked
    required: true,
  },
  checkIn: {
    type: Date,
    required: true,
  },
  checkOut: {
    type: Date,
    required: true,
  },
  maxNumberOfAdults: {
    type: Number,
    required: true,
    min: 1,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending',
  },
  userEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,     // Client's name from frontend form
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Booking', bookingSchema);
