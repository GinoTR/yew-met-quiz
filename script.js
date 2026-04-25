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
  SPEAKING: { time: 10 * 60, parts: 2, items: 5, name: 'speaking' }
};

const SECTION_NAMES = {
  'writing': 'WRITING',
  'listening': 'LISTENING',
  'reading': 'READING_AND_GRAMMAR',
  'speaking': 'SPEAKING'
};

const SECTION_TIMES = {
  WRITING: 45 * 60,
  LISTENING: 35 * 60,
  READING_AND_GRAMMAR: 65 * 60,
  SPEAKING: 10 * 60
};

const WARNING_TIME = 5 * 60;

let timerInterval = null;
let timerRemaining = 0;
let timerRunning = false;

function formatHash(section, taskPart, qNum) {
  return `#/${section}/${taskPart}/q${qNum.toString().padStart(2, '0')}`;
}

function parseHash() {
  const hash = window.location.hash.slice(1);
  if (!hash || hash === '/') return null;
  
  const parts = hash.split('/').filter(p => p);
  if (parts.length < 2) return null;
  
  const [section, taskPart, qPart] = parts;
  const sectionKey = SECTION_NAMES[section];
  if (!sectionKey) return null;
  
  if (taskPart === 'preview') {
    return { section: sectionKey, taskPart: 'preview', qNum: null, hash };
  }
  
  if (parts.length < 3) return null;
  
  const qMatch = qPart.match(/q(\d+)/);
  if (!qMatch) return null;
  
  const qNum = parseInt(qMatch[1], 10);
  return { section: sectionKey, taskPart, qNum, hash };
}

function updateHash(section, taskPart, qNum) {
  const config = SECTION_CONFIG[section];
  if (config) {
    window.location.hash = formatHash(config.name, taskPart, qNum);
  }
}

function getProgressKey(section, taskPart, qNum) {
  const config = SECTION_CONFIG[section];
  if (config) {
    return `${config.name}_${taskPart}_q${qNum.toString().padStart(2, '0')}`;
  }
  return `${section.toLowerCase()}_${taskPart}_q${qNum}`;
}

function saveAnswerToHash(section, taskPart, qNum, answer) {
  const key = getProgressKey(section, taskPart, qNum);
  const saved = JSON.parse(localStorage.getItem('metQuizProgress') || '{}');
  saved.answers = saved.answers || {};
  saved.answers[key] = answer;
  saved.currentHash = window.location.hash;
  localStorage.setItem('metQuizProgress', JSON.stringify(saved));
}

function getAnswerFromHash(section, taskPart, qNum) {
  const key = getProgressKey(section, taskPart, qNum);
  const saved = JSON.parse(localStorage.getItem('metQuizProgress') || '{}');
  return saved.answers ? saved.answers[key] : null;
}

