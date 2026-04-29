const quizData = {
  WRITING: null,
  LISTENING: [],
  READING_AND_GRAMMAR: [],
  SPEAKING: []
};

const SECTION_CONFIG = {
  WRITING: { time: 45 * 60, tasks: 2, task1Questions: 3, name: 'writing' },
  LISTENING: { time: 35 * 60, parts: 3, items: 50, name: 'listening' },
  READING_AND_GRAMMAR: { time: 65 * 60, parts: 3, items: 50, name: 'reading' },
  SPEAKING: { time: 10 * 60, parts: 2, items: 5, name: 'speaking' },
  WRITING_TASK1: { time: 45 * 60, tasks: 2, task1Questions: 3, name: 'writing-task1', parentSection: 'WRITING' },
  WRITING_TASK2: { time: 45 * 60, tasks: 2, task1Questions: 3, name: 'writing-task2', parentSection: 'WRITING' },
  LISTENING_P1: { time: 35 * 60, parts: 3, items: 19, name: 'listening-p1', parentSection: 'LISTENING', partId: 1 },
  LISTENING_P2: { time: 35 * 60, parts: 3, items: 14, name: 'listening-p2', parentSection: 'LISTENING', partId: 2 },
  LISTENING_P3: { time: 35 * 60, parts: 3, items: 17, name: 'listening-p3', parentSection: 'LISTENING', partId: 3 },
  READING_P1: { time: 65 * 60, parts: 3, items: 20, name: 'reading-p1', parentSection: 'READING_AND_GRAMMAR', partId: 1 },
  READING_P2: { time: 65 * 60, parts: 3, items: 11, name: 'reading-p2', parentSection: 'READING_AND_GRAMMAR', partId: 2 },
  READING_P3: { time: 65 * 60, parts: 3, items: 20, name: 'reading-p3', parentSection: 'READING_AND_GRAMMAR', partId: 3 },
  SPEAKING_P1: { time: 10 * 60, parts: 2, items: 3, name: 'speaking-p1', parentSection: 'SPEAKING', partId: 1 },
  SPEAKING_P2: { time: 10 * 60, parts: 2, items: 2, name: 'speaking-p2', parentSection: 'SPEAKING', partId: 2 }
};

const SECTION_NAMES = {
  'writing': 'WRITING',
  'listening': 'LISTENING',
  'reading': 'READING_AND_GRAMMAR',
  'speaking': 'SPEAKING'
};

const SECTION_KEYS_BY_NAME = Object.fromEntries(
  Object.entries(SECTION_CONFIG).map(([key, config]) => [config.name, key])
);

const SECTION_TIMES = {
  WRITING: 45 * 60,
  LISTENING: 35 * 60,
  READING_AND_GRAMMAR: 65 * 60,
  SPEAKING: 10 * 60
};

const WARNING_TIME = 5 * 60;

const SECTION_PARTS = {
  WRITING: [
    { key: 'WRITING_TASK1', name: 'Task 1', time: 45 * 60 },
    { key: 'WRITING_TASK2', name: 'Task 2', time: 45 * 60 }
  ],
  LISTENING: [
    { key: 'LISTENING_P1', name: 'Part 1', time: 35 * 60 },
    { key: 'LISTENING_P2', name: 'Part 2', time: 35 * 60 },
    { key: 'LISTENING_P3', name: 'Part 3', time: 35 * 60 }
  ],
  READING_AND_GRAMMAR: [
    { key: 'READING_P1', name: 'Part 1', time: 65 * 60 },
    { key: 'READING_P2', name: 'Part 2', time: 65 * 60 },
    { key: 'READING_P3', name: 'Part 3', time: 65 * 60 }
  ],
  SPEAKING: [
    { key: 'SPEAKING_P1', name: 'Part 1', time: 10 * 60 },
    { key: 'SPEAKING_P2', name: 'Part 2', time: 10 * 60 }
  ]
};

function getSectionKey(partKey) {
  if (partKey.startsWith('WRITING')) return 'WRITING';
  if (partKey.startsWith('LISTENING')) return 'LISTENING';
  if (partKey.startsWith('READING')) return 'READING_AND_GRAMMAR';
  if (partKey.startsWith('SPEAKING')) return 'SPEAKING';
  return null;
}

function formatHash(partKey, qNum) {
  return `#/${partKey}/q${qNum.toString().padStart(2, '0')}`;
}

function formatWritingHash(taskPart, qNum) {
  return `#/writing-${taskPart}/q${qNum.toString().padStart(2, '0')}`;
}

function updateHash(partKey, qNum) {
  window.location.hash = formatHash(partKey, qNum);
}

function updateWritingHash(taskPart, qNum) {
  window.location.hash = formatWritingHash(taskPart, qNum);
}

function parseHash() {
  const hash = window.location.hash.slice(1);
  if (!hash || hash === '/') return null;
  
  const parts = hash.split('/').filter(p => p);
  if (parts.length < 2) return null;
  
  const rawKey = parts[0];
  const sectionKey = SECTION_KEYS_BY_NAME[rawKey] || rawKey;
  
  if (parts[1] === 'preview') {
    const parentSection = getSectionKey(sectionKey);
    return { section: sectionKey, parentSection, taskPart: 'preview', qNum: null, hash };
  }
  
  if (parts[1] === 'results') {
    const parentSection = getSectionKey(sectionKey);
    return { section: sectionKey, parentSection, taskPart: 'results', qNum: null, hash };
  }
  
  const qMatch = parts[1].match(/^q(\d+)$/);
  if (qMatch) {
    const qNum = parseInt(qMatch[1], 10);
    const parentSection = getSectionKey(sectionKey);
    return { section: sectionKey, parentSection, taskPart: null, qNum, hash };
  }
  
  if (parts.length < 3) return null;
  
  const taskPart = parts[1];
  const qPart = parts[2];
  const qMatch2 = qPart.match(/q(\d+)/);
  if (!qMatch2) return null;
  
  const qNum = parseInt(qMatch2[1], 10);
  const parentSection = getSectionKey(sectionKey);
  return { section: sectionKey, parentSection, taskPart, qNum, hash };
}

function getProgressKey(partKey, qNum) {
  const config = SECTION_CONFIG[partKey];
  if (config) {
    return `${config.name}_q${qNum.toString().padStart(2, '0')}`;
  }
  return `${partKey.toLowerCase()}_q${qNum}`;
}

function saveAnswerToHash(answer) {
  const key = getProgressKey(currentPartKey, currentQuestionIndex + 1);
  const saved = JSON.parse(localStorage.getItem('metQuizProgress') || '{}');
  saved.answers = saved.answers || {};
  saved.answers[key] = answer;
  saved.currentHash = window.location.hash;
  saved.currentIndex = currentQuestionIndex;
  saved.currentSection = currentSection;
  saved.currentPartKey = currentPartKey;
  saved.score = score;
  saved.answeredQuestions = Array.from(answeredQuestions);
  saved.answersByPart = answersByPart;
  saved.timerRemaining = timerRemaining;
  localStorage.setItem('metQuizProgress', JSON.stringify(saved));
}

function getAnswerFromHash(partKey, qNum) {
  const key = getProgressKey(partKey, qNum);
  const saved = JSON.parse(localStorage.getItem('metQuizProgress') || '{}');
  return saved.answers ? saved.answers[key] : null;
}

let hashNavigationLocked = false;

function loadFromHash() {
  if (hashNavigationLocked) return;
  
  const parsed = parseHash();
  if (!parsed) {
    if (!currentSection) renderCategorySelect();
    return;
  }
  
  const { section, taskPart, qNum } = parsed;
  
  if (!section || !SECTION_CONFIG[section]) {
    if (!currentSection) renderCategorySelect();
    return;
  }
  
  if (!currentUser) {
    showRegistrationModal();
    return;
  }
  
  if (taskPart === 'preview') {
    if (currentPartKey !== section) {
      beginQuiz(section);
      setTimeout(() => goToPreview(), 100);
    } else {
      goToPreview();
    }
    return;
  }
  
  if (taskPart === 'results') {
    if (currentPartKey !== section) {
      beginQuiz(section);
      setTimeout(() => showResults(), 100);
    } else {
      showResults();
    }
    return;
  }
  
  if (currentPartKey === section && qNum !== null) {
    const targetIndex = qNum - 1;
    if (targetIndex >= 0 && targetIndex < shuffledQuestions.length && targetIndex !== currentQuestionIndex) {
      currentQuestionIndex = targetIndex;
      loadQuestion();
      return;
    }
    return;
  }
  
  if (currentSection === getSectionKey(section) && currentPartKey !== section) {
    navigateToPart(section);
    return;
  }
  
  beginQuiz(section);
}

