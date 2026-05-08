/* ===== QuizNova — Main Application Logic ===== */
(function () {
  'use strict';

  const API_BASE = 'https://quiznova-hqha.onrender.com/api';
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ===== AUTH STATE =====
  let currentUser = null;
  let authToken = localStorage.getItem('quiznova_token') || null;

  // ===== QUIZ STATE =====
  let quizCreationQuestions = []; // Questions being added for a new quiz
  let activePlayQuestions = [];   // Questions in the current active quiz session
  let currentQuestionIndex = 0;
  let score = 0;
  let correctAnswers = 0;
  let wrongAnswers = 0;
  let selectedAnswer = null;
  let timerInterval = null;
  let timeLeft = 30;
  const POINTS_PER_QUESTION = 10;

  // ===== API HELPER =====
  async function apiFetch(endpoint, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Request failed');
      return data;
    } catch (err) {
      throw err;
    }
  }

  // ===== DOM REFS =====
  const navbar = $('#navbar');
  const navToggle = $('#navToggle');
  const navLinks = $('#navLinks');

  // Auth elements
  const authButtons = $('#authButtons');
  const userMenu = $('#userMenu');
  const userAvatar = $('#userAvatar');
  const userName = $('#userName');
  const userMenuToggle = $('#userMenuToggle');
  const userDropdown = $('#userDropdown');
  const dropdownName = $('#dropdownName');
  const dropdownEmail = $('#dropdownEmail');
  const authModal = $('#authModal');
  const loginForm = $('#loginForm');
  const signupForm = $('#signupForm');
  const createAuthPrompt = $('#createAuthPrompt');
  const createCard = $('#createCard');

  // Create form
  const quizTitleInput = $('#quizTitleInput');
  const questionInput = $('#questionInput');
  const optionInputs = [$('#option1'), $('#option2'), $('#option3'), $('#option4')];
  const correctSelect = $('#correctAnswer');
  const questionsList = $('#questionsList');
  const questionCount = $('#questionCount');
  const publishQuizBtn = $('#publishQuizBtn');

  // Quiz
  const quizBrowser = $('#quizBrowser');
  const quizGrid = $('#quizGrid');
  const quizStartScreen = $('#quizStartScreen');
  const quizActiveScreen = $('#quizActiveScreen');
  const quizStartTitle = $('#quizStartTitle');
  const totalQuestionsDisplay = $('#totalQuestionsDisplay');
  const startQuizBtn = $('#startQuizBtn');
  const backToBrowserBtn = $('#backToBrowserBtn');
  const quizQuestionNum = $('#quizQuestionNum');
  const quizQuestionTotal = $('#quizQuestionTotal');
  const quizTimer = $('#quizTimer');
  const timerDisplay = $('#timerDisplay');
  const quizProgressFill = $('#quizProgressFill');
  const quizQuestionText = $('#quizQuestionText');
  const quizOptions = $('#quizOptions');
  const nextQuestionBtn = $('#nextQuestionBtn');

  // Result
  const resultSection = $('#result');
  const resultIcon = $('#resultIcon');
  const resultTitle = $('#resultTitle');
  const resultMessage = $('#resultMessage');
  const scorePercent = $('#scorePercent');
  const scoreRingFill = $('#scoreRingFill');
  const correctCountEl = $('#correctCount');
  const wrongCountEl = $('#wrongCount');
  const totalQuizQuestionsEl = $('#totalQuizQuestions');
  const finalScoreEl = $('#finalScore');

  // Toast
  const toast = $('#toast');
  const toastIcon = $('#toastIcon');
  const toastMessage = $('#toastMessage');

  // ===== TOAST =====
  function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    toastIcon.textContent = type === 'success' ? '✓' : '✕';
    toast.className = 'toast show ' + type;
    setTimeout(() => { toast.className = 'toast'; }, 3000);
  }

  // ===== NAVBAR =====
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });
  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navLinks.classList.toggle('active');
  });
  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('active');
      navLinks.classList.remove('active');
    });
  });

  // ===== AUTH UI =====
  function updateAuthUI() {
    if (currentUser) {
      authButtons.classList.add('hidden');
      userMenu.classList.remove('hidden');
      userAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
      userName.textContent = currentUser.name;
      dropdownName.textContent = currentUser.name;
      dropdownEmail.textContent = currentUser.email;
      createAuthPrompt.classList.add('hidden');
      createCard.classList.remove('hidden');
    } else {
      authButtons.classList.remove('hidden');
      userMenu.classList.add('hidden');
      createAuthPrompt.classList.remove('hidden');
      createCard.classList.add('hidden');
      // Reset dropdown toggle state
      userMenu.classList.remove('open');
    }
  }

  function openAuthModal(mode = 'login') {
    authModal.classList.remove('hidden');
    if (mode === 'login') {
      loginForm.classList.remove('hidden');
      signupForm.classList.add('hidden');
    } else {
      loginForm.classList.add('hidden');
      signupForm.classList.remove('hidden');
    }
  }
  function closeAuthModal() {
    authModal.classList.add('hidden');
    // Clear inputs
    ['loginEmail','loginPassword','signupName','signupEmail','signupPassword'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  }

  // Auth modal triggers
  $('#loginNavBtn').addEventListener('click', () => openAuthModal('login'));
  $('#signupNavBtn').addEventListener('click', () => openAuthModal('signup'));
  $('#createLoginBtn').addEventListener('click', () => openAuthModal('login'));
  $('#modalClose').addEventListener('click', closeAuthModal);
  authModal.addEventListener('click', (e) => { if (e.target === authModal) closeAuthModal(); });
  $('#switchToSignup').addEventListener('click', (e) => { e.preventDefault(); openAuthModal('signup'); });
  $('#switchToLogin').addEventListener('click', (e) => { e.preventDefault(); openAuthModal('login'); });

  // User menu toggle
  userMenuToggle.addEventListener('click', (e) => { 
    e.stopPropagation();
    userMenu.classList.toggle('open'); 
  });
  document.addEventListener('click', (e) => {
    if (!userMenu.contains(e.target)) userMenu.classList.remove('open');
  });

  // ===== AUTH ACTIONS =====
  async function handleSignup() {
    const name = $('#signupName').value.trim();
    const email = $('#signupEmail').value.trim();
    const password = $('#signupPassword').value;
    if (!name || !email || !password) { showToast('Please fill all fields', 'error'); return; }
    if (password.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
    try {
      const data = await apiFetch('/auth/signup', {
        method: 'POST', body: JSON.stringify({ name, email, password })
      });
      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem('quiznova_token', authToken);
      closeAuthModal();
      updateAuthUI();
      loadQuizzes();
      showToast(`Welcome to QuizNova, ${data.user.name}!`);
    } catch (err) { showToast(err.message, 'error'); }
  }

  async function handleLogin() {
    const email = $('#loginEmail').value.trim();
    const password = $('#loginPassword').value;
    if (!email || !password) { showToast('Please fill all fields', 'error'); return; }
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST', body: JSON.stringify({ email, password })
      });
      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem('quiznova_token', authToken);
      closeAuthModal();
      updateAuthUI();
      loadQuizzes();
      showToast(`Welcome back, ${data.user.name}!`);
    } catch (err) { showToast(err.message, 'error'); }
  }

  function handleLogout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('quiznova_token');
    updateAuthUI();
    quizGrid.innerHTML = '<div class="empty-state" style="text-align:center;padding:40px;grid-column:1/-1"><p>Log in to browse quizzes.</p></div>';
    showToast('Logged out successfully');
  }

  async function restoreSession() {
    if (!authToken) { updateAuthUI(); return; }
    try {
      const data = await apiFetch('/auth/me');
      currentUser = data.user;
      updateAuthUI();
      loadQuizzes();
    } catch {
      authToken = null;
      currentUser = null;
      localStorage.removeItem('quiznova_token');
      updateAuthUI();
    }
  }

  $('#signupSubmitBtn').addEventListener('click', handleSignup);
  $('#loginSubmitBtn').addEventListener('click', handleLogin);
  $('#logoutBtn').addEventListener('click', handleLogout);

  // Enter key support for auth forms
  $('#loginPassword').addEventListener('keydown', (e) => { if (e.key === 'Enter') handleLogin(); });
  $('#signupPassword').addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSignup(); });

  // ===== QUIZ CREATION =====
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function updateSavedQuestions() {
    questionCount.textContent = `(${quizCreationQuestions.length})`;
    publishQuizBtn.disabled = quizCreationQuestions.length === 0;
    if (quizCreationQuestions.length === 0) {
      questionsList.innerHTML = '<p class="empty-state">No questions added yet. Start creating!</p>';
      return;
    }
    questionsList.innerHTML = quizCreationQuestions.map((q, i) => `
      <div class="saved-q-item">
        <span class="saved-q-num">Q${i + 1}</span>
        <span class="saved-q-text">${escapeHTML(q.question)}</span>
        <span class="saved-q-delete" data-index="${i}" title="Delete question">✕</span>
      </div>
    `).join('');
    questionsList.querySelectorAll('.saved-q-delete').forEach((btn) => {
      btn.addEventListener('click', () => {
        quizCreationQuestions.splice(parseInt(btn.dataset.index), 1);
        updateSavedQuestions();
        showToast('Question removed', 'error');
      });
    });
  }

  function clearForm() {
    questionInput.value = '';
    optionInputs.forEach((inp) => (inp.value = ''));
    correctSelect.value = '';
  }

  // Save question locally
  $('#saveQuizBtn').addEventListener('click', () => {
    const question = questionInput.value.trim();
    const options = optionInputs.map((inp) => inp.value.trim());
    const correct = correctSelect.value;
    if (!question) { showToast('Please enter a question', 'error'); questionInput.focus(); return; }
    if (options.some((o) => !o)) { showToast('Please fill all options', 'error'); return; }
    if (correct === '') { showToast('Please select the correct answer', 'error'); return; }
    quizCreationQuestions.push({ question, options, correct: parseInt(correct) });
    clearForm();
    updateSavedQuestions();
    showToast('Question saved!');
    questionInput.focus();
  });

  $('#clearFormBtn').addEventListener('click', clearForm);

  // Publish quiz to backend
  let editingQuizId = null;

  publishQuizBtn.addEventListener('click', async () => {
    const title = quizTitleInput.value.trim();
    if (!title) { showToast('Please enter a quiz title', 'error'); quizTitleInput.focus(); return; }
    if (quizCreationQuestions.length === 0) { showToast('Add at least one question', 'error'); return; }
    try {
      if (editingQuizId) {
        await apiFetch(`/quizzes/${editingQuizId}`, {
          method: 'PUT', body: JSON.stringify({ title, questions: quizCreationQuestions })
        });
        showToast('Quiz updated successfully!');
        editingQuizId = null;
        publishQuizBtn.innerHTML = '<span class="btn-icon">🚀</span> Publish Quiz';
      } else {
        await apiFetch('/quizzes', {
          method: 'POST', body: JSON.stringify({ title, questions: quizCreationQuestions })
        });
        showToast('Quiz published successfully!');
      }
      quizTitleInput.value = '';
      quizCreationQuestions = [];
      updateSavedQuestions();
      loadQuizzes();
    } catch (err) { showToast(err.message, 'error'); }
  });

  // ===== QUIZ BROWSER =====
  let currentTab = 'all';

  async function loadQuizzes() {
    if (!currentUser) return;
    try {
      const endpoint = currentTab === 'my' ? '/quizzes/my' : '/quizzes';
      const data = await apiFetch(endpoint);
      renderQuizGrid(data.quizzes || []);
    } catch (err) {
      quizGrid.innerHTML = '<div class="empty-state" style="text-align:center;padding:40px;grid-column:1/-1"><p>Failed to load quizzes.</p></div>';
    }
  }

  function renderQuizGrid(quizzes) {
    if (quizzes.length === 0) {
      quizGrid.innerHTML = `<div class="empty-state" style="text-align:center;padding:40px;grid-column:1/-1">
        <p>${currentTab === 'my' ? "You haven't created any quizzes yet." : "No quizzes available yet."}</p>
      </div>`;
      return;
    }
    quizGrid.innerHTML = quizzes.map(q => {
      const isOwner = currentTab === 'my' || q.isOwner;
      const qCount = q.questionCount || (q.questions ? q.questions.length : 0);
      const creatorName = q.creator?.name || currentUser.name;
      const date = new Date(q.createdAt).toLocaleDateString();
      return `
        <div class="quiz-card" data-id="${q._id}">
          <div class="quiz-card-title">${escapeHTML(q.title)}</div>
          <div class="quiz-card-meta">
            <span>📝 ${qCount} questions</span>
            <span>📅 ${date}</span>
          </div>
          <div class="quiz-card-creator">By ${escapeHTML(creatorName)}</div>
          <div class="quiz-card-actions">
            <button class="quiz-card-btn play" data-id="${q._id}">▶ Play</button>
            ${isOwner ? `<button class="quiz-card-btn edit" data-id="${q._id}">✎ Edit</button>
            <button class="quiz-card-btn delete" data-id="${q._id}">✕ Delete</button>` : ''}
          </div>
        </div>`;
    }).join('');

    // Attach handlers
    quizGrid.querySelectorAll('.quiz-card-btn.play').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); loadQuizForPlay(btn.dataset.id); });
    });
    quizGrid.querySelectorAll('.quiz-card-btn.edit').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); loadQuizForEdit(btn.dataset.id); });
    });
    quizGrid.querySelectorAll('.quiz-card-btn.delete').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); deleteQuiz(btn.dataset.id); });
    });
  }

  // Tab switching
  $$('.browser-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.browser-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTab = tab.dataset.tab;
      loadQuizzes();
    });
  });

  $('#myQuizzesNavBtn').addEventListener('click', () => {
    userMenu.classList.remove('open');
    $('#preview').scrollIntoView({ behavior: 'smooth' });
    $$('.browser-tab').forEach(t => t.classList.remove('active'));
    $('#tabMyQuizzes').classList.add('active');
    currentTab = 'my';
    loadQuizzes();
  });

  // ===== QUIZ PLAY =====
  let activeQuizData = null;

  async function loadQuizForPlay(quizId) {
    try {
      const data = await apiFetch(`/quizzes/${quizId}`);
      activeQuizData = data.quiz;
      quizBrowser.classList.add('hidden');
      quizStartScreen.classList.remove('hidden');
      quizStartTitle.textContent = activeQuizData.title;
      totalQuestionsDisplay.textContent = activeQuizData.questions.length;
    } catch (err) { showToast(err.message, 'error'); }
  }

  async function loadQuizForEdit(quizId) {
    try {
      const data = await apiFetch(`/quizzes/${quizId}`);
      const quiz = data.quiz;
      editingQuizId = quizId;
      quizTitleInput.value = quiz.title;
      quizCreationQuestions = quiz.questions.map(q => ({
        question: q.question, options: [...q.options], correct: q.correct
      }));
      updateSavedQuestions();
      publishQuizBtn.innerHTML = '<span class="btn-icon">💾</span> Update Quiz';
      publishQuizBtn.disabled = false;
      $('#create').scrollIntoView({ behavior: 'smooth' });
      showToast('Quiz loaded for editing');
    } catch (err) { showToast(err.message, 'error'); }
  }

  async function deleteQuiz(quizId) {
    if (!confirm('Are you sure you want to delete this quiz?')) return;
    try {
      await apiFetch(`/quizzes/${quizId}`, { method: 'DELETE' });
      showToast('Quiz deleted');
      loadQuizzes();
    } catch (err) { showToast(err.message, 'error'); }
  }

  backToBrowserBtn.addEventListener('click', () => {
    quizStartScreen.classList.add('hidden');
    quizBrowser.classList.remove('hidden');
  });

  startQuizBtn.addEventListener('click', () => {
    if (!activeQuizData || !activeQuizData.questions || activeQuizData.questions.length === 0) return;
    activePlayQuestions = activeQuizData.questions;
    currentQuestionIndex = 0;
    score = 0; correctAnswers = 0; wrongAnswers = 0;
    quizStartScreen.classList.add('hidden');
    quizActiveScreen.classList.remove('hidden');
    resultSection.classList.add('hidden');
    loadQuestion();
  });

  // ===== QUIZ ENGINE =====
  function loadQuestion() {
    selectedAnswer = null;
    nextQuestionBtn.disabled = true;
    const q = activePlayQuestions[currentQuestionIndex];
    const total = activePlayQuestions.length;
    quizQuestionNum.textContent = `Question ${currentQuestionIndex + 1}`;
    quizQuestionTotal.textContent = `of ${total}`;
    quizProgressFill.style.width = `${((currentQuestionIndex) / total) * 100}%`;
    quizQuestionText.textContent = q.question;
    const letters = ['A', 'B', 'C', 'D'];
    quizOptions.innerHTML = q.options.map((opt, i) => `
      <div class="quiz-option" data-index="${i}">
        <span class="option-letter">${letters[i]}</span>
        <span>${escapeHTML(opt)}</span>
      </div>
    `).join('');
    quizOptions.querySelectorAll('.quiz-option').forEach((el) => {
      el.addEventListener('click', () => selectOption(el));
    });
    startTimer();
  }

  function selectOption(el) {
    if (selectedAnswer !== null) return;
    selectedAnswer = parseInt(el.dataset.index);
    const correct = activePlayQuestions[currentQuestionIndex].correct;
    quizOptions.querySelectorAll('.quiz-option').forEach((o) => o.classList.remove('selected'));
    el.classList.add('selected');
    setTimeout(() => {
      clearInterval(timerInterval);
      if (selectedAnswer === correct) {
        el.classList.add('correct'); score += POINTS_PER_QUESTION; correctAnswers++;
      } else {
        el.classList.add('wrong'); wrongAnswers++;
        quizOptions.querySelector(`[data-index="${correct}"]`).classList.add('correct');
      }
      nextQuestionBtn.disabled = false;
    }, 400);
  }

  function startTimer() {
    timeLeft = 30; clearInterval(timerInterval); updateTimerDisplay();
    quizTimer.classList.remove('warning');
    timerInterval = setInterval(() => {
      timeLeft--; updateTimerDisplay();
      if (timeLeft <= 10) quizTimer.classList.add('warning');
      if (timeLeft <= 0) {
        clearInterval(timerInterval); wrongAnswers++;
        const correct = activePlayQuestions[currentQuestionIndex].correct;
        quizOptions.querySelector(`[data-index="${correct}"]`).classList.add('correct');
        selectedAnswer = -1; nextQuestionBtn.disabled = false;
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
    const secs = String(timeLeft % 60).padStart(2, '0');
    timerDisplay.textContent = `${mins}:${secs}`;
  }

  nextQuestionBtn.addEventListener('click', () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < activePlayQuestions.length) { loadQuestion(); }
    else { clearInterval(timerInterval); showResult(); }
  });

  // ===== RESULT =====
  function showResult() {
    quizActiveScreen.classList.add('hidden');
    resultSection.classList.remove('hidden');
    resultSection.scrollIntoView({ behavior: 'smooth' });
    const total = activePlayQuestions.length;
    const percent = Math.round((correctAnswers / total) * 100);
    if (percent >= 80) { resultIcon.textContent = '🏆'; resultTitle.textContent = 'Excellent!'; resultMessage.textContent = 'Outstanding performance!'; }
    else if (percent >= 50) { resultIcon.textContent = '👏'; resultTitle.textContent = 'Good Job!'; resultMessage.textContent = 'Solid effort! Keep practicing.'; }
    else { resultIcon.textContent = '💪'; resultTitle.textContent = 'Keep Going!'; resultMessage.textContent = "Don't give up! Try again."; }
    correctCountEl.textContent = correctAnswers;
    wrongCountEl.textContent = wrongAnswers;
    totalQuizQuestionsEl.textContent = total;
    finalScoreEl.textContent = score;
    scorePercent.textContent = `${percent}%`;
    const circumference = 534;
    const offset = circumference - (percent / 100) * circumference;
    if (!document.getElementById('scoreGradient')) {
      const svg = document.querySelector('.score-ring');
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      defs.innerHTML = `<linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#00E5FF"/><stop offset="100%" stop-color="#7B61FF"/></linearGradient>`;
      svg.prepend(defs);
    }
    scoreRingFill.style.transition = 'none';
    scoreRingFill.style.strokeDashoffset = circumference;
    requestAnimationFrame(() => { requestAnimationFrame(() => {
      scoreRingFill.style.transition = 'stroke-dashoffset 1.5s ease';
      scoreRingFill.style.strokeDashoffset = offset;
    }); });
  }

  $('#retakeBtn').addEventListener('click', () => {
    resultSection.classList.add('hidden');
    if (activeQuizData) {
      activePlayQuestions = activeQuizData.questions;
      currentQuestionIndex = 0; score = 0; correctAnswers = 0; wrongAnswers = 0;
      quizActiveScreen.classList.remove('hidden');
      loadQuestion();
    }
  });

  $('#newQuizBtn').addEventListener('click', () => {
    resultSection.classList.add('hidden');
    quizBrowser.classList.remove('hidden');
    quizActiveScreen.classList.add('hidden');
    quizStartScreen.classList.add('hidden');
    activeQuizData = null;
    $('#preview').scrollIntoView({ behavior: 'smooth' });
  });

  // ===== STATS COUNTER ANIMATION =====
  function animateCounters() {
    $$('.stat-number').forEach((el) => {
      const target = parseInt(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      const duration = 2000; const step = target / (duration / 16); let current = 0;
      const update = () => {
        current += step;
        if (current >= target) { el.textContent = target.toLocaleString() + suffix; return; }
        el.textContent = Math.floor(current).toLocaleString() + suffix;
        requestAnimationFrame(update);
      };
      update();
    });
  }

  // ===== SCROLL ANIMATIONS =====
  let statsAnimated = false;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        if (entry.target.closest('#stats') && !statsAnimated) { statsAnimated = true; animateCounters(); }
      }
    });
  }, { threshold: 0.1 });
  $$('[data-aos]').forEach((el) => observer.observe(el));

  // ===== FAQ ACCORDION =====
  $$('.faq-question').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const isActive = item.classList.contains('active');
      $$('.faq-item').forEach((faq) => faq.classList.remove('active'));
      if (!isActive) item.classList.add('active');
    });
  });

  // ===== INIT =====
  updateSavedQuestions();
  restoreSession();

})();
