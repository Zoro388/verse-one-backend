const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  number: {
    type: String,
    required: false,
    trim: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('Contact', contactSchema);