window.addEventListener('hashchange', loadFromHash);

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateTimerDisplay() {
  const display = getElement('timer-display');
  const container = getElement('timer-container');
  if (display) {
    display.textContent = formatTime(timerRemaining);
    if (container) {
      container.classList.toggle('warning', timerRemaining <= WARNING_TIME);
    }
  }
}

function startTimer(section) {
  if (timerRunning) return;
  
  const saved = loadProgress();
  const now = Date.now();
  if (saved && saved.section === section && saved.timerEnd && saved.timerEnd > now) {
    timerRemaining = Math.floor((saved.timerEnd - now) / 1000);
  } else {
    timerRemaining = SECTION_TIMES[section] || SECTION_TIMES.WRITING;
    if (saved) {
      saved.timerEnd = null;
      localStorage.setItem('metQuizProgress', JSON.stringify(saved));
    }
  }
  
  timerRunning = true;
  updateTimerDisplay();
  
  timerInterval = setInterval(() => {
    timerRemaining--;
    updateTimerDisplay();
    
    if (timerRemaining <= 0) {
      stopTimer();
      showTimeModal();
    }
  }, 1000);
}

function pauseTimer() {
  timerRunning = false;
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  saveTimerProgress();
}

function stopTimer() {
  pauseTimer();
  timerRemaining = 0;
  updateTimerDisplay();
}

function resumeTimer() {
  if (timerRemaining > 0 && !timerRunning) {
    timerRunning = true;
    updateTimerDisplay();
    timerInterval = setInterval(() => {
      timerRemaining--;
      updateTimerDisplay();
      if (timerRemaining <= 0) {
        stopTimer();
        showTimeModal();
      }
    }, 1000);
  }
}

function saveTimerProgress() {
  if (currentSection && timerRemaining > 0) {
    const saved = loadProgress() || {};
    saved.timerEnd = Date.now() + (timerRemaining * 1000);
    saved.section = currentSection;
    saved.currentSection = currentSection;
    localStorage.setItem('metQuizProgress', JSON.stringify(saved));
  }
}

function showTimeModal() {
  getElement('time-modal').classList.remove('hidden');
  getElement('timer-display').textContent = '00:00';
}

function hideTimeModal() {
  getElement('time-modal').classList.add('hidden');
}

let questions = [];
let currentQuestionIndex = 0;
let selectedOptionIndex = null;
let score = { WRITING: 0, LISTENING: 0, READING_AND_GRAMMAR: 0, SPEAKING: 0 };
let answeredQuestions = new Set();
let shuffledQuestions = [];
let currentSection = null;
let currentPartKey = null;
let currentPartQuestionIndex = 0;
let answersByPart = {};
let timerInterval = null;
let timerRemaining = 0;
let timerRunning = false;
let currentExerciseIndex = 0;
let currentAudioSrc = null;
let currentAudioElement = null;
let sectionPreviewMode = false;

let currentUser = null;
let pendingSection = null;

let currentGroup = null;
let sectionResponses = [];
let currentWritingStep = 0;
let currentPreviewIndex = 0;

const letters = ['A', 'B', 'C', 'D'];

const APPS_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL';

const TASK1_CHAR_LIMIT = 750;
const TASK2_CHAR_LIMIT = 3500;

const WRITING_STEPS = {
  TASK1_Q1: 0,
  TASK1_Q2: 1,
  TASK1_Q3: 2,
  TASK2: 3,
  PREVIEW: 4
};

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function shuffleOptions(question) {
  const optionsWithIndex = question.options.map((opt, i) => ({ text: opt, originalIndex: i }));
  const shuffled = shuffleArray(optionsWithIndex);
  return {
    ...question,
    shuffledOptions: shuffled.map(opt => opt.text),
    correctShuffledIndex: shuffled.findIndex(opt => opt.originalIndex === question.correct),
    originalCorrectIndex: question.correct
  };
}

function saveProgress() {
  const progress = {
    currentIndex: currentQuestionIndex,
    currentSection: currentSection,
    currentPartKey: currentPartKey,
    currentPartQuestionIndex: currentPartQuestionIndex,
    currentExerciseIndex: currentExerciseIndex,
    score: score,
    answeredQuestions: Array.from(answeredQuestions),
    answersByPart: answersByPart,
    timerRemaining: timerRemaining,
    questionsOrder: shuffledQuestions.map(q => ({ exerciseIndex: q.exerciseIndex, questionIndex: q.questionIndex })),
    writingStep: currentWritingStep,
    writingResponses: sectionResponses,
    writingGroupId: currentGroup?.id || null
  };
  localStorage.setItem('metQuizProgress', JSON.stringify(progress));
}

function loadProgress() {
  const saved = localStorage.getItem('metQuizProgress');
  return saved ? JSON.parse(saved) : null;
}

function clearProgress() {
  localStorage.removeItem('metQuizProgress');
}

function resetAllProgress() {
  const modal = getElement('confirm-modal');
  const modalText = getElement('confirm-text');
  const modalOk = getElement('confirm-ok');
  const modalCancel = getElement('confirm-cancel');
  
  modalText.textContent = 'Reset all progress? This cannot be undone.';
  
  modal.classList.remove('hidden');
  
  const handleOk = () => {
    modal.classList.add('hidden');
    clearProgress();
    score = { WRITING: 0, LISTENING: 0, READING_AND_GRAMMAR: 0, SPEAKING: 0 };
    answeredQuestions = new Set();
    sectionResponses = [];
    currentWritingStep = 0;
    currentQuestionIndex = 0;
    renderCategorySelect();
  };
  
  modalOk.onclick = handleOk;
  modalCancel.onclick = () => modal.classList.add('hidden');
}

function resetSectionProgress() {
  if (!currentSection) return;
  
  const modal = getElement('confirm-modal');
  const modalText = getElement('confirm-text');
  const modalOk = getElement('confirm-ok');
  const modalCancel = getElement('confirm-cancel');
  
  modalText.textContent = `Reset progress for ${currentSection}? This cannot be undone.`;
  
  modal.classList.remove('hidden');
  
  const handleOk = () => {
    modal.classList.add('hidden');
    clearProgress();
    score = { WRITING: 0, LISTENING: 0, READING_AND_GRAMMAR: 0, SPEAKING: 0 };
    answeredQuestions = new Set();
    sectionResponses = [];
    currentWritingStep = 0;
    currentQuestionIndex = 0;
    beginQuiz(currentSection);
  };
  
  modalOk.onclick = handleOk;
  modalCancel.onclick = () => modal.classList.add('hidden');
}

function getElement(id) {
  return document.getElementById(id);
}

function saveUser(user) {
  localStorage.setItem('metQuizUser', JSON.stringify(user));
  currentUser = user;
  updateUserDisplay();
}

function loadUser() {
  const saved = localStorage.getItem('metQuizUser');
  if (saved) {
    currentUser = JSON.parse(saved);
    return currentUser;
  }
  return null;
}

function isValidName(name) {
  if (!name || name.length < 2) return false;
  const cleanName = name.trim();
  if (/^\d+$/.test(cleanName)) return false;
  if (/^(.)\1+$/i.test(cleanName)) return false;
  return true;
}

function updateUserDisplay() {
  if (currentUser) {
    getElement('user-info').classList.remove('hidden');
    const displayName = currentUser.name.length > 12 ? currentUser.name.substring(0, 12) + '...' : currentUser.name;
    getElement('user-name').textContent = displayName;
    getElement('quiz-user-name').textContent = 'Hi ' + currentUser.name + '!';
  } else {
    getElement('user-info').classList.add('hidden');
    getElement('quiz-user-name').textContent = '';
  }
}

async function logActivity(action, detail = '') {
  if (!currentUser) return;
  
  const data = {
    timestamp: new Date().toISOString(),
    name: currentUser.name,
    email: currentUser.email,
    category: currentSection || '',
    action: action,
    detail: detail
  };

  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch (error) {
    console.log('Activity logged locally:', data);
  }
}

