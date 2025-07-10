const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load .env file with absolute path
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('ERROR: MONGODB_URI environment variable is not set');
      console.error('Please check your .env file in the backend directory');
      return false;
    }
    
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      // MongoDB connection options for security
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000, // Increased timeout
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('');
    console.error('🔧 Troubleshooting steps:');
    console.error('1. Check if your IP address is whitelisted in MongoDB Atlas');
    console.error('2. Verify your MONGODB_URI in the .env file');
    console.error('3. Make sure your MongoDB Atlas cluster is running');
    console.error('');
    console.error('📝 To whitelist your IP:');
    console.error('- Go to MongoDB Atlas → Network Access');
    console.error('- Add IP: 49.43.117.33 (your current IP)');
    console.error('- Or temporarily allow all IPs for development');
    console.error('');
    return false;
  }
};

module.exports = connectDB; 