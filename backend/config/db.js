const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri || uri.includes('<cluster>') || uri.includes('<username>')) {
    console.error('\n❌ MongoDB Connection Error: Invalid Connection String');
    console.error('It looks like you are still using placeholder values (<cluster>, <username>, <password>) in your backend/.env file.');
    console.error('Please update MONGO_URI with your actual MongoDB Atlas connection string.\n');
    // Don't exit immediately in development so the server can report the error
    return;
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    if (error.message.includes('EBADNAME')) {
      console.error('Hint: This usually means the hostname in your MONGO_URI is incorrect or has placeholders.');
    }
    process.exit(1);
  }
};

module.exports = connectDB;
