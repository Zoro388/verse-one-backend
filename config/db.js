const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('DB Error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;



// Nl55GzS5wAavtBqp

// ldks crjq iijk pkmy 
