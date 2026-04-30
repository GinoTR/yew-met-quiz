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

const SECTION_DISPLAY = {
  'WRITING': 'WRITING',
  'LISTENING': 'LISTENING',
  'READING_AND_GRAMMAR': 'READING & GRAMMAR',
  'SPEAKING': 'SPEAKING'
};

function getSectionKey(partKey) {
  if (!partKey) return null;
  if (partKey.startsWith('WRITING')) return 'WRITING';
  if (partKey.startsWith('LISTENING')) return 'LISTENING';
  if (partKey.startsWith('READING')) return 'READING_AND_GRAMMAR';
  if (partKey.startsWith('SPEAKING')) return 'SPEAKING';
  return null;
}

function getPartKeyFromHashName(hashName) {
  const sectionMatch = hashName.match(/^(writing|listening|reading|speaking)-/);
  if (!sectionMatch) return hashName.toUpperCase().replace(/-/g, '_');

  const sectionBase = sectionMatch[1].toUpperCase();
  const suffix = hashName.replace(sectionMatch[0], '');

  const partNum = suffix.match(/(?:part|task)(\d+)/i);
  if (partNum) {
    return `${sectionBase}_P${partNum[1]}`.replace('_P', sectionBase === 'WRITING' ? '_TASK' : '_P');
  }

  return hashName.toUpperCase().replace(/-/g, '_');
}

function getSectionBadge(partKey) {
  const section = getSectionKey(partKey);
  if (!section) return 'MET QUIZ';
  return SECTION_DISPLAY[section] || section;
}

function getPartLabel(partKey) {
  const config = SECTION_CONFIG[partKey];
  if (!config || !config.partId) return '';
  const section = getSectionKey(partKey);
  return section === 'WRITING' ? `Task ${config.partId}` : `Part ${config.partId}`;
}

function getPartProgressText(partKey, qStart, qEnd, totalQ) {
  const partLabel = getPartLabel(partKey);
  if (!partLabel) return `Q${qStart}/${totalQ}`;
  const qText = qStart === qEnd ? `Q${qStart}` : `Q${qStart}-${qEnd}`;
  return `${partLabel}: ${qText}/${totalQ}`;
}

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

function formatHash(partKey, groupIndex) {
  const config = SECTION_CONFIG[partKey];
  if (!config) return `#/${partKey}/g${groupIndex}`;

  const sectionName = getSectionKey(partKey).toLowerCase();
  const partNum = config.partId || 1;
  const partName = sectionName === 'writing' ? `task${partNum}` : `part${partNum}`;

  if (questionGroups && questionGroups[groupIndex]) {
    const group = questionGroups[groupIndex];
    const { start, end } = group.questionRange;
    const qRange = start === end
      ? `q${start.toString().padStart(2, '0')}`
      : `q${start.toString().padStart(2, '0')}-${end.toString().padStart(2, '0')}`;
    return `#/${sectionName}-${partName}/${qRange}`;
  }

  return `#/${sectionName}-${partName}/g${groupIndex}`;
}

function formatWritingHash(taskPart, qNum) {
  return `#/writing-${taskPart}/q${qNum.toString().padStart(2, '0')}`;
}

function updateHash(partKey, groupIndex) {
  window.location.hash = formatHash(partKey, groupIndex);
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
  const sectionKey = getPartKeyFromHashName(rawKey);

  if (parts[1] === 'preview') {
    const parentSection = getSectionKey(sectionKey);
    return { section: sectionKey, parentSection, taskPart: 'preview', qStart: null, qEnd: null, groupIndex: null, hash };
  }

  if (parts[1] === 'results') {
    const parentSection = getSectionKey(sectionKey);
    return { section: sectionKey, parentSection, taskPart: 'results', qStart: null, qEnd: null, groupIndex: null, hash };
  }

  const rangeMatch = parts[1].match(/^q(\d+)(?:-(\d+))?$/);
  if (rangeMatch) {
    const qStart = parseInt(rangeMatch[1], 10);
    const qEnd = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : qStart;
    const parentSection = getSectionKey(sectionKey);
    return { section: sectionKey, parentSection, taskPart: null, qStart, qEnd, groupIndex: null, hash };
  }

  if (parts.length < 3) return null;

  const taskPart = parts[1];
  const qPart = parts[2];
  const qMatch2 = qPart.match(/q(\d+)/);
  if (!qMatch2) return null;

  const qNum = parseInt(qMatch2[1], 10);
  const parentSection = getSectionKey(sectionKey);
  return { section: sectionKey, parentSection, taskPart, qStart: qNum, qEnd: qNum, groupIndex: null, hash };
}

function getProgressKey(partKey, qNum) {
  const config = SECTION_CONFIG[partKey];
  if (config) {
    return `${config.name}_q${qNum.toString().padStart(2, '0')}`;
  }
  return `${partKey.toLowerCase()}_q${qNum}`;
}

