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
app.use(cors());
app.use(express.json());

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
app.listen(PORT, () => {
  console.log(`\n🚀 QuizNova Server running on http://localhost:${PORT}\n`);
});
