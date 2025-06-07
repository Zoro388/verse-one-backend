const express = require('express');
const router = express.Router();
const { createContact } = require('../controllers/contactController');

// Public route for submitting contact message
router.post('/', createContact);

module.exports = router;