async function logWritingResponse(questionNum, task, response) {
  if (!currentUser || !currentGroup) return;
  
  const data = {
    timestamp: new Date().toISOString(),
    name: currentUser.name,
    email: currentUser.email,
    category: 'WRITING',
    action: 'RESPUESTA',
    detail: JSON.stringify({
      groupId: currentGroup.id,
      task: task,
      question: questionNum,
      response: response
    })
  };

  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch (error) {
    console.log('Writing response logged locally:', data);
  }
}

function showRegistrationModal() {
  getElement('registration-modal').classList.remove('hidden');
  getElement('reg-name').value = '';
  getElement('reg-email').value = '';
  getElement('reg-name').focus();
}

function hideRegistrationModal() {
  getElement('registration-modal').classList.add('hidden');
}

function showHelpModal() {
  getElement('help-modal').classList.remove('hidden');
  getElement('help-text').value = '';
  getElement('help-text').focus();
}

function hideHelpModal() {
  getElement('help-modal').classList.add('hidden');
}

function showChangeUserModal() {
  getElement('change-user-modal').classList.remove('hidden');
  getElement('change-name').value = currentUser?.name || '';
  getElement('change-email').value = currentUser?.email || '';
  getElement('change-name').focus();
}

function hideChangeUserModal() {
  getElement('change-user-modal').classList.add('hidden');
}

function updateProgressBar() {
  getElement('progress-bar').style.width = '0%';
  getElement('progress-text').textContent = '';
}

function updateWritingProgress() {
  const writingData = quizData.WRITING;
  
  let progressText = '';
  let percentage = 0;

  switch (currentWritingStep) {
    case WRITING_STEPS.TASK1_Q1:
      progressText = 'Task 1: Q1/3';
      percentage = 10;
      break;
    case WRITING_STEPS.TASK1_Q2:
      progressText = 'Task 1: Q2/3';
      percentage = 30;
      break;
    case WRITING_STEPS.TASK1_Q3:
      progressText = 'Task 1: Q3/3';
      percentage = 50;
      break;
    case WRITING_STEPS.TASK2:
      progressText = 'Task 2: Essay';
      percentage = 75;
      break;
    case WRITING_STEPS.PREVIEW:
      progressText = 'Revisar';
      percentage = 100;
      break;
  }

  getElement('category-badge').textContent = 'WRITING';
  getElement('progress-text').textContent = progressText;
  getElement('progress-bar').style.width = percentage + '%';
}

function flattenQuestions(category, data) {
  const flattened = [];
  data.forEach((exercise, exerciseIndex) => {
    if (exercise.questions) {
      exercise.questions.forEach((q, qIndex) => {
        flattened.push({
          ...q,
          exerciseIndex: exerciseIndex,
          questionIndex: qIndex,
          category: category,
          audio: exercise.audio || null,
          text: exercise.text || null,
          lectureText: exercise.lectureText || null,
          instructions: exercise.instructions || null
        });
      });
    }
  });
  return flattened;
}

async function loadAllData() {
  try {
    const [writing, listening, readingAndGrammar, speaking] = await Promise.all([
      fetch('data/writing.json').then(r => r.json()).catch(() => null),
      fetch('data/listening.json').then(r => r.json()).catch(() => []),
      fetch('data/reading.json').then(r => r.json()).catch(() => []),
      fetch('data/speaking.json').then(r => r.json()).catch(() => [])
    ]);

    quizData.WRITING = writing;
    quizData.LISTENING = listening;
    quizData.READING_AND_GRAMMAR = readingAndGrammar;
    quizData.SPEAKING = speaking;

    return true;
  } catch (error) {
    console.error('Error loading data:', error);
    return false;
  }
}

function renderCategorySelect() {
  getElement('quiz-view').classList.add('hidden');
  getElement('results-container').classList.add('hidden');
  getElement('category-select').classList.remove('hidden');

  const container = getElement('category-buttons');
  container.innerHTML = '';

  const sections = [
    { key: 'WRITING', name: 'Writing', parts: SECTION_PARTS.WRITING },
    { key: 'LISTENING', name: 'Listening', parts: SECTION_PARTS.LISTENING },
    { key: 'READING_AND_GRAMMAR', name: 'Reading & Grammar', parts: SECTION_PARTS.READING_AND_GRAMMAR },
    { key: 'SPEAKING', name: 'Speaking', parts: SECTION_PARTS.SPEAKING }
  ];

  sections.forEach(sec => {
    const sectionRow = document.createElement('div');
    sectionRow.className = 'section-row';
    
    const titleRow = document.createElement('div');
    titleRow.className = 'section-title';
    titleRow.textContent = sec.name;
    sectionRow.appendChild(titleRow);

    const partsContainer = document.createElement('div');
    partsContainer.className = 'section-parts';
    
    sec.parts.forEach(part => {
      const config = SECTION_CONFIG[part.key];
      const hasContent = hasSectionContent(part.key);
      const saved = loadProgress();
      const partProgress = getPartProgress(part.key, saved);
      const percent = partProgress.percent;
      const label = percent > 0 ? `${percent}%` : '';
      
      const btn = document.createElement('button');
      btn.className = 'category-btn part-btn';
      
      btn.innerHTML = label 
        ? `<strong>${part.name}</strong><span class="progress-badge">${label}</span>` 
        : `<strong>${part.name}</strong>`;
      
      if (!hasContent) {
        btn.style.opacity = '0.5';
        btn.style.pointerEvents = 'none';
        btn.innerHTML = `<strong>${part.name}</strong><span class="progress-badge">Soon</span>`;
      }
      
      btn.addEventListener('click', () => startFromSection(part.key));
      partsContainer.appendChild(btn);
    });
    
    sectionRow.appendChild(partsContainer);
    container.appendChild(sectionRow);
  });
}

function hasSectionContent(partKey) {
  const section = getSectionKey(partKey);
  if (section === 'WRITING') return quizData.WRITING && quizData.WRITING.groups && quizData.WRITING.groups.length > 0;
  if (section === 'LISTENING') return quizData.LISTENING && quizData.LISTENING.parts && quizData.LISTENING.parts.length > 0;
  return false;
}

function getPartProgress(partKey, saved) {
  if (!saved) return { answered: 0, total: 0, percent: 0 };
  
  const section = getSectionKey(partKey);
  const config = SECTION_CONFIG[partKey];
  const total = config ? config.items : 0;
  
  if (!saved.answersByPart || !saved.answersByPart[partKey]) {
    return { answered: 0, total, percent: 0 };
  }
  
  const answered = saved.answersByPart[partKey].length;
  const percent = answered > 0 && total > 0 ? Math.round((answered / total) * 100) : 0;
  return { answered, total, percent };
}

function startFromSection(section) {
  pendingSection = section;
  
  if (!currentUser) {
    showRegistrationModal();
    return;
  }
  
  beginQuiz(section);
}

function beginQuiz(section) {
  const saved = loadProgress();
  const config = SECTION_CONFIG[section];
  
  sectionPreviewMode = false;
  currentPartKey = section;
  currentSection = getSectionKey(section) || section;
  currentPartQuestionIndex = 0;
  currentQuestionIndex = 0;
  selectedOptionIndex = null;
  currentAudioSrc = null;
  currentAudioElement = null;
  
  if (saved) {
    score = saved.score || { WRITING: 0, LISTENING: 0, READING_AND_GRAMMAR: 0, SPEAKING: 0 };
    answersByPart = saved.answersByPart || {};
    timerRemaining = saved.timerRemaining || SECTION_TIMES[currentSection];
  } else {
    score = { WRITING: 0, LISTENING: 0, READING_AND_GRAMMAR: 0, SPEAKING: 0 };
    answersByPart = {};
    timerRemaining = SECTION_TIMES[currentSection];
  }

  if (section === 'WRITING_TASK1' || section === 'WRITING_TASK2') {
    beginWriting(section, saved, config);
    return;
  }

  if (section.startsWith('LISTENING_P')) {
    beginListening(section, saved, config);
    return;
  }

  alert('Esta sección aún no tiene contenido.');
}

