const Contact = require('../models/Contact');

exports.createContact = async (req, res) => {
  try {
    const { email, fullName, message, number } = req.body;

    if (!email || !fullName || !message) {
      return res.status(400).json({ message: 'Email, fullName, and Message are required' });
    }

    const newContact = new Contact({
      email,
      fullName,
      message,
      number: number || '',
    });

    await newContact.save();

    res.status(201).json({ message: 'Contact message received successfully' });
  } catch (error) {
    console.error('Contact creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