function loadFromHash() {
  const parsed = parseHash();
  if (!parsed) {
    renderCategorySelect();
    return;
  }
  
  const { section, taskPart, qNum } = parsed;
  currentSection = section;
  
  getElement('category-select').classList.add('hidden');
  getElement('quiz-view').classList.remove('hidden');
  getElement('results-container').classList.add('hidden');
  
  if (taskPart === 'preview') {
    if (section === 'WRITING') {
      currentWritingStep = WRITING_STEPS.PREVIEW;
      setupInstructionsPanel();
      renderWritingStep();
    } else {
      showResults();
    }
    startTimer(section);
    return;
  }
  
  getElement('category-badge').textContent = section.replace('_', ' ');
  getElement('progress-text').textContent = `${qNum}/`;
  
  if (section === 'WRITING') {
    if (taskPart === 'task1' && qNum >= 1 && qNum <= 3) {
      currentWritingStep = qNum - 1;
    } else if (taskPart === 'task2') {
      currentWritingStep = 3;
    }
    setupInstructionsPanel();
    renderWritingStep();
  } else {
    currentQuestionIndex = qNum - 1;
    if (quizData[section] && quizData[section].length > 0) {
      loadQuestion();
      startTimer(section);
    }
  }
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
    currentExerciseIndex: currentExerciseIndex,
    score: score,
    answeredQuestions: Array.from(answeredQuestions),
    questionsOrder: shuffledQuestions.map(q => ({ exerciseIndex: q.exerciseIndex, questionIndex: q.questionIndex }))
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
    { key: 'WRITING', name: 'Escritura' },
    { key: 'LISTENING', name: 'Comprensión Auditiva' },
    { key: 'READING_AND_GRAMMAR', name: 'Lectura y Gramática' },
    { key: 'SPEAKING', name: 'Expresión Oral' }
  ];

  sections.forEach(sec => {
    const data = quizData[sec.key];
    let count = 0;
    let label = '';
    
    if (sec.key === 'WRITING' && data && data.groups) {
      count = data.groups.length;
      label = `${sec.name} - ${count} ejercicios`;
    } else if (data && data.length > 0) {
      count = data.length;
      label = `${sec.name} - ${count} preguntas`;
    } else {
      label = `${sec.name} - Próximamente`;
    }

    const btn = document.createElement('button');
    btn.className = 'category-btn';
    function formatSectionName(key) {
  const names = {
    'WRITING': 'WRITING',
    'LISTENING': 'LISTENING',
    'READING_AND_GRAMMAR': 'READING AND GRAMMAR',
    'SPEAKING': 'SPEAKING'
  };
  return names[key] || key.replace(/_/g, ' ');
}

    btn.innerHTML = `<strong>${formatSectionName(sec.key)}</strong><span>${label}</span>`;
    
    if (count === 0) {
      btn.style.opacity = '0.5';
      btn.style.pointerEvents = 'none';
    }
    
    btn.addEventListener('click', () => startFromSection(sec.key));
    container.appendChild(btn);
  });

  const savedProgress = loadProgress();
  getElement('continue-btn').classList.toggle('hidden', !savedProgress);
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
  currentSection = section;
  currentExerciseIndex = 0;
  currentQuestionIndex = 0;
  selectedOptionIndex = null;
  score = { WRITING: 0, LISTENING: 0, READING_AND_GRAMMAR: 0, SPEAKING: 0 };
  answeredQuestions.clear();
  currentAudioSrc = null;
  currentAudioElement = null;

  const config = SECTION_CONFIG[section];

  if (section === 'WRITING') {
    if (!quizData.WRITING || !quizData.WRITING.groups || quizData.WRITING.groups.length === 0) {
      alert('La sección de Writing aún no tiene contenido.');
      return;
    }
    currentGroup = shuffleArray([...quizData.WRITING.groups])[0];
    sectionResponses = [];
    currentWritingStep = WRITING_STEPS.TASK1_Q1;
    currentPreviewIndex = 0;
    
    getElement('category-select').classList.add('hidden');
    getElement('quiz-view').classList.remove('hidden');
    getElement('results-container').classList.add('hidden');
    
    setupInstructionsPanel();
    logActivity('INICIO', `WRITING - Grupo: ${currentGroup.id}`);
    renderWritingStep();
    updatePrevButtonVisibility();
    startTimer(section);
    updateHash('WRITING', 'task1', 1);
    return;
  }

  if (!quizData[section] || quizData[section].length === 0) {
    alert('Esta sección aún no tiene contenido.');
    return;
  }

  const data = quizData[section];
  if (Array.isArray(data) && data[0] && data[0].groups) {
    const groups = shuffleArray([...data]);
    questions = groups.map(g => g).flat();
  } else {
    questions = shuffleArray([...data]);
  }

  shuffledQuestions = questions.map((q, i) => ({
    ...shuffleOptions(q),
    questionIndex: i
  }));

  getElement('category-select').classList.add('hidden');
  getElement('quiz-view').classList.remove('hidden');
  getElement('results-container').classList.add('hidden');

  logActivity('INICIO', `Sección: ${section}`);
  loadQuestion();
  updatePrevButtonVisibility();
  startTimer(section);
  const qNum = currentQuestionIndex + 1;
  updateHash(section, `part${Math.ceil(qNum / 20)}`, qNum);
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
    getElement('restart-btn').classList.remove('hidden');
    getElement('restart-btn').textContent = 'Enviar';
    setupCarouselEvents();
  } else {
    getElement('controls').classList.remove('hidden');
    getElement('check-btn').classList.add('hidden');
    getElement('next-btn').classList.remove('hidden');
    getElement('next-btn').textContent = 'Siguiente';
    getElement('prev-btn').classList.remove('hidden');
    getElement('restart-btn').classList.add('hidden');
  }
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
    <script>
      const textarea = document.getElementById('writing-textarea');
      const counter = document.getElementById('char-count');
      const counterContainer = document.querySelector('.char-counter');
      
      textarea.addEventListener('input', function() {
        const count = this.value.length;
        counter.textContent = count;
        counterContainer.classList.toggle('visible', count > ${TASK1_CHAR_LIMIT * 0.9});
      });
      
      textarea.focus();
    </script>
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
    <script>
      const textarea = document.getElementById('writing-textarea');
      const counter = document.getElementById('char-count');
      const counterContainer = document.querySelector('.char-counter');
      
      textarea.addEventListener('input', function() {
        const count = this.value.length;
        counter.textContent = count;
        counterContainer.classList.toggle('visible', count > ${TASK2_CHAR_LIMIT * 0.9});
      });
      
      textarea.focus();
    </script>
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
      <div class="carousel-indicators">
        ${slides.map((_, i) => `<span class="indicator ${i === currentPreviewIndex ? 'active' : ''}" data-index="${i}"></span>`).join('')}
      </div>
      <button id="edit-response-btn" class="btn btn-edit">Editar esta respuesta</button>
    </div>
  `;
}

function setupCarouselEvents() {
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');
  const editBtn = document.getElementById('edit-response-btn');
  const indicators = document.querySelectorAll('.indicator');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => navigateCarousel(-1));
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => navigateCarousel(1));
  }
  if (editBtn) {
    editBtn.addEventListener('click', editCurrentResponse);
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
  updateHash('WRITING', taskPart, qNum);
}

function updatePrevButtonVisibility() {
  const prevBtn = getElement('prev-btn');
  const previewBtn = getElement('preview-btn');
  const submitBtn = getElement('submit-section-btn');
  const checkBtn = getElement('check-btn');
  const nextBtn = getElement('next-btn');
  const restartBtn = getElement('restart-btn');
  const skipBtn = getElement('skip-btn');
  
  if (currentSection === 'WRITING') {
    prevBtn?.classList.toggle('hidden', currentWritingStep === WRITING_STEPS.TASK1_Q1);
    
    const isPreview = currentWritingStep === WRITING_STEPS.PREVIEW;
    const isTask2 = currentWritingStep === WRITING_STEPS.TASK2;
    previewBtn?.classList.toggle('hidden', !isPreview);
    submitBtn?.classList.toggle('hidden', !isPreview);
    checkBtn?.classList.toggle('hidden', true);
    nextBtn?.classList.toggle('hidden', isPreview);
    restartBtn.textContent = isPreview ? 'Enviar' : 'Reiniciar';
    
    if (skipBtn) {
      skipBtn.classList.toggle('hidden', !isTask2);
      if (isTask2) {
        skipBtn.textContent = 'Finalizar';
        skipBtn.classList.remove('btn-secondary');
        skipBtn.classList.add('btn-primary');
      } else {
        skipBtn.textContent = '⏭ Finalizar';
        skipBtn.classList.remove('btn-primary');
        skipBtn.classList.add('btn-secondary');
      }
    }
  } else if (currentSection) {
    prevBtn?.classList.toggle('hidden', currentQuestionIndex === 0);
    
    const isLast = currentQuestionIndex >= shuffledQuestions.length - 1;
    previewBtn?.classList.toggle('hidden', !isLast);
    submitBtn?.classList.toggle('hidden', !isLast);
    checkBtn?.classList.toggle('hidden', isLast);
    nextBtn?.classList.toggle('hidden', isLast);
    restartBtn?.classList.toggle('hidden', isLast);
    
    if (skipBtn) {
      skipBtn.classList.toggle('hidden', !isLast);
      if (!isLast) {
        skipBtn.textContent = '⏭ Skip';
        skipBtn.classList.remove('btn-primary');
        skipBtn.classList.add('btn-secondary');
      } else {
        skipBtn.textContent = 'Finalizar';
        skipBtn.classList.remove('btn-secondary');
        skipBtn.classList.add('btn-primary');
      }
    }
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
}

function nextSectionStep() {
  if (currentSection !== 'WRITING') return;
  
  saveCurrentWritingResponse();
  
  let taskPart = 'task1';
  let qNum = 1;
  
  if (currentWritingStep === WRITING_STEPS.INSTRUCTIONS) {
    currentWritingStep = WRITING_STEPS.TASK1_Q1;
    qNum = 1;
    renderWritingStep();
    updateHash('WRITING', taskPart, qNum);
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
    updateHash('WRITING', taskPart, qNum);
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

  getElement('category-badge').textContent = question.category;

  getElement('transcription-toggle').innerHTML = '';
  getElement('transcription-toggle').classList.add('hidden');
  getElement('transcription-text').classList.add('hidden');
  getElement('reading-text').classList.add('hidden');

  getElement('controls').classList.remove('hidden');

  if (question.audio) {
    if (currentAudioSrc !== question.audio) {
      currentAudioSrc = question.audio;
      getElement('audio-container').innerHTML = `<audio id="main-audio" controls src="${question.audio}"></audio>`;
      currentAudioElement = document.getElementById('main-audio');
    }
    getElement('audio-container').classList.remove('hidden');
  } else {
    getElement('audio-container').classList.add('hidden');
    currentAudioSrc = null;
    currentAudioElement = null;
  }

  if (question.transcription) {
    getElement('transcription-toggle').innerHTML = `<button id="transcription-btn" data-tooltip="Transcription">T</button>`;
    getElement('transcription-toggle').classList.remove('hidden');
    getElement('transcription-btn').addEventListener('click', toggleTranscription);
    
    let transcriptionContent = question.transcription;
    if (question.instruction) {
      transcriptionContent = `<em>(${question.instruction})</em><br><br>"${question.transcription}"`;
    }
    getElement('transcription-text').innerHTML = transcriptionContent;
    getElement('transcription-text').classList.add('hidden');
    document.getElementById('transcription-btn').classList.remove('active');
    
    getElement('question-text').textContent = '';
    getElement('question-text').classList.add('hidden');
  } else {
    getElement('transcription-toggle').classList.add('hidden');
    getElement('question-text').textContent = question.question;
    getElement('question-text').classList.remove('hidden');
  }

  if (question.lectureText) {
    getElement('reading-text').innerHTML = `<strong>Lecture:</strong><br><br>${question.lectureText}`;
    getElement('reading-text').classList.remove('hidden');
  } else if (question.text) {
    getElement('reading-text').textContent = question.text;
    getElement('reading-text').classList.remove('hidden');
  }

  const optionsContainer = getElement('options-container');
  optionsContainer.innerHTML = '';

  question.shuffledOptions.forEach((opt, i) => {
    const optionDiv = document.createElement('div');
    optionDiv.className = 'option';
    optionDiv.innerHTML = `<span class="option-letter">${letters[i]}</span><span>${opt}</span>`;
    optionDiv.addEventListener('click', () => selectOption(i, optionDiv));
    optionsContainer.appendChild(optionDiv);
  });

  getElement('feedback-container').classList.add('hidden');
  getElement('check-btn').classList.remove('hidden');
  getElement('next-btn').classList.add('hidden');
  getElement('restart-btn').classList.add('hidden');
  getElement('restart-btn').textContent = 'Reiniciar Pregunta';

  selectedOptionIndex = null;
  updateProgressBar();
  saveProgress();
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

  const qNum = currentQuestionIndex + 1;
  saveAnswerToHash(currentSection, `part${Math.ceil(qNum / 20)}`, qNum, letters[selectedOptionIndex]);

  pauseTimer();
  
  getElement('check-btn').classList.add('hidden');
  getElement('next-btn').classList.remove('hidden');
  getElement('restart-btn').classList.remove('hidden');

  saveProgress();
}

function nextQuestion() {
  if (currentSection === 'WRITING') {
    nextSectionStep();
    return;
  }

  currentQuestionIndex++;
  const qNum = currentQuestionIndex + 1;

  if (currentQuestionIndex >= shuffledQuestions.length) {
    pauseTimer();
    showResults();
  } else {
    loadQuestion();
    resumeTimer();
    const config = SECTION_CONFIG[currentSection];
    if (config) {
      updateHash(currentSection, `part${Math.ceil(qNum / 20)}`, qNum);
    }
  }
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
      updateHash('WRITING', currentWritingStep === WRITING_STEPS.TASK2 ? 'task2' : 'task1', qNum);
    }
    return;
  }

  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    loadQuestion();
    resumeTimer();
    const qNum = currentQuestionIndex + 1;
    const config = SECTION_CONFIG[currentSection];
    if (config) {
      updateHash(currentSection, `part${Math.ceil(qNum / 20)}`, qNum);
    }
  }
}

function goToPreview() {
  pauseTimer();
  const config = SECTION_CONFIG[currentSection];
  if (!config) return;
  
  window.location.hash = `#/${config.name}/preview`;
  
  if (currentSection === 'WRITING') {
    currentWritingStep = WRITING_STEPS.PREVIEW;
    renderWritingStep();
  }
  updatePrevButtonVisibility();
}