function beginWriting(section, saved, config) {
  if (!quizData.WRITING || !quizData.WRITING.groups || quizData.WRITING.groups.length === 0) {
    alert('La sección de Writing aún no tiene contenido.');
    return;
  }
  
  const isTask2 = section === 'WRITING_TASK2';
  const hasSavedProgress = saved && saved.currentPartKey === section;
  
  if (hasSavedProgress && saved.writingGroupId) {
    const group = quizData.WRITING.groups.find(g => g.id === saved.writingGroupId);
    if (group) {
      currentGroup = group;
      sectionResponses = saved.writingResponses || [];
      currentWritingStep = saved.writingStep || (isTask2 ? WRITING_STEPS.TASK2 : WRITING_STEPS.TASK1_Q1);
    } else {
      currentGroup = shuffleArray([...quizData.WRITING.groups])[0];
      sectionResponses = [];
      currentWritingStep = isTask2 ? WRITING_STEPS.TASK2 : WRITING_STEPS.TASK1_Q1;
    }
  } else {
    currentGroup = shuffleArray([...quizData.WRITING.groups])[0];
    sectionResponses = [];
    currentWritingStep = isTask2 ? WRITING_STEPS.TASK2 : WRITING_STEPS.TASK1_Q1;
  }
  currentPreviewIndex = 0;
  
  getElement('category-select').classList.add('hidden');
  getElement('quiz-view').classList.remove('hidden');
  getElement('results-container').classList.add('hidden');
  
  setupInstructionsPanel();
  const partName = isTask2 ? 'Task 2' : 'Task 1';
  logActivity('INICIO', `WRITING ${partName} - Grupo: ${currentGroup.id}`);
  renderWritingStep();
  updatePrevButtonVisibility();
  startTimer('WRITING');
}

function beginListening(section, saved, config) {
  if (!quizData.LISTENING || !quizData.LISTENING.parts || quizData.LISTENING.parts.length === 0) {
    alert('La sección de Listening aún no tiene contenido.');
    return;
  }
  
  const partId = config.partId;
  const partData = quizData.LISTENING.parts.find(p => p.id === partId);
  
  if (!partData) {
    alert('Parte no encontrada.');
    return;
  }
  
  const hasSavedProgress = saved && saved.currentPartKey === section;
  currentPartQuestionIndex = hasSavedProgress ? (saved.currentPartQuestionIndex || 0) : 0;
  answeredQuestions = new Set();
  
  let partQuestions = [];
  let audioGroups = [];
  
  if (partId === 1) {
    partQuestions = partData.questions.map(q => ({ ...q, category: `Listening P${partId}` }));
  } else {
    audioGroups = partData.audioGroups || [];
    partQuestions = audioGroups.flatMap(group => 
      group.questions.map(q => ({ ...q, groupNumber: group.number, mainAudio: group.mainAudio, extraAudio: q.extraAudio, category: `Listening P${partId}` }))
    );
  }
  
  shuffledQuestions = partQuestions.map((q, i) => {
    const optionsCopy = [...q.options];
    const correctCopy = q.correct;
    return { ...q, shuffledOptions: optionsCopy, correctShuffledIndex: correctCopy, originalIndex: i, questionCategory: q.category };
  });
  
  getElement('category-select').classList.add('hidden');
  getElement('quiz-view').classList.remove('hidden');
  getElement('results-container').classList.add('hidden');
  
  setupInstructionsPanel();
  logActivity('INICIO', `LISTENING Part ${partId}`);
  loadQuestion();
  updatePrevButtonVisibility();
  updateHash(section, 1);
  startTimer('LISTENING');
}

function setupInstructionsPanel() {
  const contentEl = getElement('instructions-content');
  const contentPara = contentEl.querySelector('p');
  const sectionData = quizData[currentSection];
  
  if (contentPara && sectionData && sectionData.instructions) {
    contentPara.innerHTML = sectionData.instructions.replace(/\n/g, '<br>');
    getElement('section-instructions-panel').classList.remove('hidden');
  } else {
    getElement('section-instructions-panel').classList.add('hidden');
  }
  
  const toggleBtn = getElement('toggle-instructions');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function() {
      const icon = this.querySelector('.toggle-icon');
      if (contentEl.classList.contains('hidden')) {
        contentEl.classList.remove('hidden');
        icon.textContent = '^';
      } else {
        contentEl.classList.add('hidden');
        icon.textContent = 'v';
      }
    });
  }
}

function renderWritingStep() {
  const container = getElement('quiz-container');
  container.classList.remove('fade-out');
  void container.offsetWidth;
  container.classList.add('fade-out');
  setTimeout(() => {
    container.classList.remove('fade-out');
    container.style.animation = 'none';
    void container.offsetWidth;
    container.style.animation = 'fadeIn 0.5s ease';
  }, 300);

  updateWritingProgress();
  getElement('audio-container').classList.add('hidden');
  getElement('transcription-toggle').classList.add('hidden');
  getElement('transcription-text').classList.add('hidden');
  getElement('reading-text').classList.add('hidden');
  getElement('feedback-container').classList.add('hidden');
  getElement('section-instructions-panel').classList.remove('hidden');

  let html = '';

  switch (currentWritingStep) {
    case WRITING_STEPS.TASK1_Q1:
      html = renderWritingTask1(0);
      break;
    case WRITING_STEPS.TASK1_Q2:
      html = renderWritingTask1(1);
      break;
    case WRITING_STEPS.TASK1_Q3:
      html = renderWritingTask1(2);
      break;
    case WRITING_STEPS.TASK2:
      html = renderWritingTask2();
      break;
    case WRITING_STEPS.PREVIEW:
      html = renderWritingPreview();
      break;
  }

  getElement('question-text').innerHTML = '';
  getElement('options-container').innerHTML = html;
  updatePrevButtonVisibility();

  if (currentWritingStep === WRITING_STEPS.PREVIEW) {
    getElement('controls').classList.remove('hidden');
    getElement('check-btn').classList.add('hidden');
    getElement('next-btn').classList.add('hidden');
    getElement('prev-btn').classList.add('hidden');
    getElement('section-instructions-panel').classList.add('hidden');
    setupCarouselEvents();
  } else {
    getElement('controls').classList.remove('hidden');
    getElement('check-btn').classList.add('hidden');
    getElement('next-btn').classList.add('hidden');
    getElement('prev-btn').classList.remove('hidden');
    setupWritingTextareaEvents();
  }
  
  updatePrevButtonVisibility();
}

function setupWritingTextareaEvents() {
  const textarea = document.getElementById('writing-textarea');
  const counter = document.getElementById('char-count');
  const counterContainer = document.querySelector('.char-counter');
  
  if (!textarea) return;
  
  const limit = textarea.classList.contains('writing-textarea-large') ? TASK2_CHAR_LIMIT : TASK1_CHAR_LIMIT;
  
  textarea.addEventListener('input', function() {
    const count = this.value.length;
    if (counter) counter.textContent = count;
    if (counterContainer) counterContainer.classList.toggle('visible', count > limit * 0.9);
  });
  
  textarea.focus();
}

function renderWritingTask1(qIndex) {
  const question = currentGroup.task1[qIndex];
  const existingResponse = sectionResponses[qIndex] || '';
  const charCount = existingResponse.length;
  const showCounter = charCount > TASK1_CHAR_LIMIT * 0.9;
  
  return `
    <div class="writing-question">
      <p class="writing-question-text">${question.text}</p>
      <textarea 
        id="writing-textarea" 
        class="writing-textarea"
        placeholder="Escribe tu respuesta aquí..."
        maxlength="${TASK1_CHAR_LIMIT}"
      >${existingResponse}</textarea>
      <div class="char-counter ${showCounter ? 'visible' : ''}">
        <span id="char-count">${charCount}</span> / ${TASK1_CHAR_LIMIT}
      </div>
    </div>
  `;
}

function renderWritingTask2() {
  const task2 = currentGroup.task2;
  const existingResponse = sectionResponses[3] || '';
  const charCount = existingResponse.length;
  const showCounter = charCount > TASK2_CHAR_LIMIT * 0.9;
  
  return `
    <div class="writing-question">
      <p class="writing-question-text">${task2.topic}</p>
      <p class="writing-task-prompt">${task2.prompt}</p>
      <textarea 
        id="writing-textarea" 
        class="writing-textarea writing-textarea-large"
        placeholder="Escribe tu essay aquí..."
        maxlength="${TASK2_CHAR_LIMIT}"
      >${existingResponse}</textarea>
      <div class="char-counter ${showCounter ? 'visible' : ''}">
        <span id="char-count">${charCount}</span> / ${TASK2_CHAR_LIMIT}
      </div>
    </div>
  `;
}

function renderWritingPreview() {
  currentPreviewIndex = 0;
  return renderCarouselSlide();
}