function saveAnswerToHash(answer, qGlobalNum) {
  const key = getProgressKey(currentPartKey, qGlobalNum);
  const saved = JSON.parse(localStorage.getItem('metQuizProgress') || '{}');
  saved.answers = saved.answers || {};
  saved.answers[key] = answer;
  saved.currentHash = window.location.hash;
  saved.currentSection = currentSection;
  saved.currentPartKey = currentPartKey;
  saved.currentGroupIndex = currentGroupIndex;
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

  const { section, taskPart, qStart, qEnd } = parsed;

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

  if (section.startsWith('WRITING') && currentSection === 'WRITING') {
    if (qStart !== null) {
      const step = qStart - 1;
      if (step >= WRITING_STEPS.TASK1_Q1 && step <= WRITING_STEPS.TASK1_Q3) {
        if (currentWritingStep !== step) {
          saveCurrentWritingResponse();
          currentWritingStep = step;
          renderWritingStep();
        }
      } else if (qStart === 4) {
        if (currentWritingStep !== WRITING_STEPS.TASK2) {
          saveCurrentWritingResponse();
          currentWritingStep = WRITING_STEPS.TASK2;
          renderWritingStep();
        }
      }
    }
    return;
  }

  if (currentPartKey === section && qStart !== null && questionGroups.length > 0) {
    const targetGroup = questionGroups.findIndex(g => qStart >= g.questionRange.start && qStart <= g.questionRange.end);
    if (targetGroup >= 0 && targetGroup !== currentGroupIndex) {
      currentGroupIndex = targetGroup;
      loadGroup();
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
let questionGroups = [];
let currentGroupIndex = 0;
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
let groupSelectedAnswers = {};
let groupChecked = false;
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
    currentGroupIndex: currentGroupIndex,
    currentExerciseIndex: currentExerciseIndex,
    score: score,
    answeredQuestions: Array.from(answeredQuestions),
    answersByPart: answersByPart,
    timerRemaining: timerRemaining,
    questionsOrder: shuffledQuestions.map(q => ({ exerciseIndex: q.exerciseIndex, questionIndex: q.questionIndex })),
    writingStep: currentWritingStep,
    writingResponses: sectionResponses,
    writingGroupId: currentGroup?.id || null,
    speakingTaskIndex: speakingTaskIndex,
    speakingResponses: speakingResponses.map(r => r ? { duration: r.duration, timestamp: r.timestamp } : null)
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
    clearSpeakingDB().catch(console.error);
    score = { WRITING: 0, LISTENING: 0, READING_AND_GRAMMAR: 0, SPEAKING: 0 };
    answeredQuestions = new Set();
    sectionResponses = [];
    speakingResponses = [];
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

function updateSectionProgress() {
  getElement('category-badge').textContent = getSectionBadge(currentPartKey);

  if (currentSection === 'WRITING') {
    const progressMap = {
      [WRITING_STEPS.TASK1_Q1]: 'Task 1: Q1/3',
      [WRITING_STEPS.TASK1_Q2]: 'Task 1: Q2/3',
      [WRITING_STEPS.TASK1_Q3]: 'Task 1: Q3/3',
      [WRITING_STEPS.TASK2]: 'Task 2: Essay',
      [WRITING_STEPS.PREVIEW]: 'Revisar'
    };
    const barMap = {
      [WRITING_STEPS.TASK1_Q1]: 10,
      [WRITING_STEPS.TASK1_Q2]: 30,
      [WRITING_STEPS.TASK1_Q3]: 50,
      [WRITING_STEPS.TASK2]: 75,
      [WRITING_STEPS.PREVIEW]: 100
    };
    getElement('progress-text').textContent = progressMap[currentWritingStep] || '';
    getElement('progress-bar').style.width = (barMap[currentWritingStep] || 0) + '%';
  } else if (questionGroups.length > 0) {
    const grp = questionGroups[currentGroupIndex];
    const { start, end } = grp.questionRange;
    const totalQ = shuffledQuestions.length;
    getElement('progress-text').textContent = getPartProgressText(currentPartKey, start, end, totalQ);
    const percent = ((currentGroupIndex + 1) / questionGroups.length) * 100;
    getElement('progress-bar').style.width = percent + '%';
  }
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
  if (section === 'READING_AND_GRAMMAR') return quizData.READING_AND_GRAMMAR && quizData.READING_AND_GRAMMAR.parts && quizData.READING_AND_GRAMMAR.parts.length > 0;
  if (section === 'SPEAKING') return quizData.SPEAKING && quizData.SPEAKING.parts && quizData.SPEAKING.parts.length > 0;
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
    beginMcPart(section, saved);
    return;
  }

  if (section.startsWith('READING_P')) {
    beginMcPart(section, saved);
    return;
  }

  if (section.startsWith('SPEAKING_P')) {
    beginSpeaking(section, saved);
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

  const taskPart = isTask2 ? 'task2' : 'task1';
  hashNavigationLocked = true;
  updateWritingHash(taskPart, 1);
  hashNavigationLocked = false;

  startTimer('WRITING');
}

function beginMcPart(partKey, saved = null) {
  const config = SECTION_CONFIG[partKey];
  if (!config || !config.partId) return false;

  const section = getSectionKey(partKey);
  let partData = null;

  if (section === 'LISTENING') {
    partData = quizData.LISTENING?.parts?.find(p => p.id === config.partId);
  } else if (section === 'READING_AND_GRAMMAR') {
    partData = quizData.READING_AND_GRAMMAR?.parts?.[config.partId - 1] || null;
  }

  if (!partData) return false;

  currentPartKey = partKey;
  currentGroupIndex = 0;
  currentQuestionIndex = 0;
  selectedOptionIndex = null;
  currentAudioSrc = null;
  currentAudioElement = null;
  if (!saved || saved.currentPartKey !== partKey) answeredQuestions = new Set();

  buildQuestionGroups(partData, section, config.partId);

  getElement('category-select').classList.add('hidden');
  getElement('quiz-view').classList.remove('hidden');
  getElement('results-container').classList.add('hidden');

  setupInstructionsPanel();
  logActivity('INICIO', `${section} Part ${config.partId}`);
  loadGroup();
  updatePrevButtonVisibility();
  startTimer(section);
  return true;
}

function processQuestion(q, section, partId, globalNum) {
  const sectionLabel = SECTION_DISPLAY[section];
  const optionsCopy = [...q.options];
  const correctCopy = q.correct;
  return {
    ...q,
    shuffledOptions: optionsCopy,
    correctShuffledIndex: correctCopy,
    category: `${sectionLabel} P${partId}`,
    globalNumber: globalNum
  };
}

function buildQuestionGroups(partData, section, partId) {
  questionGroups = [];
  shuffledQuestions = [];
  let globalNum = 0;

  if (partData.questions) {
    partData.questions.forEach(q => {
      globalNum++;
      const processed = processQuestion(q, section, partId, globalNum);
      shuffledQuestions.push(processed);
      questionGroups.push({
        groupNumber: globalNum,
        mainAudio: q.audio || null,
        questionRange: { start: globalNum, end: globalNum },
        questions: [processed]
      });
    });
  } else if (partData.audioGroups) {
    partData.audioGroups.forEach(audioGroup => {
      const startNum = globalNum + 1;
      const groupQuestions = audioGroup.questions.map(q => {
        globalNum++;
        const processed = processQuestion(q, section, partId, globalNum);
        processed.groupNumber = audioGroup.number;
        processed.mainAudio = audioGroup.mainAudio;
        processed.extraAudio = q.extraAudio || null;
        return processed;
      });
      shuffledQuestions.push(...groupQuestions);
      questionGroups.push({
        groupNumber: audioGroup.number,
        mainAudio: audioGroup.mainAudio,
        questionRange: { start: startNum, end: globalNum },
        questions: groupQuestions
      });
    });
  } else if (partData.readingGroups) {
    partData.readingGroups.forEach(rg => {
      const startNum = globalNum + 1;
      const groupQuestions = rg.questions.map(q => {
        globalNum++;
        const processed = processQuestion(q, section, partId, globalNum);
        processed.groupNumber = rg.number;
        processed.mainAudio = null;
        return processed;
      });
      const groupObj = {
        groupNumber: rg.number,
        mainAudio: null,
        questionRange: { start: startNum, end: globalNum },
        questions: groupQuestions
      };
      if (rg.article) {
        groupObj.article = rg.article;
      }
      if (rg.isConnector) {
        groupObj.isConnector = true;
        groupObj.connectorArticles = rg.connectorArticles;
      }
      shuffledQuestions.push(...groupQuestions);
      questionGroups.push(groupObj);
    });
  }
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
    toggleBtn.onclick = function () {
      const icon = this.querySelector('.toggle-icon');
      if (contentEl.classList.contains('hidden')) {
        contentEl.classList.remove('hidden');
        icon.textContent = '^';
      } else {
        contentEl.classList.add('hidden');
        icon.textContent = 'v';
      }
    };
  }
}

function getAudioPath(audioSrc) {
  if (!audioSrc) return '';
  if (audioSrc.startsWith('data/') || audioSrc.startsWith('http')) return audioSrc;
  if (currentPartKey && currentPartKey.startsWith('LISTENING_P')) {
    const partNum = currentPartKey.replace('LISTENING_P', '');
    return `data/audios/listening-p${partNum}/${audioSrc}`;
  }
  return `data/audios/${audioSrc}`;
}

function loadGroup() {
  sectionPreviewMode = false;
  const grp = questionGroups[currentGroupIndex];
  if (!grp) return;

  groupSelectedAnswers = {};
  groupChecked = false;

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

  updateSectionProgress();

  getElement('transcription-toggle').innerHTML = '';
  getElement('transcription-toggle').classList.add('hidden');
  getElement('transcription-text').classList.add('hidden');
  getElement('reading-text').classList.add('hidden');
  getElement('feedback-container').classList.add('hidden');
  getElement('controls').classList.remove('hidden');

  if (grp.mainAudio) {
    const audioPath = getAudioPath(grp.mainAudio);
    let audioHTML = `<audio id="main-audio" controls src="${audioPath}"></audio>`;
    const hasExtra = grp.questions.some(q => q.extraAudio);
    if (hasExtra) {
      grp.questions.forEach((q, idx) => {
        if (q.extraAudio) {
          audioHTML += `<audio id="extra-audio-${idx}" controls src="${getAudioPath(q.extraAudio)}" class="extra-audio" style="display:none"></audio>`;
        }
      });
    }
    getElement('audio-container').innerHTML = audioHTML;
    currentAudioSrc = grp.mainAudio;
    currentAudioElement = document.getElementById('main-audio');
    getElement('audio-container').classList.remove('hidden');
  } else {
    getElement('audio-container').classList.add('hidden');
    currentAudioSrc = null;
    currentAudioElement = null;
  }

  renderGroupQuestions(grp);
  updateHash(currentPartKey, currentGroupIndex);
  saveProgress();
  updatePrevButtonVisibility();
  resumeTimer();
}

function renderGroupQuestions(grp) {
  getElement('question-text').classList.add('hidden');

  const isSingleQuestion = grp.questions.length === 1;

  let html = '<div class="question-group">';

  if (grp.isConnector && grp.connectorArticles) {
    grp.connectorArticles.forEach(art => {
      html += renderMagazineArticle(art);
    });
  } else if (grp.article) {
    html += renderMagazineArticle(grp.article);
  }

  grp.questions.forEach((q, idx) => {
    if (q.passage && !grp.article && !grp.isConnector) {
      html += `<div class="reading-passage">${q.passage.replace(/\n/g, '<br>')}</div>`;
    }

    const globalNum = q.globalNumber;
    const questionIdx = shuffledQuestions.findIndex(sq => sq.globalNumber === globalNum);
    const isAnswered = answeredQuestions.has(questionIdx);
    const savedAnswer = isAnswered ? getAnswerFromHash(currentPartKey, globalNum) : null;

    html += `<div class="group-question-item" data-global="${globalNum}">`;
    html += `<div class="group-q-header">
      <span class="group-q-number">Pregunta ${globalNum}</span>`;
    if (q.extraAudio) {
      html += `<audio controls src="${getAudioPath(q.extraAudio)}" class="extra-audio-inline"></audio>`;
    }
    html += `</div>`;
    html += `<div class="group-q-text">${q.question}</div>`;
    html += `<div class="group-q-options">`;

    q.shuffledOptions.forEach((opt, i) => {
      let classes = 'option';
      if (isAnswered) {
        classes += ' disabled';
        if (i === q.correctShuffledIndex) {
          classes += ' correct';
        } else if (savedAnswer && letters[i] === savedAnswer) {
          classes += ' incorrect';
        }
      }
      html += `<div class="${classes}" data-global="${globalNum}" data-option="${i}" ${isAnswered ? 'style="pointer-events:none"' : ''}>
        <span class="option-letter">${letters[i]}</span><span>${opt}</span>
      </div>`;
    });

    html += `</div>`;

    if (isSingleQuestion && !isAnswered) {
      html += `<button class="check-single-btn" data-global="${globalNum}">COMPROBAR</button>`;
    }

    html += `<div class="group-q-feedback ${isAnswered ? '' : 'hidden'}" data-global="${globalNum}">`;
    if (isAnswered && savedAnswer) {
      const isCorrect = letters[q.correctShuffledIndex] === savedAnswer;
      if (isCorrect) {
        html += '¡Correcto!';
      } else {
        html += `Incorrecto. Respuesta correcta: ${letters[q.correctShuffledIndex]}.`;
      }
    }
    html += `</div>`;
    html += `</div>`;
  });

  html += '</div>';

  if (!isSingleQuestion) {
    const allAnswered = grp.questions.every(q => {
      const qi = shuffledQuestions.findIndex(sq => sq.globalNumber === q.globalNumber);
      return answeredQuestions.has(qi);
    });
    if (!allAnswered && grp.questions.some(q => {
      const qi = shuffledQuestions.findIndex(sq => sq.globalNumber === q.globalNumber);
      return groupSelectedAnswers[q.globalNumber] !== undefined;
    })) {
      html += `<button id="check-group-btn" class="btn btn-primary" style="margin-top:16px;">COMPROBAR</button>`;
    }
  }

  getElement('options-container').innerHTML = html;

  document.querySelectorAll('.group-q-options .option:not(.disabled)').forEach(opt => {
    opt.addEventListener('click', () => {
      const globalNum = parseInt(opt.dataset.global);
      const optIdx = parseInt(opt.dataset.option);
      selectGroupOption(globalNum, optIdx, opt);
    });
  });

  document.querySelectorAll('.check-single-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const globalNum = parseInt(btn.dataset.global);
      checkSingleQuestion(globalNum);
    });
  });

  const checkGroupBtn = document.getElementById('check-group-btn');
  if (checkGroupBtn) {
    checkGroupBtn.addEventListener('click', () => {
      checkCurrentGroup();
    });
  }
}