function restartQuestion() {
  getElement('confirm-modal').classList.remove('hidden');
  
  const confirmBtn = getElement('confirm-ok');
  const cancelBtn = getElement('confirm-cancel');
  
  const handleConfirm = () => {
    getElement('confirm-modal').classList.add('hidden');
    cleanup();
    
    if (currentSection === 'WRITING') {
      currentGroup = shuffleArray([...quizData.WRITING.groups])[0];
      sectionResponses = [];
      currentWritingStep = WRITING_STEPS.TASK1_Q1;
      currentPreviewIndex = 0;
      renderWritingStep();
      updatePrevButtonVisibility();
      return;
    }
    
    currentQuestionIndex = 0;
    selectedOptionIndex = null;
    score[currentSection] = 0;
    answeredQuestions.clear();
    loadQuestion();
  };
  
  const handleCancel = () => {
    getElement('confirm-modal').classList.add('hidden');
    cleanup();
  };
  
  const cleanup = () => {
    confirmBtn.removeEventListener('click', handleConfirm);
    cancelBtn.removeEventListener('click', handleCancel);
  };
  
  confirmBtn.addEventListener('click', handleConfirm);
  cancelBtn.addEventListener('click', handleCancel);
}

function showResults() {
  pauseTimer();
  
  const config = SECTION_CONFIG[currentSection];
  if (config) {
    window.location.hash = `#/${config.name}/results`;
  }
  
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

function restartTest() {
  clearProgress();
  currentQuestionIndex = 0;
  selectedOptionIndex = null;
  score = { WRITING: 0, LISTENING: 0, READING_AND_GRAMMAR: 0, SPEAKING: 0 };
  answeredQuestions.clear();
  shuffledQuestions = [];
  currentGroup = null;
  sectionResponses = [];
  currentWritingStep = 0;
  currentPreviewIndex = 0;

  getElement('email-btn').classList.remove('hidden');
  getElement('results-container').classList.add('hidden');
  
  if (currentSection) {
    beginQuiz(currentSection);
  } else {
    renderCategorySelect();
  }
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
  getElement('restart-btn')?.addEventListener('click', () => {
    if (getElement('restart-btn').textContent === 'Enviar') {
      submitWritingResponses();
    } else {
      restartQuestion();
    }
  });
  getElement('email-btn')?.addEventListener('click', sendEmail);
  getElement('restart-test-btn')?.addEventListener('click', restartTest);
  getElement('results-home-btn')?.addEventListener('click', goHome);
  getElement('continue-btn')?.addEventListener('click', continueFromSaved);
  getElement('home-btn')?.addEventListener('click', goHome);
  
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
    pauseTimer();
    goToPreview();
  });

  getElement('preview-btn')?.addEventListener('click', () => {
    if (currentSection === 'WRITING') {
      currentWritingStep = WRITING_STEPS.TASK2;
      renderWritingStep();
      updateHash('WRITING', 'task2', 1);
    } else {
      const qNum = currentQuestionIndex;
      if (qNum > 0) {
        currentQuestionIndex = qNum - 1;
        loadQuestion();
      }
      const config = SECTION_CONFIG[currentSection];
      if (config) {
        updateHash(currentSection, `part${Math.ceil(qNum / 20)}`, qNum);
      }
    }
  });

  getElement('submit-section-btn')?.addEventListener('click', () => {
    if (currentSection === 'WRITING') {
      submitWritingResponses();
    } else {
      showResults();
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
  clearProgress();
  currentQuestionIndex = 0;
  selectedOptionIndex = null;
  score = { WRITING: 0, LISTENING: 0, READING_AND_GRAMMAR: 0, SPEAKING: 0 };
  answeredQuestions.clear();
  shuffledQuestions = [];
  currentSection = null;
  currentExerciseIndex = 0;
  currentAudioSrc = null;
  currentAudioElement = null;
  currentGroup = null;
  sectionResponses = [];
  currentWritingStep = 0;
  currentPreviewIndex = 0;

  document.removeEventListener('keydown', handleCarouselKeydown);

  getElement('email-btn').classList.remove('hidden');
  getElement('quiz-view').classList.add('hidden');
  getElement('results-container').classList.add('hidden');
  getElement('category-select').classList.remove('hidden');
  getElement('section-instructions-panel').classList.add('hidden');
  getElement('back-modal').classList.add('hidden');
  getElement('confirm-modal').classList.add('hidden');
  getElement('time-modal').classList.add('hidden');
  
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
  
  const saved = loadProgress();
  if (saved && saved.currentSection && !window.location.hash) {
    getElement('continue-btn')?.classList.remove('hidden');
  }
  
  if (!loaded) {
    document.getElementById('category-select').innerHTML = `
      <div style="padding: 20px; background: #fff3cd; border-radius: 12px; color: #856404; margin: 20px 0;">
        <h3>⚠️ Advertencia</h3>
        <p>Algunos datos no se cargaron correctamente.</p>
      </div>
    `;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { quizData, loadQuestion, checkAnswer, loadAllData };
}

init();