function renderCarouselSlide() {
  const task1 = currentGroup.task1;
  const task2 = currentGroup.task2;
  
  const slides = [
    {
      title: `Task 1: Pregunta 1 de 3`,
      question: task1[0].text,
      response: sectionResponses[0] || 'Sin respuesta'
    },
    {
      title: `Task 1: Pregunta 2 de 3`,
      question: task1[1].text,
      response: sectionResponses[1] || 'Sin respuesta'
    },
    {
      title: `Task 1: Pregunta 3 de 3`,
      question: task1[2].text,
      response: sectionResponses[2] || 'Sin respuesta'
    },
    {
      title: `Task 2: Ensayo`,
      question: `${task2.topic}\n\n${task2.prompt}`,
      response: sectionResponses[3] || 'Sin respuesta'
    }
  ];

const slide = slides[currentPreviewIndex];
  
  return `
    <div class="carousel-container">
      <h3 class="carousel-title">Revisa tus respuestas</h3>
      <div class="carousel-viewer">
        <button id="carousel-prev" class="carousel-btn carousel-btn-left">&lt;</button>
        <div class="carousel-slide">
          <div class="slide-header">${slide.title}</div>
          <div class="slide-question">${slide.question.replace(/\n/g, '<br>')}</div>
          <div class="slide-response">${slide.response.replace(/\n/g, '<br>')}</div>
        </div>
        <button id="carousel-next" class="carousel-btn carousel-btn-right">&gt;</button>
      </div>
      <div class="edit-section">
        <span id="edit-response-text" class="edit-link">Editar esta respuesta</span>
      </div>
      <div class="carousel-indicators">
        ${slides.map((_, i) => `<span class="indicator ${i === currentPreviewIndex ? 'active' : ''}" data-index="${i}"></span>`).join('')}
      </div>
    </div>
  `;
}

function setupCarouselEvents() {
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');
  const editText = document.getElementById('edit-response-text');
  const indicators = document.querySelectorAll('.indicator');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => navigateCarousel(-1));
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => navigateCarousel(1));
  }
  if (editText) {
    editText.addEventListener('click', editCurrentResponse);
  }
  
  indicators.forEach(ind => {
    ind.addEventListener('click', () => {
      const index = parseInt(ind.dataset.index);
      currentPreviewIndex = index;
      updateCarouselDisplay();
    });
  });

  document.addEventListener('keydown', handleCarouselKeydown);
}

function editCurrentResponse() {
  document.removeEventListener('keydown', handleCarouselKeydown);
  saveCurrentWritingResponse();
  
  switch (currentPreviewIndex) {
    case 0:
      currentWritingStep = WRITING_STEPS.TASK1_Q1;
      break;
    case 1:
      currentWritingStep = WRITING_STEPS.TASK1_Q2;
      break;
    case 2:
      currentWritingStep = WRITING_STEPS.TASK1_Q3;
      break;
    case 3:
      currentWritingStep = WRITING_STEPS.TASK2;
      break;
  }
  
  renderWritingStep();
  
  const taskPart = currentWritingStep === WRITING_STEPS.TASK2 ? 'task2' : 'task1';
  const qNum = currentWritingStep === WRITING_STEPS.TASK2 ? 1 : currentWritingStep + 1;
  updateWritingHash(taskPart, qNum);
}

function getNextPartKey() {
  const parts = SECTION_PARTS[currentSection];
  if (!parts) return null;
  const currentIndex = parts.findIndex(p => p.key === currentPartKey);
  if (currentIndex < 0 || currentIndex >= parts.length - 1) return null;
  return parts[currentIndex + 1];
}

function isLastPartOfSection() {
  return getNextPartKey() === null;
}

function updatePrevButtonVisibility() {
  const prevBtn = getElement('prev-btn');
  const submitBtn = getElement('submit-section-btn');
  const checkBtn = getElement('check-btn');
  const nextBtn = getElement('next-btn');
  const skipBtn = getElement('skip-btn');
  
  if (currentSection === 'WRITING') {
    const isPreview = currentWritingStep === WRITING_STEPS.PREVIEW;
    const isLastTask = currentWritingStep === WRITING_STEPS.TASK2;
    
    if (isPreview) {
      prevBtn?.classList.add('hidden');
      checkBtn?.classList.add('hidden');
      nextBtn?.classList.add('hidden');
      submitBtn?.classList.remove('hidden');
      skipBtn?.classList.add('hidden');
    } else if (isLastTask) {
      prevBtn?.classList.remove('hidden');
      checkBtn?.classList.add('hidden');
      nextBtn?.classList.add('hidden');
      submitBtn?.classList.add('hidden');
      skipBtn?.classList.remove('hidden');
      skipBtn.textContent = 'Finalizar sección';
      skipBtn.classList.remove('btn-secondary');
      skipBtn.classList.add('btn-primary');
    } else {
      prevBtn?.classList.toggle('hidden', currentWritingStep === WRITING_STEPS.TASK1_Q1);
      checkBtn?.classList.add('hidden');
      nextBtn?.classList.remove('hidden');
      submitBtn?.classList.add('hidden');
      if (skipBtn) {
        skipBtn.classList.remove('hidden');
        skipBtn.textContent = '⏭ Finalizar sección';
        skipBtn.classList.remove('btn-primary');
        skipBtn.classList.add('btn-secondary');
      }
    }
  } else if (currentSection && !sectionPreviewMode) {
    const isLast = currentQuestionIndex >= shuffledQuestions.length - 1;
    const alreadyAnswered = answeredQuestions.has(currentQuestionIndex);
    const hasNextPart = getNextPartKey();
    
    if (isLast) {
      prevBtn?.classList.remove('hidden');
      checkBtn?.classList.toggle('hidden', alreadyAnswered);
      nextBtn?.classList.toggle('hidden', alreadyAnswered);
      submitBtn?.classList.remove('hidden');
      skipBtn?.classList.remove('hidden');
      skipBtn.textContent = hasNextPart ? `${alreadyAnswered ? '' : '⏭ '}Siguiente: ${hasNextPart.name}` : 'Finalizar sección';
      skipBtn.classList.remove('btn-secondary');
      skipBtn.classList.add('btn-primary');
    } else {
      prevBtn?.classList.toggle('hidden', currentQuestionIndex === 0);
      checkBtn?.classList.remove('hidden');
      nextBtn?.classList.remove('hidden');
      submitBtn?.classList.add('hidden');
      if (skipBtn) {
        skipBtn.classList.remove('hidden');
        skipBtn.textContent = hasNextPart ? `⏭ Siguiente: ${hasNextPart.name}` : '⏭ Finalizar sección';
        skipBtn.classList.remove('btn-primary');
        skipBtn.classList.add('btn-secondary');
      }
    }
  } else if (sectionPreviewMode) {
    prevBtn?.classList.add('hidden');
    checkBtn?.classList.add('hidden');
    nextBtn?.classList.add('hidden');
    submitBtn?.classList.remove('hidden');
    skipBtn?.classList.add('hidden');
  }
}

function handleCarouselKeydown(e) {
  if (currentSection !== 'WRITING' || currentWritingStep !== WRITING_STEPS.PREVIEW) {
    document.removeEventListener('keydown', handleCarouselKeydown);
    return;
  }
  
  if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
    navigateCarousel(-1);
  } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
    navigateCarousel(1);
  }
}

function navigateCarousel(direction) {
  const totalSlides = 4;
  currentPreviewIndex = (currentPreviewIndex + direction + totalSlides) % totalSlides;
  
  updateCarouselDisplay();
}

function updateCarouselDisplay() {
  const slideContainer = document.querySelector('.carousel-slide');
  const indicators = document.querySelectorAll('.indicator');
  
  if (slideContainer) {
    const task1 = currentGroup.task1;
    const task2 = currentGroup.task2;
    
    const slides = [
      { title: `Task 1: Pregunta 1 de 3`, question: task1[0].text, response: sectionResponses[0] || 'Sin respuesta' },
      { title: `Task 1: Pregunta 2 de 3`, question: task1[1].text, response: sectionResponses[1] || 'Sin respuesta' },
      { title: `Task 1: Pregunta 3 de 3`, question: task1[2].text, response: sectionResponses[2] || 'Sin respuesta' },
      { title: `Task 2: Ensayo`, question: `${task2.topic}\n\n${task2.prompt}`, response: sectionResponses[3] || 'Sin respuesta' }
    ];
    
    const slide = slides[currentPreviewIndex];
    slideContainer.innerHTML = `
      <div class="slide-header">${slide.title}</div>
      <div class="slide-question">${slide.question.replace(/\n/g, '<br>')}</div>
      <div class="slide-response">${slide.response.replace(/\n/g, '<br>')}</div>
    `;
    
    indicators.forEach((ind, i) => {
      ind.classList.toggle('active', i === currentPreviewIndex);
    });
  }
}