function renderMagazineArticle(art) {
  let html = `<div class="magazine-article" data-article="${art.letter}">`;
  html += `<div class="magazine-header">`;
  html += `<span class="magazine-letter">Article ${art.letter}</span>`;
  if (art.date) {
    html += `<span class="magazine-date">${art.date}</span>`;
  }
  html += `</div>`;
  html += `<h2 class="magazine-title">${art.title}</h2>`;

  if (art.author) {
    html += `<p class="magazine-author">By ${art.author}</p>`;
  }
  if (art.subheading) {
    html += `<p class="magazine-subheading">${art.subheading}</p>`;
  }

  const contentFormatted = art.content.replace(/\n/g, '<br>');
  html += `<div class="magazine-body">${contentFormatted}</div>`;

  if (art.bio) {
    html += `<p class="magazine-bio">${art.bio}</p>`;
  }

  html += `</div>`;
  return html;
}

function selectGroupOption(globalNum, optionIdx, element) {
  const questionIdx = shuffledQuestions.findIndex(q => q.globalNumber === globalNum);
  if (questionIdx < 0 || answeredQuestions.has(questionIdx)) return;

  const grp = questionGroups[currentGroupIndex];
  const isSingleQuestion = grp.questions.length === 1;

  document.querySelectorAll(`.option[data-global="${globalNum}"]`).forEach(opt => opt.classList.remove('selected'));
  element.classList.add('selected');

  groupSelectedAnswers[globalNum] = optionIdx;

  if (isSingleQuestion) {
    const checkBtn = document.querySelector(`.check-single-btn[data-global="${globalNum}"]`);
    if (checkBtn) {
      checkBtn.classList.remove('hidden');
      checkBtn.style.display = '';
    }
  }
}

function checkSingleQuestion(globalNum) {
  const questionIdx = shuffledQuestions.findIndex(q => q.globalNumber === globalNum);
  if (questionIdx < 0 || answeredQuestions.has(questionIdx)) return;
  if (groupSelectedAnswers[globalNum] === undefined) return;

  const question = shuffledQuestions[questionIdx];
  const optIdx = groupSelectedAnswers[globalNum];

  const feedback = document.querySelector(`.group-q-feedback[data-global="${globalNum}"]`);
  const options = document.querySelectorAll(`.option[data-global="${globalNum}"]`);
  const selectedOpt = document.querySelector(`.option[data-global="${globalNum}"][data-option="${optIdx}"]`);

  options.forEach(opt => {
    opt.classList.add('disabled');
    opt.style.pointerEvents = 'none';
  });

  const isCorrect = optIdx === question.correctShuffledIndex;

  if (isCorrect) {
    score[question.category]++;
    selectedOpt.classList.add('correct');
    if (feedback) {
      feedback.className = 'group-q-feedback correct';
      feedback.textContent = '¡Correcto!';
    }
  } else {
    selectedOpt.classList.add('incorrect');
    const correctOpt = document.querySelector(`.option[data-global="${globalNum}"][data-option="${question.correctShuffledIndex}"]`);
    if (correctOpt) correctOpt.classList.add('correct');
    if (feedback) {
      feedback.className = 'group-q-feedback incorrect';
      feedback.textContent = `Incorrecto. Respuesta correcta: ${letters[question.correctShuffledIndex]}.`;
    }
  }

  answeredQuestions.add(questionIdx);
  saveAnswerToHash(letters[optIdx], globalNum);
  pauseTimer();
  saveProgress();

  const checkBtn = document.querySelector(`.check-single-btn[data-global="${globalNum}"]`);
  if (checkBtn) checkBtn.style.display = 'none';

  updatePrevButtonVisibility();
}

function checkCurrentGroup() {
  const grp = questionGroups[currentGroupIndex];
  if (!grp || groupChecked) return;

  let allSelected = true;
  grp.questions.forEach(q => {
    if (groupSelectedAnswers[q.globalNumber] === undefined) {
      allSelected = false;
    }
  });

  if (!allSelected) return;

  groupChecked = true;

  grp.questions.forEach(q => {
    const questionIdx = shuffledQuestions.findIndex(sq => sq.globalNumber === q.globalNumber);
    if (questionIdx < 0 || answeredQuestions.has(questionIdx)) return;

    const optIdx = groupSelectedAnswers[q.globalNumber];
    const feedback = document.querySelector(`.group-q-feedback[data-global="${q.globalNumber}"]`);
    const options = document.querySelectorAll(`.option[data-global="${q.globalNumber}"]`);
    const selectedOpt = document.querySelector(`.option[data-global="${q.globalNumber}"][data-option="${optIdx}"]`);

    options.forEach(opt => {
      opt.classList.add('disabled');
      opt.style.pointerEvents = 'none';
    });

    const isCorrect = optIdx === q.correctShuffledIndex;

    if (isCorrect) {
      score[q.category]++;
      selectedOpt.classList.add('correct');
      if (feedback) {
        feedback.className = 'group-q-feedback correct';
        feedback.textContent = '¡Correcto!';
      }
    } else {
      selectedOpt.classList.add('incorrect');
      const correctOpt = document.querySelector(`.option[data-global="${q.globalNumber}"][data-option="${q.correctShuffledIndex}"]`);
      if (correctOpt) correctOpt.classList.add('correct');
      if (feedback) {
        feedback.className = 'group-q-feedback incorrect';
        feedback.textContent = `Incorrecto. Respuesta correcta: ${letters[q.correctShuffledIndex]}.`;
      }
    }

    answeredQuestions.add(questionIdx);
    saveAnswerToHash(letters[optIdx], q.globalNumber);
  });

  pauseTimer();
  saveProgress();

  const checkGroupBtn = document.getElementById('check-group-btn');
  if (checkGroupBtn) checkGroupBtn.style.display = 'none';

  updatePrevButtonVisibility();
}

