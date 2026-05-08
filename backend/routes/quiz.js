const express = require('express');
const Quiz = require('../models/Quiz');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All quiz routes are protected (require login)
router.use(protect);

// ──────────────────────────────────────────────
// POST /api/quizzes — Create a new quiz
// ──────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { title, questions } = req.body;

    if (!title || !questions || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a title and at least one question'
      });
    }

    const quiz = await Quiz.create({
      title,
      questions,
      creator: req.user._id
    });

    res.status(201).json({ success: true, quiz });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }
    console.error('Create quiz error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ──────────────────────────────────────────────
// GET /api/quizzes — Get all quizzes (browse)
// ──────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const quizzes = await Quiz.find()
      .populate('creator', 'name')
      .sort({ createdAt: -1 })
      .select('title questions creator createdAt');

    // Add question count and creator name for listing
    const formatted = quizzes.map(q => ({
      _id: q._id,
      title: q.title,
      questionCount: q.questions.length,
      creator: q.creator,
      createdAt: q.createdAt,
      isOwner: q.creator._id.toString() === req.user._id.toString()
    }));

    res.json({ success: true, quizzes: formatted });
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ──────────────────────────────────────────────
// GET /api/quizzes/my — Get current user's quizzes
// ──────────────────────────────────────────────
router.get('/my', async (req, res) => {
  try {
    const quizzes = await Quiz.find({ creator: req.user._id })
      .sort({ createdAt: -1 });

    res.json({ success: true, quizzes });
  } catch (error) {
    console.error('Get my quizzes error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ──────────────────────────────────────────────
// GET /api/quizzes/:id — Get a single quiz by ID
// ──────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('creator', 'name');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    res.json({
      success: true,
      quiz,
      isOwner: quiz.creator._id.toString() === req.user._id.toString()
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }
    console.error('Get quiz error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ──────────────────────────────────────────────
// PUT /api/quizzes/:id — Update a quiz (owner only)
// ──────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    let quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Check ownership
    if (quiz.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this quiz'
      });
    }

    const { title, questions } = req.body;

    if (!title || !questions || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a title and at least one question'
      });
    }

    quiz.title = title;
    quiz.questions = questions;
    await quiz.save();

    res.json({ success: true, quiz });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }
    console.error('Update quiz error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ──────────────────────────────────────────────
// DELETE /api/quizzes/:id — Delete a quiz (owner only)
// ──────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Check ownership
    if (quiz.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this quiz'
      });
    }

    await Quiz.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Quiz deleted successfully' });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }
    console.error('Delete quiz error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
