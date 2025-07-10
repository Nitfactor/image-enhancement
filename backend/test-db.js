const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load .env file
dotenv.config({ path: path.join(__dirname, '.env') });

async function testConnection() {
  console.log('🔍 Testing MongoDB Connection...');
  console.log('');
  
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in .env file');
    console.error('Please check your .env file in the backend directory');
    return;
  }
  
  console.log('📝 Connection string found (first 50 chars):', process.env.MONGODB_URI.substring(0, 50) + '...');
  console.log('');
  
  try {
    console.log('🔄 Attempting to connect...');
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB connected successfully!');
    console.log('');
    console.log('📊 Database info:');
    console.log('- Database name:', mongoose.connection.name);
    console.log('- Host:', mongoose.connection.host);
    console.log('- Port:', mongoose.connection.port);
    console.log('');
    console.log('🎉 Your database connection is working!');
    
    // Test a simple query
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📁 Collections found:', collections.map(c => c.name));
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('');
    console.error('🔧 Common solutions:');
    console.error('1. Add your IP to MongoDB Atlas whitelist: 49.43.117.33');
    console.error('2. Check your connection string in .env file');
    console.error('3. Make sure your MongoDB Atlas cluster is running');
    console.error('');
    console.error('📝 To whitelist your IP:');
    console.error('- Go to MongoDB Atlas → Network Access');
    console.error('- Click "+ ADD IP ADDRESS"');
    console.error('- Add: 49.43.117.33');
    console.error('- Or temporarily allow all IPs for development');
  } finally {
    await mongoose.disconnect();
    console.log('');
    console.log('🔌 Disconnected from MongoDB');
  }
}

testConnection(); 