function saveCurrentWritingResponse() {
  const textarea = document.getElementById('writing-textarea');
  if (!textarea) return;
  
  const value = textarea.value;
  
  if (currentWritingStep >= WRITING_STEPS.TASK1_Q1 && currentWritingStep <= WRITING_STEPS.TASK1_Q3) {
    sectionResponses[currentWritingStep] = value;
    logWritingResponse(currentWritingStep + 1, 1, value);
  } else if (currentWritingStep === WRITING_STEPS.TASK2) {
    sectionResponses[3] = value;
    logWritingResponse(1, 2, value);
  }
  
  saveProgress();
}

function nextSectionStep() {
  if (currentSection !== 'WRITING') return;
  
  saveCurrentWritingResponse();
  saveProgress();
  
  let taskPart = 'task1';
  let qNum = 1;
  
  if (currentWritingStep === WRITING_STEPS.INSTRUCTIONS) {
    currentWritingStep = WRITING_STEPS.TASK1_Q1;
    qNum = 1;
    renderWritingStep();
    updateWritingHash(taskPart, qNum);
    return;
  }

  if (currentWritingStep >= WRITING_STEPS.TASK1_Q1 && currentWritingStep <= WRITING_STEPS.TASK1_Q3) {
    if (currentWritingStep < WRITING_STEPS.TASK1_Q3) {
      currentWritingStep++;
      qNum = currentWritingStep + 1;
    } else {
      currentWritingStep = WRITING_STEPS.TASK2;
      taskPart = 'task2';
      qNum = 1;
    }
    renderWritingStep();
    updateWritingHash(taskPart, qNum);
    return;
  }

  if (currentWritingStep === WRITING_STEPS.TASK2) {
    currentWritingStep = WRITING_STEPS.PREVIEW;
    renderWritingStep();
    window.location.hash = '#/writing/preview';
    return;
  }
  
  if (currentWritingStep === WRITING_STEPS.PREVIEW) {
    updatePrevButtonVisibility();
    return;
  }
}

async function submitWritingResponses() {
  logActivity('FIN', `WRITING - Grupo: ${currentGroup.id} - Completado`);
  
  for (let i = 0; i < sectionResponses.length; i++) {
    await logWritingResponse(i < 3 ? i + 1 : 1, i < 3 ? 1 : 2, sectionResponses[i]);
  }

  showWritingResults();
}

function showWritingResults() {
  pauseTimer();
  window.location.hash = '#/writing/preview';
  
  getElement('quiz-view').classList.add('hidden');
  getElement('results-container').classList.remove('hidden');

  const part1Count = currentGroup?.task1?.length || 0;
  const part2Count = currentGroup?.task2 ? 1 : 0;
  const totalParts = part1Count + part2Count;
  const answered = sectionResponses.filter(r => r && r.length > 0).length;
  const part1Answered = Math.min(answered, part1Count);
  const part2Answered = answered > part1Count ? 1 : 0;
  const totalAnswered = part1Answered + part2Answered;
  const percentage = totalParts > 0 ? Math.round((totalAnswered / totalParts) * 100) : 0;

  getElement('score-display').textContent = `${percentage}% (${totalAnswered}/${totalParts})`;
  
  const breakdown = getElement('results-breakdown');
  breakdown.innerHTML = `
    <div class="result-category">
      <span class="result-category-name">WRITING</span>
      <span class="result-category-score">${part1Answered}/${part1Count} • ${part2Answered}/${part2Count}</span>
    </div>
  `;
  
  getElement('email-btn').classList.remove('hidden');
}

function loadQuestion() {
  sectionPreviewMode = false;
  const question = shuffledQuestions[currentQuestionIndex];

  getElement('quiz-container').classList.remove('fade-out');
  void getElement('quiz-container').offsetWidth;
  getElement('quiz-container').classList.add('fade-out');
  setTimeout(() => {
    getElement('quiz-container').classList.remove('fade-out');
    getElement('quiz-container').style.animation = 'none';
    void getElement('quiz-container').offsetWidth;
    getElement('quiz-container').style.animation = 'fadeIn 0.5s ease';
  }, 300);

  getElement('category-badge').textContent = question.questionCategory || question.category || 'Listening';

  getElement('transcription-toggle').innerHTML = '';
  getElement('transcription-toggle').classList.add('hidden');
  getElement('transcription-text').classList.add('hidden');
  getElement('reading-text').classList.add('hidden');

  getElement('controls').classList.remove('hidden');

  const audioSrc = question.audio || question.mainAudio;
  if (audioSrc) {
    if (currentAudioSrc !== audioSrc) {
      currentAudioSrc = audioSrc;
      
      let fullPath = audioSrc;
      if (currentPartKey && currentPartKey.startsWith('LISTENING_P')) {
        const partNum = currentPartKey.replace('LISTENING_P', '');
        fullPath = `data/audios/listening-p${partNum}/${audioSrc}`;
      }
      
      let audioHTML = `<audio id="main-audio" controls src="${fullPath}"></audio>`;
      
      if (question.extraAudio) {
        const extraPath = `data/audios/listening-p${currentPartKey.replace('LISTENING_P', '')}/${question.extraAudio}`;
        audioHTML += `<audio id="extra-audio" controls src="${extraPath}" class="extra-audio"></audio>`;
      }
      
      getElement('audio-container').innerHTML = audioHTML;
      currentAudioElement = document.getElementById('main-audio');
    }
    getElement('audio-container').classList.remove('hidden');
  } else {
    getElement('audio-container').classList.add('hidden');
    currentAudioSrc = null;
    currentAudioElement = null;
  }

  getElement('transcription-toggle').classList.add('hidden');
  getElement('question-text').textContent = question.question;
  getElement('question-text').classList.remove('hidden');

  const optionsContainer = getElement('options-container');
  optionsContainer.innerHTML = '';

  question.shuffledOptions.forEach((opt, i) => {
    const optionDiv = document.createElement('div');
    optionDiv.className = 'option';
    optionDiv.innerHTML = `<span class="option-letter">${letters[i]}</span><span>${opt}</span>`;
    optionDiv.addEventListener('click', () => selectOption(i, optionDiv));
    optionsContainer.appendChild(optionDiv);
  });

  getElement('feedback-container')?.classList.add('hidden');
  getElement('check-btn')?.classList.remove('hidden');
  getElement('next-btn')?.classList.add('hidden');

  if (answeredQuestions.has(currentQuestionIndex)) {
    const options = document.querySelectorAll('.option');
    options.forEach(opt => opt.classList.add('selected', 'disabled'));
    getElement('check-btn')?.classList.add('hidden');
    getElement('next-btn')?.classList.remove('hidden');
  }
  
  updateProgressBar();
  saveProgress();
  updatePrevButtonVisibility();
}

function toggleTranscription() {
  const transcriptionText = getElement('transcription-text');
  const transcriptionBtn = document.getElementById('transcription-btn');
  
  if (transcriptionText.classList.contains('hidden')) {
    transcriptionText.classList.remove('hidden');
    transcriptionBtn.classList.add('active');
  } else {
    transcriptionText.classList.add('hidden');
    transcriptionBtn.classList.remove('active');
  }
}

function selectOption(index, element) {
  if (element.classList.contains('disabled')) return;

  document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
  element.classList.add('selected');
  selectedOptionIndex = index;
}

function checkAnswer() {
  if (selectedOptionIndex === null) return;

  const question = shuffledQuestions[currentQuestionIndex];
  const options = document.querySelectorAll('.option');
  const feedback = getElement('feedback-container');

  options.forEach(opt => {
    opt.classList.add('disabled');
    opt.style.cursor = 'not-allowed';
  });

  const isCorrect = selectedOptionIndex === question.correctShuffledIndex;

  if (isCorrect) {
    score[question.category]++;
    options[selectedOptionIndex].classList.add('correct');
    feedback.className = 'correct';
    feedback.textContent = '¡Correcto! Excelente respuesta.';
  } else {
    options[selectedOptionIndex].classList.add('incorrect');
    options[question.correctShuffledIndex].classList.add('correct');
    feedback.className = 'incorrect';
    feedback.textContent = `Incorrecto. La respuesta correcta es: ${letters[question.correctShuffledIndex]}.`;
  }

  feedback.style.display = 'block';
  feedback.classList.remove('hidden');
  answeredQuestions.add(currentQuestionIndex);

  saveAnswerToHash(letters[selectedOptionIndex]);

  pauseTimer();
  
  getElement('check-btn').classList.add('hidden');
  getElement('next-btn').classList.remove('hidden');

  saveProgress();
}

