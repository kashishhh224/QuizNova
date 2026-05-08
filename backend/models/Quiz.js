const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true
  },
  options: {
    type: [String],
    required: [true, 'Options are required'],
    validate: {
      validator: function (arr) {
        return arr.length === 4 && arr.every(opt => opt.trim().length > 0);
      },
      message: 'Exactly 4 non-empty options are required'
    }
  },
  correct: {
    type: Number,
    required: [true, 'Correct answer index is required'],
    min: 0,
    max: 3
  }
}, { _id: false });

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Quiz title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  questions: {
    type: [questionSchema],
    required: [true, 'At least one question is required'],
    validate: {
      validator: function (arr) {
        return arr.length > 0;
      },
      message: 'Quiz must have at least one question'
    }
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Quiz', quizSchema);