function navigateToNextGroup() {
  if (currentGroupIndex < questionGroups.length - 1) {
    currentGroupIndex++;
    loadGroup();
  } else {
    navigateToNextPart();
  }
}

function navigateToPrevGroup() {
  if (currentGroupIndex > 0) {
    currentGroupIndex--;
    loadGroup();
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

  updateSectionProgress();
  getElement('audio-container').classList.add('hidden');
  getElement('transcription-toggle').classList.add('hidden');
  getElement('transcription-text').classList.add('hidden');
  getElement('reading-text').classList.add('hidden');
  getElement('feedback-container').classList.add('hidden');
  getElement('section-instructions-panel').classList.remove('hidden');

  let html = '';

  switch (currentWritingStep) {
    case WRITING_STEPS.TASK1_Q1: html = renderWritingTask1(0); break;
    case WRITING_STEPS.TASK1_Q2: html = renderWritingTask1(1); break;
    case WRITING_STEPS.TASK1_Q3: html = renderWritingTask1(2); break;
    case WRITING_STEPS.TASK2: html = renderWritingTask2(); break;
    case WRITING_STEPS.PREVIEW: html = renderWritingPreview(); break;
  }

  getElement('question-text').innerHTML = '';
  getElement('options-container').innerHTML = html;
  updatePrevButtonVisibility();

  if (currentWritingStep === WRITING_STEPS.PREVIEW) {
    getElement('controls').classList.remove('hidden');
    getElement('check-btn').classList.add('hidden');
    getElement('next-btn').classList.add('hidden');
    getElement('prev-btn').classList.add('hidden');
    getElement('skip-btn').classList.add('hidden');
    getElement('submit-section-btn').classList.remove('hidden');
    getElement('section-instructions-panel').classList.add('hidden');
    setupCarouselEvents();
  } else {
    getElement('controls').classList.remove('hidden');
    getElement('check-btn').classList.add('hidden');
    getElement('next-btn').classList.add('hidden');
    getElement('prev-btn').classList.remove('hidden');
    getElement('submit-section-btn').classList.add('hidden');
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

  textarea.addEventListener('input', function () {
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
    { title: 'Task 1: Pregunta 1 de 3', question: task1[0].text, response: sectionResponses[0] || 'Sin respuesta' },
    { title: 'Task 1: Pregunta 2 de 3', question: task1[1].text, response: sectionResponses[1] || 'Sin respuesta' },
    { title: 'Task 1: Pregunta 3 de 3', question: task1[2].text, response: sectionResponses[2] || 'Sin respuesta' },
    { title: 'Task 2: Ensayo', question: `${task2.topic}\n\n${task2.prompt}`, response: sectionResponses[3] || 'Sin respuesta' }
  ];

  const slide = slides[currentPreviewIndex];
  const responseDisplay = slide.response === 'Sin respuesta'
    ? 'Sin respuesta'
    : slide.response.length > 200
      ? slide.response.substring(0, 200) + '...'
      : slide.response;

  return `
    <div class="carousel-container">
      <h3 class="carousel-title">Revisa tus respuestas</h3>
      <div class="carousel-viewer">
        <button id="carousel-prev" class="carousel-btn carousel-btn-left">&lt;</button>
        <div class="carousel-slide">
          <div class="slide-header">${slide.title}</div>
          <div class="slide-question">${slide.question.replace(/\n/g, '<br>')}</div>
          <div class="slide-response">${responseDisplay.replace(/\n/g, '<br>')}</div>
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

  if (prevBtn) prevBtn.addEventListener('click', () => navigateCarousel(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => navigateCarousel(1));
  if (editText) editText.addEventListener('click', editCurrentResponse);

  indicators.forEach(ind => {
    ind.addEventListener('click', () => {
      currentPreviewIndex = parseInt(ind.dataset.index);
      updateCarouselDisplay();
    });
  });

  document.addEventListener('keydown', handleCarouselKeydown);
}

function editCurrentResponse() {
  document.removeEventListener('keydown', handleCarouselKeydown);
  saveCurrentWritingResponse();

  switch (currentPreviewIndex) {
    case 0: currentWritingStep = WRITING_STEPS.TASK1_Q1; break;
    case 1: currentWritingStep = WRITING_STEPS.TASK1_Q2; break;
    case 2: currentWritingStep = WRITING_STEPS.TASK1_Q3; break;
    case 3: currentWritingStep = WRITING_STEPS.TASK2; break;
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
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const checkBtn = document.getElementById('check-btn');
  const submitBtn = document.getElementById('submit-section-btn');
  const skipBtn = document.getElementById('skip-btn');

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
        skipBtn.textContent = 'Task 2';
        skipBtn.classList.remove('btn-primary');
        skipBtn.classList.add('btn-secondary');
      }
    }
  } else if (currentSection === 'SPEAKING') {
    const isLastTask = speakingTaskIndex >= speakingPart.tasks.length - 1;
    const hasNextPart = getNextPartKey();

    prevBtn?.classList.toggle('hidden', speakingTaskIndex === 0);
    checkBtn?.classList.add('hidden');
    nextBtn?.classList.add('hidden');
    submitBtn?.classList.add('hidden');

    if (speakingTaskIndex >= speakingPart.tasks.length) {
      prevBtn?.classList.add('hidden');
      checkBtn?.classList.add('hidden');
      nextBtn?.classList.add('hidden');
      submitBtn?.classList.remove('hidden');
      skipBtn?.classList.add('hidden');
    } else if (isLastTask) {
      skipBtn?.classList.remove('hidden');
      skipBtn.textContent = 'Preview';
      skipBtn.classList.remove('btn-secondary');
      skipBtn.classList.add('btn-primary');
    } else {
      skipBtn?.classList.remove('hidden');
      skipBtn.textContent = 'Siguiente';
      skipBtn.classList.remove('btn-primary');
      skipBtn.classList.add('btn-secondary');
    }
  } else if (currentSection && !sectionPreviewMode) {
    const grp = questionGroups[currentGroupIndex];
    const isSingleQuestion = grp ? grp.questions.length === 1 : true;
    const hasAnySelection = grp && Object.keys(groupSelectedAnswers).length > 0;
    const allChecked = grp && grp.questions.every(q => {
      const qi = shuffledQuestions.findIndex(sq => sq.globalNumber === q.globalNumber);
      return answeredQuestions.has(qi);
    });

    const isLastGroup = currentGroupIndex >= questionGroups.length - 1;
    const hasNextPart = getNextPartKey();

    prevBtn?.classList.toggle('hidden', currentGroupIndex === 0);
    checkBtn?.classList.add('hidden');
    submitBtn?.classList.add('hidden');

    if (allChecked) {
      if (isLastGroup) {
        nextBtn?.classList.add('hidden');
      } else {
        nextBtn?.classList.remove('hidden');
      }
    } else {
      nextBtn?.classList.add('hidden');
    }

    if (isLastGroup) {
      skipBtn?.classList.remove('hidden');
      skipBtn.textContent = hasNextPart ? hasNextPart.name : 'Finalizar sección';
      skipBtn.classList.remove('btn-secondary');
      skipBtn.classList.add('btn-primary');
    } else {
      skipBtn?.classList.remove('hidden');
      skipBtn.textContent = hasNextPart ? hasNextPart.name : 'Siguiente';
      skipBtn.classList.remove('btn-primary');
      skipBtn.classList.add('btn-secondary');
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
      { title: 'Task 1: Pregunta 1 de 3', question: task1[0].text, response: sectionResponses[0] || 'Sin respuesta' },
      { title: 'Task 1: Pregunta 2 de 3', question: task1[1].text, response: sectionResponses[1] || 'Sin respuesta' },
      { title: 'Task 1: Pregunta 3 de 3', question: task1[2].text, response: sectionResponses[2] || 'Sin respuesta' },
      { title: 'Task 2: Ensayo', question: `${task2.topic}\n\n${task2.prompt}`, response: sectionResponses[3] || 'Sin respuesta' }
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

let speakingPart = null;
let speakingTaskIndex = 0;
let speakingResponses = [];
let speakingTimerRemaining = 0;
let speakingTimerInterval = null;
let speakingMediaRecorder = null;
let speakingAudioChunks = [];
let speakingStream = null;
let speakingAudioContext = null;
let speakingAnalyser = null;
let speakingAnimationId = null;

const SPEAKING_DB_NAME = 'SpeakingAudioDB';
const SPEAKING_DB_VERSION = 1;
const SPEAKING_STORE_NAME = 'audioResponses';

let speakingDB = null;

function openSpeakingDB() {
  return new Promise((resolve, reject) => {
    if (speakingDB) {
      resolve(speakingDB);
      return;
    }
    const request = indexedDB.open(SPEAKING_DB_NAME, SPEAKING_DB_VERSION);
    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(SPEAKING_STORE_NAME)) {
        db.createObjectStore(SPEAKING_STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = event => {
      speakingDB = event.target.result;
      resolve(speakingDB);
    };
    request.onerror = event => reject(event.target.error);
  });
}

function saveSpeakingAudio(taskIndex, blob, duration) {
  return openSpeakingDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SPEAKING_STORE_NAME, 'readwrite');
      const store = tx.objectStore(SPEAKING_STORE_NAME);
      const record = {
        id: `speaking_task_${taskIndex}`,
        taskIndex,
        blob,
        duration,
        timestamp: Date.now()
      };
      store.put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = event => reject(event.target.error);
    });
  });
}

function getSpeakingAudio(taskIndex) {
  return openSpeakingDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SPEAKING_STORE_NAME, 'readonly');
      const store = tx.objectStore(SPEAKING_STORE_NAME);
      const request = store.get(`speaking_task_${taskIndex}`);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = event => reject(event.target.error);
    });
  });
}

function getAllSpeakingAudio() {
  return openSpeakingDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SPEAKING_STORE_NAME, 'readonly');
      const store = tx.objectStore(SPEAKING_STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = event => reject(event.target.error);
    });
  });
}

function clearSpeakingDB() {
  return openSpeakingDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SPEAKING_STORE_NAME, 'readwrite');
      const store = tx.objectStore(SPEAKING_STORE_NAME);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = event => reject(event.target.error);
    });
  });
}

const SPEAKING_STEPS = {
  TASK_1: 0,
  TASK_2: 1,
  TASK_3: 2,
  TASK_4: 3,
  TASK_5: 4,
  PREVIEW: 5
};

function beginSpeaking(partKey, saved = null) {
  const config = SECTION_CONFIG[partKey];
  if (!config || !config.partId) return false;

  const partData = quizData.SPEAKING?.parts?.find(p => p.id === config.partId);
  if (!partData) return false;

  speakingPart = partData;
  const hasSavedProgress = saved && saved.currentPartKey === partKey;
  speakingTaskIndex = hasSavedProgress ? (saved.speakingTaskIndex || 0) : 0;
  speakingResponses = hasSavedProgress ? (saved.speakingResponses || []) : [];

  currentPartKey = partKey;
  currentSection = 'SPEAKING';

  getElement('category-select').classList.add('hidden');
  getElement('quiz-view').classList.remove('hidden');
  getElement('results-container').classList.add('hidden');

  setupInstructionsPanel();
  logActivity('INICIO', `${currentSection} Part ${config.partId}`);

  getAllSpeakingAudio().then(records => {
    records.forEach(record => {
      if (record.taskIndex >= 0 && record.taskIndex < speakingPart.tasks.length) {
        speakingResponses[record.taskIndex] = {
          blob: record.blob,
          duration: record.duration,
          timestamp: record.timestamp
        };
      }
    });
    renderSpeakingTask();
  }).catch(() => {
    renderSpeakingTask();
  });

  updatePrevButtonVisibility();
  startTimer('SPEAKING');
  return true;
}

function renderSpeakingTask() {
  const task = speakingPart.tasks[speakingTaskIndex];
  if (!task) return;

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

  updateSpeakingProgress();

  getElement('audio-container').classList.add('hidden');
  getElement('transcription-toggle').classList.add('hidden');
  getElement('transcription-text').classList.add('hidden');
  getElement('reading-text').classList.add('hidden');
  getElement('feedback-container').classList.add('hidden');

  const hasResponse = speakingResponses[speakingTaskIndex] !== null && speakingResponses[speakingTaskIndex] !== undefined;
  const partLabel = getPartLabel(currentPartKey);

  let html = '<div class="speaking-task-container">';
  html += `<div class="speaking-task-header">`;
  html += `<span class="speaking-task-badge">${partLabel}</span>`;
  html += `<span class="speaking-task-label">Task ${task.number} of ${speakingPart.tasks.length}</span>`;
  html += `</div>`;
  html += `<div class="speaking-prompt">${task.prompt}</div>`;
  html += `<div class="speaking-time-info">You have ${task.timeLimit} seconds to talk.</div>`;

  if (!hasResponse) {
    html += `<button id="begin-speaking-btn" class="btn-begin-speaking">Begin speaking now</button>`;
    html += `<div id="speaking-timer" class="speaking-timer hidden">Time Remaining: <span id="speaking-time-display">${formatTime(task.timeLimit)}</span></div>`;
    html += `<div id="speaking-recorder" class="speaking-recorder hidden">`;
    html += `<div class="recorder-icon">🎙</div>`;
    html += `<div class="recorder-text">Recording</div>`;
    html += `<canvas id="audio-waveform" class="audio-waveform"></canvas>`;
    html += `</div>`;
  } else {
    const duration = speakingResponses[speakingTaskIndex].duration;
    html += `<div class="speaking-completed">✓ Response recorded (${duration}s)</div>`;
    html += `<button id="playback-speaking-btn" class="btn-playback-speaking">▶ Play your recording</button>`;
    html += `<audio id="speaking-audio-playback" class="hidden"></audio>`;
    html += `<div id="speaking-timer" class="speaking-timer hidden">Time Remaining: <span id="speaking-time-display">${formatTime(task.timeLimit)}</span></div>`;
    html += `<div id="speaking-recorder" class="speaking-recorder hidden">`;
    html += `<div class="recorder-icon">🎙</div>`;
    html += `<div class="recorder-text">Recording</div>`;
    html += `<canvas id="audio-waveform" class="audio-waveform"></canvas>`;
    html += `</div>`;
  }

  html += '</div>';

  getElement('question-text').classList.add('hidden');
  getElement('options-container').innerHTML = html;
  getElement('controls').classList.remove('hidden');

  const beginBtn = document.getElementById('begin-speaking-btn');
  if (beginBtn) {
    beginBtn.addEventListener('click', () => startSpeakingRecording(task));
  }

  const playbackBtn = document.getElementById('playback-speaking-btn');
  if (playbackBtn) {
    playbackBtn.addEventListener('click', () => playSpeakingRecording(speakingTaskIndex));
  }

  updatePrevButtonVisibility();
}

function startSpeakingRecording(task) {
  const beginBtn = document.getElementById('begin-speaking-btn');
  const timerEl = document.getElementById('speaking-timer');
  const recorderEl = document.getElementById('speaking-recorder');
  const timeDisplay = document.getElementById('speaking-time-display');

  if (beginBtn) beginBtn.classList.add('hidden');
  if (timerEl) timerEl.classList.remove('hidden');
  if (recorderEl) recorderEl.classList.remove('hidden');

  speakingTimerRemaining = task.timeLimit;
  speakingAudioChunks = [];

  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      speakingStream = stream;
      speakingMediaRecorder = new MediaRecorder(stream);

      speakingMediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          speakingAudioChunks.push(event.data);
        }
      };

      speakingMediaRecorder.onstop = () => {
        const blob = new Blob(speakingAudioChunks, { type: 'audio/webm' });
        const duration = task.timeLimit - speakingTimerRemaining;
        speakingResponses[speakingTaskIndex] = { blob, duration, timestamp: Date.now() };
        saveSpeakingAudio(speakingTaskIndex, blob, duration).catch(console.error);
        saveProgress();
        stopAudioVisualization();
        renderSpeakingTask();
      };

      speakingMediaRecorder.start();
      setupAudioVisualization(stream);

      speakingTimerInterval = setInterval(() => {
        speakingTimerRemaining--;
        if (timeDisplay) timeDisplay.textContent = formatTime(speakingTimerRemaining);

        if (speakingTimerRemaining <= 0) {
          clearInterval(speakingTimerInterval);
          if (speakingMediaRecorder && speakingMediaRecorder.state !== 'inactive') {
            speakingMediaRecorder.stop();
          }
          if (speakingStream) {
            speakingStream.getTracks().forEach(track => track.stop());
          }
        }
      }, 1000);
    })
    .catch(err => {
      console.error('Microphone access denied:', err);
      alert('Microphone access is required for the speaking section.');
      renderSpeakingTask();
    });
}

function setupAudioVisualization(stream) {
  const canvas = document.getElementById('audio-waveform');
  if (!canvas) return;

  speakingAudioContext = new (window.AudioContext || window.webkitAudioContext)();
  const source = speakingAudioContext.createMediaStreamSource(stream);
  speakingAnalyser = speakingAudioContext.createAnalyser();
  speakingAnalyser.fftSize = 256;
  source.connect(speakingAnalyser);

  const bufferLength = speakingAnalyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  const ctx = canvas.getContext('2d');

  function draw() {
    speakingAnimationId = requestAnimationFrame(draw);

    speakingAnalyser.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / bufferLength) * 2.5;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;

      const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
      gradient.addColorStop(0, '#6366f1');
      gradient.addColorStop(1, '#818cf8');

      ctx.fillStyle = gradient;
      ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);

      x += barWidth;
    }
  }

  draw();
}

function stopAudioVisualization() {
  if (speakingAnimationId) {
    cancelAnimationFrame(speakingAnimationId);
    speakingAnimationId = null;
  }
  if (speakingAudioContext) {
    speakingAudioContext.close();
    speakingAudioContext = null;
  }
}

function playSpeakingRecording(taskIndex) {
  const response = speakingResponses[taskIndex];
  if (!response || !response.blob) return;

  const audioEl = document.getElementById('speaking-audio-playback');
  const playbackBtn = document.getElementById('playback-speaking-btn');
  if (!audioEl || !playbackBtn) return;

  const url = URL.createObjectURL(response.blob);
  audioEl.src = url;
  audioEl.classList.remove('hidden');
  audioEl.play();

  playbackBtn.textContent = '⏸ Playing...';
  playbackBtn.disabled = true;

  audioEl.onended = () => {
    URL.revokeObjectURL(url);
    playbackBtn.textContent = '▶ Play your recording';
    playbackBtn.disabled = false;
    audioEl.classList.add('hidden');
  };

  audioEl.onerror = () => {
    URL.revokeObjectURL(url);
    playbackBtn.textContent = '▶ Play your recording';
    playbackBtn.disabled = false;
    audioEl.classList.add('hidden');
  };
}

function updateSpeakingProgress() {
  const badge = getElement('category-badge');
  const progressText = getElement('progress-text');
  const progressBar = getElement('progress-bar');

  if (badge) badge.textContent = getSectionBadge(currentPartKey);
  if (progressText) {
    const partLabel = getPartLabel(currentPartKey);
    progressText.textContent = partLabel || 'Speaking';
  }
  if (progressBar) {
    const totalTasks = speakingPart.tasks.length;
    const completed = speakingResponses.filter(r => r !== null && r !== undefined).length;
    const percent = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;
    progressBar.style.width = `${percent}%`;
  }
}

function nextSectionStep() {
  if (currentSection !== 'WRITING') return;

  saveCurrentWritingResponse();
  saveProgress();

  let taskPart = 'task1';
  let qNum = 1;

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
    hashNavigationLocked = true;
    updateWritingHash(taskPart, qNum);
    hashNavigationLocked = false;
    return;
  }

  if (currentWritingStep === WRITING_STEPS.TASK2) {
    currentWritingStep = WRITING_STEPS.PREVIEW;
    renderWritingStep();
    hashNavigationLocked = true;
    window.location.hash = '#/writing/preview';
    hashNavigationLocked = false;
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

  showResults();
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

function navigateToNextPart() {
  pauseTimer();
  const nextPart = getNextPartKey();

  if (!nextPart) {
    goToPreview();
    return;
  }

  saveProgress();

  if (currentSection === 'SPEAKING') {
    beginSpeaking(nextPart.key);
    startTimer(currentSection);
  } else {
    beginMcPart(nextPart.key);
    startTimer(currentSection);
  }
}

function navigateToPart(partKey) {
  if (!currentSection) return;

  const targetSection = getSectionKey(partKey);
  if (targetSection !== currentSection) return;
  if (partKey === currentPartKey) return;

  pauseTimer();
  saveProgress();
  beginMcPart(partKey);
  startTimer(currentSection);
}

function previousQuestion() {
  if (currentSection === 'WRITING') {
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

  if (currentSection === 'SPEAKING') {
    previousSpeakingTask();
    return;
  }

  navigateToPrevGroup();
}

function nextQuestion() {
  if (currentSection === 'WRITING') {
    nextSectionStep();
    return;
  }

  if (currentSection === 'SPEAKING') {
    nextSpeakingTask();
    return;
  }

  navigateToNextGroup();
}

function goToPreview() {
  pauseTimer();
  if (!currentPartKey) return;

  if (currentSection === 'WRITING') {
    saveCurrentWritingResponse();
  }
  saveProgress();

  hashNavigationLocked = true;
  window.location.hash = `#/${currentPartKey}/preview`;
  hashNavigationLocked = false;

  renderSectionPreview();
}

function nextSpeakingTask() {
  if (currentSection !== 'SPEAKING') return;

  saveProgress();

  if (speakingTaskIndex < speakingPart.tasks.length - 1) {
    speakingTaskIndex++;
    renderSpeakingTask();
  } else {
    goToPreview();
  }
}

function previousSpeakingTask() {
  if (currentSection !== 'SPEAKING') return;

  if (speakingTaskIndex > 0) {
    speakingTaskIndex--;
    renderSpeakingTask();
  }
}

function buildAllSectionGroups(section) {
  const allGroups = [];
  let sectionGlobalNum = 0;

  if (section === 'LISTENING') {
    const parts = quizData.LISTENING?.parts || [];
    parts.forEach(part => {
      const partId = part.id;
      const partKey = `LISTENING_P${partId}`;
      let partLocalNum = 0;
      if (part.questions) {
        part.questions.forEach(q => {
          partLocalNum++;
          sectionGlobalNum++;
          const processed = processQuestion(q, section, partId, partLocalNum);
          processed.partKey = partKey;
          processed.displayNumber = sectionGlobalNum;
          allGroups.push({
            groupNumber: partLocalNum,
            mainAudio: q.audio || null,
            questionRange: { start: sectionGlobalNum, end: sectionGlobalNum },
            partId: partId,
            partKey: partKey,
            audioGroupNumber: null,
            partLabel: `Part ${partId}`,
            questions: [processed]
          });
        });
      } else if (part.audioGroups) {
        part.audioGroups.forEach(audioGroup => {
          const groupStartGlobal = sectionGlobalNum + 1;
          const groupQuestions = audioGroup.questions.map(q => {
            partLocalNum++;
            sectionGlobalNum++;
            const processed = processQuestion(q, section, partId, partLocalNum);
            processed.groupNumber = audioGroup.number;
            processed.mainAudio = audioGroup.mainAudio;
            processed.extraAudio = q.extraAudio || null;
            processed.partKey = partKey;
            processed.displayNumber = sectionGlobalNum;
            return processed;
          });
          allGroups.push({
            groupNumber: audioGroup.number,
            mainAudio: audioGroup.mainAudio,
            questionRange: { start: groupStartGlobal, end: sectionGlobalNum },
            partId: partId,
            partKey: partKey,
            audioGroupNumber: audioGroup.number,
            partLabel: `Part ${partId}`,
            questions: groupQuestions
          });
        });
      }
    });
  } else if (section === 'READING_AND_GRAMMAR') {
    const data = quizData.READING_AND_GRAMMAR?.parts || [];
    data.forEach((part, idx) => {
      const partId = idx + 1;
      const partKey = `READING_P${partId}`;
      let partLocalNum = 0;
      if (part.questions) {
        part.questions.forEach(q => {
          partLocalNum++;
          sectionGlobalNum++;
          const processed = processQuestion(q, section, partId, partLocalNum);
          processed.partKey = partKey;
          processed.displayNumber = sectionGlobalNum;
          allGroups.push({
            groupNumber: partLocalNum,
            mainAudio: null,
            questionRange: { start: sectionGlobalNum, end: sectionGlobalNum },
            partId: partId,
            partKey: partKey,
            audioGroupNumber: null,
            partLabel: `Part ${partId}`,
            questions: [processed]
          });
        });
      } else if (part.readingGroups) {
        part.readingGroups.forEach(rg => {
          const groupStartLocal = partLocalNum + 1;
          const groupQuestions = rg.questions.map(q => {
            partLocalNum++;
            sectionGlobalNum++;
            const processed = processQuestion(q, section, partId, partLocalNum);
            processed.groupNumber = rg.number;
            processed.partKey = partKey;
            processed.displayNumber = sectionGlobalNum;
            return processed;
          });
          const groupData = {
            groupNumber: rg.number,
            mainAudio: null,
            questionRange: { start: sectionGlobalNum - rg.questions.length + 1, end: sectionGlobalNum },
            partId: partId,
            partKey: partKey,
            audioGroupNumber: null,
            partLabel: `Part ${partId}`,
            groupLabel: rg.groupLabel,
            questions: groupQuestions
          };
          if (rg.article) {
            groupData.article = rg.article;
          }
          if (rg.isConnector) {
            groupData.isConnector = true;
            groupData.connectorArticles = rg.connectorArticles;
          }
          allGroups.push(groupData);
        });
      }
    });
  }

  return allGroups;
}

function renderSectionPreview() {
  sectionPreviewMode = true;

  if (currentSection === 'WRITING') {
    currentWritingStep = WRITING_STEPS.PREVIEW;
    renderWritingStep();
    return;
  }

  if (currentSection === 'SPEAKING') {
    renderSpeakingPreview();
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

  const allGroups = buildAllSectionGroups(currentSection);
  let answeredCount = 0;
  let totalQ = 0;

  getElement('category-badge').textContent = getSectionBadge(currentPartKey);
  getElement('progress-text').textContent = `Preview`;
  getElement('progress-bar').style.width = '100%';

  getElement('audio-container').classList.add('hidden');
  getElement('transcription-toggle').classList.add('hidden');
  getElement('transcription-text').classList.add('hidden');
  getElement('reading-text').classList.add('hidden');

  let html = '<div class="preview-section"><h3>Revisa tus respuestas</h3>';
  html += '<div class="preview-scroll-container">';

  allGroups.forEach((grp) => {
    const partLabel = grp.partLabel;
    let headerText = `${partLabel}`;
    if (grp.groupLabel) {
      headerText += ` ${grp.groupLabel}`;
    }
    if (grp.article) {
      headerText += ` — Article ${grp.article.letter}`;
    } else if (grp.isConnector) {
      headerText += ` — Connector`;
    } else if (grp.audioGroupNumber) {
      headerText += ` — Audio ${grp.audioGroupNumber}`;
    }
    const { start, end } = grp.questionRange;
    headerText += ` — Questions ${start}${end !== start ? '-' + end : ''}`;

    html += `<div class="preview-slide">`;
    html += `<div class="preview-slide-header">${headerText}</div>`;

    grp.questions.forEach(q => {
      const questionIdx = shuffledQuestions.findIndex(sq => sq.globalNumber === q.globalNumber);
      const isAnswered = answeredQuestions.has(questionIdx);
      const displayNum = q.displayNumber || q.globalNumber;
      const userAnswerIdx = groupSelectedAnswers[q.globalNumber];
      totalQ++;
      if (isAnswered) answeredCount++;

      let statusClass = 'unanswered';
      let statusText = 'Sin responder';
      let answerDetail = '';

      if (isAnswered && questionIdx >= 0) {
        const sq = shuffledQuestions[questionIdx];
        statusClass = 'answered';
        if (userAnswerIdx !== undefined) {
          const userLetter = letters[userAnswerIdx];
          const isCorrect = userAnswerIdx === sq.correctShuffledIndex;
          statusClass = isCorrect ? 'correct' : 'incorrect';
          const correctLetter = letters[sq.correctShuffledIndex];
          const userText = sq.options ? sq.options[userAnswerIdx] : userLetter;
          const correctText = sq.options ? sq.options[sq.correctShuffledIndex] : correctLetter;
          answerDetail = isCorrect
            ? `✓ Tu respuesta: ${userLetter}. ${userText}`
            : `✗ Tu respuesta: ${userLetter}. ${userText} — Correcta: ${correctLetter}. ${correctText}`;
        }
      }

      html += `<div class="preview-question">`;
      html += `<div class="preview-q-text"><span class="preview-q-num">Q${displayNum}.</span> ${q.question}</div>`;
      html += `<div class="preview-q-answer ${statusClass}">`;
      html += answerDetail || statusText;
      html += `</div></div>`;
    });

    html += '</div>';
  });

  html += '</div>';

  html += `<div class="preview-summary">${answeredCount}/${totalQ} respondidas</div>`;
  html += `<div class="preview-submit-container"><button class="btn-submit-preview" onclick="submitFromPreview()">ENVIAR</button></div>`;
  html += '</div>';

  getElement('question-text').classList.add('hidden');
  getElement('options-container').innerHTML = html;
  getElement('controls').classList.add('hidden');
}

function renderSpeakingPreview() {
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

  getElement('audio-container').classList.add('hidden');
  getElement('transcription-toggle').classList.add('hidden');
  getElement('transcription-text').classList.add('hidden');
  getElement('reading-text').classList.add('hidden');
  getElement('feedback-container').classList.add('hidden');

  getAllSpeakingAudio().then(records => {
    const speakingPartData = speakingPart;
    if (!speakingPartData) return;

    const tasks = speakingPartData.tasks;
    const answered = speakingResponses.filter(r => r !== null && r !== undefined).length;

    getElement('category-badge').textContent = 'SPEAKING';
    getElement('progress-text').textContent = `Preview`;
    getElement('progress-bar').style.width = '100%';

    let html = '<div class="preview-section"><h3>Revisa tus respuestas de Speaking</h3>';
    html += '<div class="preview-scroll-container">';

    tasks.forEach((task, i) => {
      const hasRecording = speakingResponses[i] !== null && speakingResponses[i] !== undefined;
      const duration = hasRecording ? speakingResponses[i].duration : null;

      html += `<div class="preview-slide">`;
      html += `<div class="preview-slide-header">Task ${task.number} — ${task.timeLimit}s limit</div>`;
      html += `<div class="preview-question">`;
      html += `<div class="preview-q-text"><span class="preview-q-num">Prompt:</span> ${task.prompt}</div>`;

      if (hasRecording) {
        html += `<div class="preview-q-answer correct">`;
        html += `✓ Response recorded (${duration}s)`;
        html += `<button class="btn-preview-playback" data-task-idx="${i}" style="margin-top:8px;">▶ Play recording</button>`;
        html += `<audio class="hidden" id="preview-audio-${i}"></audio>`;
        html += `</div>`;
      } else {
        html += `<div class="preview-q-answer unanswered">Sin respuesta</div>`;
      }

      html += `</div></div>`;
    });

    html += '</div>';
    html += `<div class="preview-summary">${answered}/${tasks.length} respondidas</div>`;
    html += `<div class="preview-submit-container"><button class="btn-submit-preview" onclick="submitFromPreview()">ENVIAR</button></div>`;
    html += '</div>';

    getElement('question-text').classList.add('hidden');
    getElement('options-container').innerHTML = html;
    getElement('controls').classList.add('hidden');

    document.querySelectorAll('.btn-preview-playback').forEach(btn => {
      btn.addEventListener('click', () => {
        const taskIdx = parseInt(btn.dataset.taskIdx);
        playSpeakingPreviewRecording(taskIdx, btn);
      });
    });
  }).catch(() => {
    renderSpeakingPreviewFallback();
  });
}

function playSpeakingPreviewRecording(taskIdx, btn) {
  const response = speakingResponses[taskIdx];
  if (!response || !response.blob) return;

  const audioEl = document.getElementById(`preview-audio-${taskIdx}`);
  if (!audioEl) return;

  const url = URL.createObjectURL(response.blob);
  audioEl.src = url;
  audioEl.play();

  btn.textContent = '⏸ Playing...';
  btn.disabled = true;

  audioEl.onended = () => {
    URL.revokeObjectURL(url);
    btn.textContent = '▶ Play recording';
    btn.disabled = false;
  };

  audioEl.onerror = () => {
    URL.revokeObjectURL(url);
    btn.textContent = '▶ Play recording';
    btn.disabled = false;
  };
}

function renderSpeakingPreviewFallback() {
  getElement('category-badge').textContent = 'SPEAKING';
  getElement('progress-text').textContent = `Preview`;
  getElement('progress-bar').style.width = '100%';

  let html = '<div class="preview-section"><h3>Revisa tus respuestas de Speaking</h3>';
  html += '<div class="preview-scroll-container">';

  speakingPart.tasks.forEach((task, i) => {
    const hasRecording = speakingResponses[i] !== null && speakingResponses[i] !== undefined;
    const duration = hasRecording ? speakingResponses[i].duration : null;

    html += `<div class="preview-slide">`;
    html += `<div class="preview-slide-header">Task ${task.number}</div>`;
    html += `<div class="preview-question">`;
    html += `<div class="preview-q-text">${task.prompt}</div>`;

    if (hasRecording) {
      html += `<div class="preview-q-answer correct">✓ Response recorded (${duration}s)</div>`;
    } else {
      html += `<div class="preview-q-answer unanswered">Sin respuesta</div>`;
    }

    html += `</div></div>`;
  });

  html += '</div></div>';

  getElement('question-text').classList.add('hidden');
  getElement('options-container').innerHTML = html;
  getElement('controls').classList.add('hidden');
}

function submitFromPreview() {
  pauseTimer();
  saveProgress();
  showResults();
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
    let catName = SECTION_DISPLAY[cat] || cat;

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
      let count = 0;
      if (catData) {
        if (catData.parts) {
          catData.parts.forEach(p => {
            if (p.questions) count += p.questions.length;
            if (p.audioGroups) p.audioGroups.forEach(g => { count += g.questions.length; });
            if (p.readingGroups) p.readingGroups.forEach(g => { count += g.questions.length; });
          });
        }
      }
      totalParts += count;
      totalScore += score[cat] || 0;
      displayScore = count > 0 ? `${score[cat] || 0}/${count}` : '0/0';
    } else if (cat === 'SPEAKING') {
      const totalTasks = catData?.parts?.reduce((sum, p) => sum + (p.tasks?.length || 0), 0) || 0;
      totalParts += totalTasks;
      const answered = speakingResponses.filter(r => r).length;
      totalScore += answered;
      displayScore = `${answered}/${totalTasks}`;
    }

    const div = document.createElement('div');
    div.className = 'result-category';
    div.innerHTML = `
      <span class="result-category-name">${catName}</span>
      <span class="result-category-score">${displayScore}</span>
    `;
    breakdown.appendChild(div);
  });

  const percentage = totalParts > 0 ? Math.round((totalScore / totalParts) * 100) : 0;
  getElement('score-display').textContent = `${percentage}% (${totalScore}/${totalParts})`;

  logActivity('FIN', `Resultado: ${percentage}% (${totalScore}/${totalParts})`);
  clearProgress();
  getElement('email-btn').classList.remove('hidden');
}

function sendEmail() {
  let listeningCount = 0;
  let readingCount = 0;

  if (quizData.LISTENING.parts) {
    quizData.LISTENING.parts.forEach(p => {
      if (p.questions) listeningCount += p.questions.length;
      if (p.audioGroups) p.audioGroups.forEach(g => { listeningCount += g.questions.length; });
    });
  }

  if (quizData.READING_AND_GRAMMAR?.parts) {
    quizData.READING_AND_GRAMMAR.parts.forEach(item => {
      if (item.questions) readingCount += item.questions.length;
      if (item.readingGroups) item.readingGroups.forEach(g => { readingCount += g.questions.length; });
    });
  }

  const writingPart1 = currentGroup?.task1?.length || 0;
  const writingPart2 = currentGroup?.task2 ? 1 : 0;
  const part1Answered = sectionResponses.filter((r, i) => r && r.length > 0 && i < writingPart1).length;
  const part2Answered = sectionResponses[writingPart1] && sectionResponses[writingPart1].length > 0 ? 1 : 0;
  const speakingTaskCount = quizData.SPEAKING?.parts?.reduce((sum, p) => sum + (p.tasks?.length || 0), 0) || 0;
  const speakingAnswered = speakingResponses.filter(r => r).length;

  const totalScore = score.WRITING + score.LISTENING + score.READING_AND_GRAMMAR + speakingAnswered;
  const totalParts = writingPart1 + writingPart2 + listeningCount + readingCount + speakingTaskCount;
  const percentage = totalParts > 0 ? Math.round((totalScore / totalParts) * 100) : 0;

  const subject = 'Resultados MET Quiz - Your English World';
  const speakingDetails = speakingResponses
    .map((r, i) => r ? `  Task ${i + 1}: ${r.duration}s recorded` : `  Task ${i + 1}: No response`)
    .join('\n');

  const body = `Resultados del Test MET
=======================
Puntuación Total: ${percentage}% (${totalScore}/${totalParts})

Desglose por sección:
- WRITING: ${part1Answered}/${writingPart1} • ${part2Answered}/${writingPart2}
- LISTENING: ${score.LISTENING || 0}/${listeningCount}
- READING & GRAMMAR: ${score.READING_AND_GRAMMAR || 0}/${readingCount}
- SPEAKING: ${speakingAnswered}/${speakingTaskCount}
${speakingDetails}

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
      const sourceData = quizData[currentSection];
      if (!sourceData) return;

      const allQuestions = [];
      if (currentSection === 'LISTENING' && sourceData.parts) {
        sourceData.parts.forEach((exercise, exerciseIndex) => {
          if (exercise.questions) {
            exercise.questions.forEach((q, qIndex) => {
              allQuestions.push({ ...q, exerciseIndex, questionIndex: qIndex, category: currentSection, audio: exercise.audio || null });
            });
          }
          if (exercise.audioGroups) {
            exercise.audioGroups.forEach(group => {
              group.questions.forEach((q, qIndex) => {
                allQuestions.push({ ...q, exerciseIndex, questionIndex: qIndex, category: currentSection, mainAudio: group.mainAudio, extraAudio: q.extraAudio || null });
              });
            });
          }
        });
      }

      shuffledQuestions = saved.questionsOrder.map(order => {
        const original = allQuestions.find(
          q => q.exerciseIndex === order.exerciseIndex && q.questionIndex === order.questionIndex
        );
        return original ? {
          ...shuffleOptions(original),
          exerciseIndex: original.exerciseIndex,
          questionIndex: original.questionIndex
        } : null;
      }).filter(Boolean);

      getElement('category-select').classList.add('hidden');
      getElement('quiz-view').classList.remove('hidden');

      loadQuestion();
      resumeTimer();
    }
  }
}

function initEventListeners() {
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
    } else if (currentSection === 'SPEAKING') {
      const isLastTask = speakingTaskIndex >= speakingPart.tasks.length - 1;
      if (isLastTask) {
        goToPreview();
      } else {
        nextSpeakingTask();
      }
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
  module.exports = { quizData, loadGroup, loadAllData };
}

init();