function nextQuestion() {
  if (currentPartKey && currentPartKey.startsWith('WRITING')) {
    nextSectionStep();
    return;
  }

  currentQuestionIndex++;
  const qNum = currentQuestionIndex + 1;

  if (currentQuestionIndex >= shuffledQuestions.length) {
    navigateToNextPart();
  } else {
    loadQuestion();
    resumeTimer();
    updateHash(currentPartKey, qNum);
  }
}

function loadMcPart(partKey, skipCheck) {
  const config = SECTION_CONFIG[partKey];
  if (!config || !config.partId) return false;
  
  const section = getSectionKey(partKey);
  const partData = quizData.LISTENING?.parts?.find(p => p.id === config.partId);
  
  if (!partData) return false;
  
  currentPartKey = partKey;
  currentPartQuestionIndex = 0;
  currentQuestionIndex = 0;
  selectedOptionIndex = null;
  currentAudioSrc = null;
  currentAudioElement = null;
  if (!skipCheck) answeredQuestions = new Set();
  
  let partQuestions = [];
  if (config.partId === 1) {
    partQuestions = partData.questions.map(q => ({ ...q, category: `${section} P${config.partId}` }));
  } else {
    const audioGroups = partData.audioGroups || [];
    partQuestions = audioGroups.flatMap(group =>
      group.questions.map(q => ({ ...q, groupNumber: group.number, mainAudio: group.mainAudio, extraAudio: q.extraAudio, category: `${section} P${config.partId}` }))
    );
  }
  
  shuffledQuestions = partQuestions.map((q, i) => {
    const optionsCopy = [...q.options];
    const correctCopy = q.correct;
    return { ...q, shuffledOptions: optionsCopy, correctShuffledIndex: correctCopy, originalIndex: i, questionCategory: q.category };
  });
  
  setupInstructionsPanel();
  loadQuestion();
  resumeTimer();
  updateHash(currentPartKey, 1);
  updatePrevButtonVisibility();
  return true;
}

function navigateToNextPart() {
  pauseTimer();
  const nextPart = getNextPartKey();
  
  if (!nextPart) {
    goToPreview();
    return;
  }
  
  saveProgress();
  loadMcPart(nextPart.key);
}

function navigateToPart(partKey) {
  if (!currentSection) return;
  
  const targetSection = getSectionKey(partKey);
  if (targetSection !== currentSection) return;
  
  pauseTimer();
  saveProgress();
  loadMcPart(partKey);
}

function previousQuestion() {
  if (currentPartKey && currentPartKey.startsWith('WRITING')) {
    if (currentWritingStep > 0) {
      if (currentWritingStep === WRITING_STEPS.PREVIEW) {
        currentWritingStep = WRITING_STEPS.TASK2;
      } else {
        currentWritingStep--;
      }
      renderWritingStep();
      const qNum = currentWritingStep === WRITING_STEPS.TASK2 ? 1 : currentWritingStep + 1;
      const taskPart = currentWritingStep === WRITING_STEPS.TASK2 ? 'task2' : 'task1';
      updateWritingHash(taskPart, qNum);
    }
    return;
  }

  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    loadQuestion();
    resumeTimer();
    const qNum = currentQuestionIndex + 1;
    updateHash(currentPartKey, qNum);
  }
}

function goToPreview() {
  pauseTimer();
  if (!currentPartKey) return;
  
  if (currentPartKey.startsWith('WRITING')) {
    saveCurrentWritingResponse();
  }
  saveProgress();
  
  hashNavigationLocked = true;
  window.location.hash = `#/${currentPartKey}/preview`;
  hashNavigationLocked = false;
  
  renderSectionPreview();
}

function renderSectionPreview() {
  sectionPreviewMode = true;
  
  if (currentPartKey && currentPartKey.startsWith('WRITING')) {
    currentWritingStep = WRITING_STEPS.PREVIEW;
    renderWritingStep();
    return;
  }
  
  getElement('category-select').classList.add('hidden');
  getElement('quiz-view').classList.remove('hidden');
  getElement('results-container').classList.add('hidden');
  
  const container = getElement('quiz-container');
  container.classList.remove('fade-out');
  void container.offsetWidth;
  container.classList.add('fade-out');
  setTimeout(() => {
    container.classList.remove('fade-out');
    container.style.animation = 'none';
    void container.offsetWidth;
    container.style.animation = 'fadeIn 0.5s ease';
  }, 300);
  
  const config = SECTION_CONFIG[currentPartKey];
  getElement('category-badge').textContent = config ? config.name.replace(/-/g, ' ').toUpperCase() : 'Preview';
  getElement('audio-container').classList.add('hidden');
  getElement('transcription-toggle').classList.add('hidden');
  getElement('transcription-text').classList.add('hidden');
  getElement('reading-text').classList.add('hidden');
  
  const saved = JSON.parse(localStorage.getItem('metQuizProgress') || '{}');
  const savedAnswers = saved.answers || {};
  
  let html = '<div class="preview-section"><h3>Resumen de respuestas</h3>';
  html += '<div class="preview-list">';
  
  shuffledQuestions.forEach((q, i) => {
    const answered = answeredQuestions.has(i);
    const progressKey = getProgressKey(currentPartKey, i + 1);
    const savedAnswer = savedAnswers[progressKey];
    
    if (answered && savedAnswer) {
      html += `<div class="preview-item answered">
        <span class="preview-q-num">Pregunta ${i + 1}</span>
        <span class="preview-q-text">${q.question}</span>
        <span class="preview-q-answer">Tu respuesta: ${savedAnswer}</span>
      </div>`;
    } else {
      html += `<div class="preview-item unanswered">
        <span class="preview-q-num">Pregunta ${i + 1}</span>
        <span class="preview-q-text">${q.question}</span>
        <span class="preview-q-answer">Sin responder</span>
      </div>`;
    }
  });
  
  html += '</div></div>';
  
  getElement('question-text').innerHTML = '';
  getElement('question-text').classList.add('hidden');
  getElement('options-container').innerHTML = html;
  getElement('controls').classList.remove('hidden');
  
  updatePrevButtonVisibility();
}

function showResults() {
  pauseTimer();
  
  hashNavigationLocked = true;
  if (currentPartKey) {
    window.location.hash = `#/${currentPartKey}/results`;
  }
  hashNavigationLocked = false;
  
  getElement('quiz-view').classList.add('hidden');
  getElement('results-container').classList.remove('hidden');

  const breakdown = getElement('results-breakdown');
  breakdown.innerHTML = '';

  let totalScore = 0;
  let totalParts = 0;

  const order = ['WRITING', 'LISTENING', 'READING_AND_GRAMMAR', 'SPEAKING'];
  order.forEach(cat => {
    const catData = quizData[cat];
    let displayScore = '';
    let catName = cat.replace('_', ' ');

    if (cat === 'WRITING') {
      const part1Count = catData?.groups?.[0]?.task1?.length || 0;
      const part2Count = catData?.groups?.[0]?.task2 ? 1 : 0;
      totalParts += part1Count + part2Count;
      const answered = sectionResponses.filter(r => r && r.length > 0).length;
      totalScore += Math.min(answered, part1Count);
      totalScore += answered > part1Count ? 1 : 0;
      
      const part1Answered = Math.min(answered, part1Count);
      const part2Answered = answered > part1Count ? 1 : 0;
      displayScore = `${part1Answered}/${part1Count} • ${part2Answered}/${part2Count}`;
    } else if (cat === 'LISTENING' || cat === 'READING_AND_GRAMMAR') {
      if (catData && catData.length > 0) {
        const count = flattenQuestions(cat, catData).length;
        totalParts += count;
        totalScore += score[cat] || 0;
        displayScore = `${score[cat] || 0}/${count}`;
      }
    } else if (cat === 'SPEAKING') {
      const partCount = 2;
      totalParts += partCount;
      const answered = sectionResponses.filter(r => r && r.length > 0).length;
      totalScore += answered;
      displayScore = `${answered}/${partCount}`;
    }

    if (displayScore) {
      const div = document.createElement('div');
      div.className = 'result-category';
      div.innerHTML = `
        <span class="result-category-name">${catName}</span>
        <span class="result-category-score">${displayScore}</span>
      `;
      breakdown.appendChild(div);
    }
  });

  const percentage = totalParts > 0 ? Math.round((totalScore / totalParts) * 100) : 0;
  getElement('score-display').textContent = `${percentage}% (${totalScore}/${totalParts})`;

  logActivity('FIN', `Resultado: ${percentage}% (${totalScore}/${totalParts})`);
  clearProgress();
  getElement('email-btn').classList.remove('hidden');
}

