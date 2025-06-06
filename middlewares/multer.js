const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinaryConfig');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'rooms',
    allowed_formats: [
      'jpg',
      'jpeg',
      'png',
      'gif',
      'bmp',
      'tiff',
      'svg',
      'webp',
      'avif',
      'heic',
      'heif'
    ],
  },
});

const parser = multer({ storage: storage });

module.exports = parser;
