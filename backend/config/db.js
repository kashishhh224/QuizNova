const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('\n❌ MongoDB Connection Error: MONGO_URI is missing from environment variables.');
    console.error('If you are on Render, please add MONGO_URI in the "Environment" settings.\n');
    process.exit(1);
  }

  if (uri.includes('<cluster>') || uri.includes('<username>') || uri.includes('<password>')) {
    console.error('\n❌ MongoDB Connection Error: Invalid Connection String');
    console.error('It looks like you are still using placeholder values (<cluster>, <username>, <password>).');
    console.error('Please update MONGO_URI with your actual MongoDB Atlas connection string.\n');
    process.exit(1);
  }

  try {
    console.log('⏳ Connecting to MongoDB Atlas...');
    console.log(`🔗 Target: ${uri.substring(0, 30)}... (Redacted)`);
    
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000, // Timeout after 10 seconds
      connectTimeoutMS: 10000,         // Connection timeout
      socketTimeoutMS: 45000,          // Socket timeout
    });

    console.log('\n-----------------------------------------');
    console.log('✅ MongoDB Connection Successful!');
    console.log(`📡 Host: ${conn.connection.host}`);
    console.log(`📁 Database: ${conn.connection.name}`);
    console.log('-----------------------------------------\n');
  } catch (error) {
    console.error('\n-----------------------------------------');
    console.error('❌ MongoDB Connection Error');
    console.error(`Message: ${error.message}`);
    
    if (error.name === 'MongoParseError') {
      console.error('Hint: The connection string format is invalid. Check for typos in your .env file.');
    } else if (error.message.includes('ECONNREFUSED') || error.message.includes('querySrv')) {
      console.error('Hint: DNS resolution failed. This often happens with mongodb+srv://. Use the standard mongodb:// format instead.');
    } else if (error.message.includes('ETIMEDOUT') || error.message.includes('timeout')) {
      console.error('Hint: Connection timed out. This usually means:');
      console.error('  1. Your IP address is not whitelisted in MongoDB Atlas (Network Access).');
      console.error('  2. A firewall is blocking port 27017.');
    } else if (error.message.includes('Authentication failed')) {
      console.error('Hint: The database username or password in MONGO_URI is incorrect.');
    }
    
    console.error('-----------------------------------------\n');
    process.exit(1);
  }
};

module.exports = connectDB;
