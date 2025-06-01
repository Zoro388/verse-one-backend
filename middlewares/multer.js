const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinaryConfig');


// console.log('Resolved path to cloudinaryConfig:', require.resolve('../config/cloudinaryConfig'));

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'rooms',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

const parser = multer({ storage: storage });

module.exports = parser;
