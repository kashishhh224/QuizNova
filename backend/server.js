const express = require('express');
const path = require('path');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const quizRoutes = require('./routes/quiz');

// Load environment variables from the same directory as server.js
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Initialize Express
const app = express();

// Connect to MongoDB
connectDB();

// ===== MIDDLEWARE =====
// In production, you might want to restrict origins, but for debugging we'll keep it permissive
// and add some logging to see if requests are hitting the server
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// ===== DIAGNOSTICS =====
// Health check endpoint to verify backend is up independently of DB
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'QuizNova API is alive',
    timestamp: new Date().toISOString(),
    env: {
      hasMongoUri: !!process.env.MONGO_URI,
      hasJwtSecret: !!process.env.JWT_SECRET,
      nodeEnv: process.env.NODE_ENV || 'development'
    }
  });
});

// Validate essential environment variables
if (!process.env.JWT_SECRET) {
  console.warn('⚠️ WARNING: JWT_SECRET is not defined. Using a default fallback for now, but this is INSECURE for production.');
  process.env.JWT_SECRET = 'temporary_development_secret_key_123';
}

// ===== SERVE STATIC FRONTEND FILES =====
// Serve index.html, style.css, script.js from the parent directory
app.use(express.static(path.join(__dirname, '..')));

// ===== API ROUTES =====
app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);

// ===== CATCH-ALL: Serve index.html for any unknown route =====
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`\n🚀 QuizNova Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health\n`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  // In production, we might not want to close the server immediately, but it's safer for debugging
  // server.close(() => process.exit(1));
});
