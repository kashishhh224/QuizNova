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
    console.log('⏳ Connecting to MongoDB...');
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    
    if (error.message.includes('EBADNAME')) {
      console.error('Hint: This usually means the hostname in your MONGO_URI is incorrect or contains forbidden characters.');
    } else if (error.message.includes('ETIMEDOUT') || error.message.includes('queryTxt ETIMEOUT')) {
      console.error('Hint: This often means your IP address is not whitelisted in MongoDB Atlas or there is a network issue.');
    } else if (error.message.includes('Authentication failed')) {
      console.error('Hint: Your database username or password in MONGO_URI is incorrect.');
    }
    
    process.exit(1);
  }
};

module.exports = connectDB;