function sendEmail() {
  const totalScore = score.WRITING + score.LISTENING + score.READING_AND_GRAMMAR + score.SPEAKING;
  const writingPart1 = currentGroup?.task1?.length || 0;
  const writingPart2 = currentGroup?.task2 ? 1 : 0;
  const listeningCount = quizData.LISTENING?.length || 0;
  const readingCount = quizData.READING_AND_GRAMMAR?.length || 0;
  const speakingPartCount = 2;

  const part1Answered = sectionResponses.filter((r, i) => r && r.length > 0 && i < writingPart1).length;
  const part2Answered = sectionResponses[writingPart1] && sectionResponses[writingPart1].length > 0 ? 1 : 0;

  const totalParts = writingPart1 + writingPart2 + listeningCount + readingCount + speakingPartCount;
  const percentage = totalParts > 0 ? Math.round((totalScore / totalParts) * 100) : 0;

  const subject = 'Resultados MET Quiz - Your English World';
  const body = `Resultados del Test MET
=======================
Puntuación Total: ${percentage}% (${totalScore}/${totalParts})

Desglose por sección:
- WRITING: ${part1Answered}/${writingPart1} • ${part2Answered}/${writingPart2}
- LISTENING: ${score.LISTENING || 0}/${listeningCount}
- READING AND GRAMMAR: ${score.READING_AND_GRAMMAR || 0}/${readingCount}
- SPEAKING: ${score.SPEAKING || 0}/${speakingPartCount}

---
Enviado desde Your English World Quiz`;

  const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailto;
}

async function continueFromSaved() {
  const saved = loadProgress();
  if (saved) {
    currentSection = saved.currentSection;
    currentQuestionIndex = saved.currentIndex;
    score = saved.score;
    answeredQuestions = new Set(saved.answeredQuestions);

    if (currentSection && currentSection !== 'WRITING') {
      let sourceData;
      if (currentSection === 'GRAMMAR') {
        sourceData = quizData.GRAMMAR;
        allQuestions = [...sourceData].map((q, i) => ({
          ...q,
          category: currentSection,
          exerciseIndex: i,
          questionIndex: 0
        }));
      } else {
        sourceData = quizData[currentSection];
        const flattened = flattenQuestions(currentSection, sourceData);
        allQuestions = flattened;
      }

      shuffledQuestions = saved.questionsOrder.map(order => {
        const original = allQuestions.find(
          q => q.exerciseIndex === order.exerciseIndex && q.questionIndex === order.questionIndex
        );
        return {
          ...shuffleOptions(original),
          exerciseIndex: original.exerciseIndex,
          questionIndex: original.questionIndex
        };
      });

      getElement('category-select').classList.add('hidden');
      getElement('quiz-view').classList.remove('hidden');

      loadQuestion();
      resumeTimer();
    }
  }
}

function initEventListeners() {
  getElement('check-btn')?.addEventListener('click', checkAnswer);
  getElement('next-btn')?.addEventListener('click', nextQuestion);
  getElement('prev-btn')?.addEventListener('click', previousQuestion);
  getElement('submit-section-btn')?.addEventListener('click', () => {
    if (currentSection === 'WRITING') {
      submitWritingResponses();
    } else {
      showResults();
    }
  });
  getElement('email-btn')?.addEventListener('click', sendEmail);
  getElement('results-home-btn')?.addEventListener('click', goHome);
  getElement('home-btn')?.addEventListener('click', goHome);
  
  getElement('reset-all-btn')?.addEventListener('click', resetAllProgress);
  getElement('reset-btn')?.addEventListener('click', resetSectionProgress);
  
  getElement('time-home-btn')?.addEventListener('click', () => {
    stopTimer();
    hideTimeModal();
    goHome();
  });
  
  getElement('time-preview-btn')?.addEventListener('click', () => {
    stopTimer();
    hideTimeModal();
    goToPreview();
  });

  getElement('skip-btn')?.addEventListener('click', () => {
    if (currentSection === 'WRITING') {
      goToPreview();
    } else {
      navigateToNextPart();
    }
  });

  document.querySelectorAll('.user-link').forEach(el => {
    el.addEventListener('click', showChangeUserModal);
  });

  getElement('back-home-btn').addEventListener('click', () => {
    getElement('back-modal').classList.add('hidden');
    goHome();
  });

  getElement('back-prev-btn').addEventListener('click', () => {
    getElement('back-modal').classList.add('hidden');
    previousQuestion();
  });

  window.addEventListener('popstate', () => {
    if (window.location.hash && window.location.hash.length > 1) {
      loadFromHash();
    } else {
      goHome();
    }
  });

  getElement('registration-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = getElement('reg-name').value.trim();
    const username = getElement('reg-email-username').value.trim();
    let domain = getElement('reg-email-domain').value.trim();
    
    if (!isValidName(name)) {
      alert('Por favor ingresa un nombre válido (mínimo 2 caracteres)');
      return;
    }
    
    if (!username) {
      alert('Por favor ingresa tu nombre de usuario');
      return;
    }
    
    if (!domain) {
      domain = 'gmail.com';
    }
    
    const email = username + '@' + domain;
    
    if (name && email) {
      saveUser({ name, email });
      hideRegistrationModal();
      logActivity('REGISTRO', `Nuevo usuario: ${name}`);
      if (pendingSection) {
        beginQuiz(pendingSection);
        pendingSection = null;
      }
    }
  });
  
  getElement('reg-cancel').addEventListener('click', hideRegistrationModal);

  getElement('help-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const text = getElement('help-text').value.trim();
    if (text) {
      logActivity('CONSULTA', text);
      hideHelpModal();
      alert('¡Consulta enviada! Te responderemos pronto.');
    }
  });

  getElement('help-cancel').addEventListener('click', hideHelpModal);
  getElement('help-btn-home').addEventListener('click', showHelpModal);
  getElement('help-btn-quiz').addEventListener('click', showHelpModal);

  getElement('change-user-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = getElement('change-name').value.trim();
    const username = getElement('change-email-username').value.trim();
    let domain = getElement('change-email-domain').value.trim();
    
    if (!isValidName(name)) {
      alert('Por favor ingresa un nombre válido (mínimo 2 caracteres)');
      return;
    }
    
    if (!username) {
      alert('Por favor ingresa tu nombre de usuario');
      return;
    }
    
    if (!domain) {
      domain = 'gmail.com';
    }
    
    const email = username + '@' + domain;
    
    if (name && email) {
      saveUser({ name, email });
      hideChangeUserModal();
      logActivity('CAMBIO_USUARIO', `Usuario cambió a: ${name}`);
    }
  });

  getElement('change-cancel').addEventListener('click', hideChangeUserModal);

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.add('hidden');
      }
    });
  });
}

function goHome() {
  stopTimer();
  
  if (currentSection === 'WRITING') {
    saveCurrentWritingResponse();
  }
  saveProgress();
  
  document.removeEventListener('keydown', handleCarouselKeydown);

  getElement('email-btn')?.classList.remove('hidden');
  getElement('quiz-view')?.classList.add('hidden');
  getElement('results-container')?.classList.add('hidden');
  getElement('category-select')?.classList.remove('hidden');
  getElement('section-instructions-panel')?.classList.add('hidden');
  getElement('back-modal')?.classList.add('hidden');
  getElement('confirm-modal')?.classList.add('hidden');
  getElement('time-modal')?.classList.add('hidden');
  
  window.history.pushState('', document.title, window.location.pathname);
  renderCategorySelect();
}

async function init() {
  loadUser();
  updateUserDisplay();
  initEventListeners();

  const loaded = await loadAllData();

  if (window.location.hash && window.location.hash.length > 1 && window.location.hash !== '#/') {
    loadFromHash();
  } else {
    renderCategorySelect();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { quizData, loadQuestion, checkAnswer, loadAllData };
}

init();
