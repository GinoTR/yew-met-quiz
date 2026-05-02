// Archivo principal de JavaScript para el quiz MET de Your English World
// Este archivo contiene toda la lógica del quiz: preguntas, temporizador, navegación, etc.
// Los comentarios en español explican cada función para personas sin experiencia en programación.

// Datos de las preguntas - se cargan desde los archivos JSON
const quizData = {
  WRITING: null,      // Datos de Writing (se cargan después)
  LISTENING: [],       // Preguntas de Listening
  READING_AND_GRAMMAR: [], // Preguntas de Reading & Grammar
  SPEAKING: []         // Preguntas de Speaking
};

// Configuración de cada sección: tiempo en segundos, partes, etc.
const SECTION_CONFIG = {
  WRITING: { time: 45 * 60, tasks: 2, items: 4, name: 'writing' },
  LISTENING: { time: 35 * 60, parts: 3, items: 50, name: 'listening' },
  READING_AND_GRAMMAR: { time: 65 * 60, parts: 3, items: 50, name: 'reading' },
  SPEAKING: { time: 10 * 60, parts: 2, items: 5, name: 'speaking' },
  // Configuración de cada parte individual (Task 1, Task 2, Part 1, etc.)
  WRITING_TASK1: { time: 30 * 60, tasks: 1, items: 3, name: 'writing-task1', parentSection: 'WRITING' },
  WRITING_TASK2: { time: 45 * 60, tasks: 1, items: 1, name: 'writing-task2', parentSection: 'WRITING' },
  LISTENING_P1: { time: 35 * 60, parts: 3, items: 19, name: 'listening-p1', parentSection: 'LISTENING', partId: 1 },
  LISTENING_P2: { time: 35 * 60, parts: 3, items: 14, name: 'listening-p2', parentSection: 'LISTENING', partId: 2 },
  LISTENING_P3: { time: 35 * 60, parts: 3, items: 17, name: 'listening-p3', parentSection: 'LISTENING', partId: 3 },
  READING_P1: { time: 65 * 60, parts: 3, items: 20, name: 'reading-p1', parentSection: 'READING_AND_GRAMMAR', partId: 1 },
  READING_P2: { time: 65 * 60, parts: 3, items: 11, name: 'reading-p2', parentSection: 'READING_AND_GRAMMAR', partId: 2 },
  READING_P3: { time: 65 * 60, parts: 3, items: 20, name: 'reading-p3', parentSection: 'READING_AND_GRAMMAR', partId: 3 },
  SPEAKING_P1: { time: 10 * 60, parts: 2, items: 3, name: 'speaking-p1', parentSection: 'SPEAKING', partId: 1 },
  SPEAKING_P2: { time: 10 * 60, parts: 2, items: 2, name: 'speaking-p2', parentSection: 'SPEAKING', partId: 2 }
};

// Convierte nombre de sección (escrito) a clave interna (en inglés)
const SECTION_NAMES = {
  'writing': 'WRITING',
  'listening': 'LISTENING',
  'reading': 'READING_AND_GRAMMAR',
  'speaking': 'SPEAKING'
};

// Texto que se muestra en pantalla para cada sección
const SECTION_DISPLAY = {
  'WRITING': 'WRITING',
  'LISTENING': 'LISTENING',
  'READING_AND_GRAMMAR': 'READING & GRAMMAR',
  'SPEAKING': 'SPEAKING'
};

// Obtiene la sección padre a partir de una clave (ej: "writing-task1" → "WRITING")
function getSectionKey(partKey) {
  if (!partKey) return null;
  if (partKey.startsWith('WRITING')) return 'WRITING';
  if (partKey.startsWith('LISTENING')) return 'LISTENING';
  if (partKey.startsWith('READING')) return 'READING_AND_GRAMMAR';
  if (partKey.startsWith('SPEAKING')) return 'SPEAKING';
  return null;
}

// Convierte el nombre de la URL (hash) a una clave interna
// Ejemplo: "writing-task1" se convierte en "WRITING_TASK1"
// Convierte el nombre de la URL (hash) a una clave interna
function getPartKeyFromHashName(hashName) {
  // Busca si el hash empieza con writing, listening, reading o speaking
  const sectionMatch = hashName.match(/^(writing|listening|reading|speaking)-/);
  // Si no coincide, devuelve el nombre en mayúsculas cambiando guiones por guiones bajos
  if (!sectionMatch) return hashName.toUpperCase().replace(/-/g, '_');
  
  // Toma la parte del nombre (writing, listening, etc.)
  const sectionBase = sectionMatch[1].toUpperCase();
  // Quita la parte inicial para obtener el resto (task1, part2, etc.)
  const suffix = hashName.replace(sectionMatch[0], '');
  
  // Busca si hay "part" o "task" seguido de un número
  const partNum = suffix.match(/(?:part|task)(\d+)/i);
  if (partNum) {
    // Combina la sección con el número de parte
    // Para Writing usa TASK1, para otros usa P1
    return `${sectionBase}_P${partNum[1]}`.replace('_P', sectionBase === 'WRITING' ? '_TASK' : '_P');
  }
  
  // Si no hay número de parte, devuelve el nombre convertido
  return hashName.toUpperCase().replace(/-/g, '_');
}

// Muestra el nombre corto de la sección en la barra superior
function getSectionBadge(partKey) {
  const section = getSectionKey(partKey);
  if (!section) return 'MET QUIZ';
  return SECTION_DISPLAY[section] || section;
}

// Obtiene la etiqueta de la parte (ej: "Task 1" o "Part 2")
function getPartLabel(partKey) {
  const config = SECTION_CONFIG[partKey];
  if (!config || !config.partId) return '';
  const section = getSectionKey(partKey);
  // Para Writing usa "Task", para otros usa "Part"
  return section === 'WRITING' ? `Task ${config.partId}` : `Part ${config.partId}`;
}

// Crea el texto de progreso (ej: "Task 1: Q1-3/50")
function getPartProgressText(partKey, qStart, qEnd, totalQ) {
  const partLabel = getPartLabel(partKey);
  if (!partLabel) return `Q${qStart}/${totalQ}`;
  const qText = qStart === qEnd ? `Q${qStart}` : `Q${qStart}-${qEnd}`;
  return `${partLabel}: ${qText}/${totalQ}`;
}

// Tiempo límite para cada sección (en segundos)
const SECTION_TIMES = {
  WRITING: 45 * 60,        // 45 minutos
  LISTENING: 35 * 60,     // 35 minutos
  READING_AND_GRAMMAR: 65 * 60, // 65 minutos
  SPEAKING: 10 * 60       // 10 minutos
};

// Tiempo de advertencia (5 minutos antes de acabar)
const WARNING_TIME = 5 * 60;

// Lista de partes para cada sección (para navegación)
// Define qué partes tiene cada sección (Task 1, Task 2, Part 1, etc.)
const SECTION_PARTS = {
  // Writing tiene 2 partes: Task 1 y Task 2
  WRITING: [
    { key: 'WRITING_TASK1', name: 'Task 1', time: 45 * 60 },
    { key: 'WRITING_TASK2', name: 'Task 2', time: 45 * 60 }
  ],
  // Listening tiene 3 partes
  LISTENING: [
    { key: 'LISTENING_P1', name: 'Part 1', time: 35 * 60 },
    { key: 'LISTENING_P2', name: 'Part 2', time: 35 * 60 },
    { key: 'LISTENING_P3', name: 'Part 3', time: 35 * 60 }
  ],
  // Reading & Grammar tiene 3 partes
  READING_AND_GRAMMAR: [
    { key: 'READING_P1', name: 'Part 1', time: 65 * 60 },
    { key: 'READING_P2', name: 'Part 2', time: 65 * 60 },
    { key: 'READING_P3', name: 'Part 3', time: 65 * 60 }
  ],
  // Speaking tiene 2 partes
  SPEAKING: [
    { key: 'SPEAKING_P1', name: 'Part 1', time: 10 * 60 },
    { key: 'SPEAKING_P2', name: 'Part 2', time: 10 * 60 }
  ]
};

// Crea el texto de la URL (hash) para una parte y grupo
function formatHash(partKey, groupIndex) {
  const config = SECTION_CONFIG[partKey];
  if (!config) return `#/${partKey}/g${groupIndex}`; // Formato simple

  const sectionName = getSectionKey(partKey).toLowerCase(); // Nombre de la sección
  const partNum = config.partId || 1; // Número de parte
  // Para Writing usa "task1", para otros usa "part1"
  const partName = sectionName === 'writing' ? `task${partNum}` : `part${partNum}`;

  // Si hay grupos, añade el rango de preguntas (ej: q01-03)
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

// Crea el texto de la URL para Writing (task1 o task2)
function formatWritingHash(taskPart, qNum) {
  return `#/writing-${taskPart}/q${qNum.toString().padStart(2, '0')}`;
}

// Actualiza la URL con el hash de la parte actual
function updateHash(partKey, groupIndex) {
  window.location.hash = formatHash(partKey, groupIndex);
}

// Actualiza la URL para Writing
function updateWritingHash(taskPart, qNum) {
  window.location.hash = formatWritingHash(taskPart, qNum);
}

// Lee la URL (hash) y extrae la información de la sección actual
function parseHash() {
  const hash = window.location.hash.slice(1); // Quita el # inicial
  if (!hash || hash === '/') return null; // URL vacía

  const parts = hash.split('/').filter(p => p); // Divide por barras
  if (parts.length < 2) return null; // URL muy corta

  const rawKey = parts[0]; // Primera parte (ej: "writing-task1")
  const sectionKey = getPartKeyFromHashName(rawKey); // Convierte a clave interna

  // Si es vista previa
  if (parts[1] === 'preview') {
    const parentSection = getSectionKey(sectionKey);
    return { section: sectionKey, parentSection, taskPart: 'preview', qStart: null, qEnd: null, groupIndex: null, hash };
  }

  // Si es vista de resultados
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

// Crea una clave única para guardar cada respuesta
function getProgressKey(partKey, qNum) {
  const config = SECTION_CONFIG[partKey];
  if (config) {
    return `${config.name}_q${qNum.toString().padStart(2, '0')}`;
  }
  return `${partKey.toLowerCase()}_q${qNum}`;
}

// Guarda la respuesta en el navegador
function saveAnswerToHash(answer, qGlobalNum) {
  const key = getProgressKey(currentPartKey, qGlobalNum);
  const saved = JSON.parse(localStorage.getItem('metQuizProgress') || '{}');
  saved.answers = saved.answers || {};
  saved.answers[key] = answer;

  // Update answersByPart for progress tracking
  if (currentPartKey) {
    saved.answersByPart = saved.answersByPart || {};
    if (!saved.answersByPart[currentPartKey]) {
      saved.answersByPart[currentPartKey] = [];
    }
    if (!saved.answersByPart[currentPartKey].includes(key)) {
      saved.answersByPart[currentPartKey].push(key);
    }
  }

  saved.currentHash = window.location.hash;
  saved.currentSection = currentSection;
  saved.currentPartKey = currentPartKey;
  saved.currentGroupIndex = currentGroupIndex;
  saved.score = score;
  saved.answeredQuestions = Array.from(answeredQuestions);
  saved.answersByPart = saved.answersByPart || answersByPart;
  saved.timerRemaining = timerRemaining;
  localStorage.setItem('metQuizProgress', JSON.stringify(saved));
}

// Busca una respuesta guardada en el navegador
function getAnswerFromHash(partKey, qNum) {
  const key = getProgressKey(partKey, qNum); // Clave única
  const saved = JSON.parse(localStorage.getItem('metQuizProgress') || '{}');
  return saved.answers ? saved.answers[key] : null; // Devuelve la respuesta o nada
}

let hashNavigationLocked = false;

// Carga la sección basándose en la URL. El símbolo "===" significa que se está cargando una sección específica.
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
      if (taskPart === 'task2') {
        if (currentWritingStep !== WRITING_STEPS.TASK2) {
          saveCurrentWritingResponse();
          currentWritingStep = WRITING_STEPS.TASK2;
          renderWritingStep();
        }
      } else {
        const step = qStart - 1;
        if (step >= WRITING_STEPS.TASK1_Q1 && step <= WRITING_STEPS.TASK1_Q3) {
          if (currentWritingStep !== step) {
            saveCurrentWritingResponse();
            currentWritingStep = step;
            renderWritingStep();
          }
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

// Convierte segundos a formato de tiempo (MM:SS)
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Actualiza el reloj en pantalla
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

// Inicia el cronómetro de la sección
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

// Pausa el cronómetro
function pauseTimer() {
  timerRunning = false;
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  saveTimerProgress();
}

// Detiene el cronómetro completamente
function stopTimer() {
  pauseTimer();
  timerRemaining = 0;
  updateTimerDisplay();
}

// Reanuda el cronómetro si estaba pausado
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

// Guarda el tiempo restante en el navegador
function saveTimerProgress() {
  if (currentSection && timerRemaining > 0) {
    const saved = loadProgress() || {};
    saved.timerEnd = Date.now() + (timerRemaining * 1000);
    saved.section = currentSection;
    saved.currentSection = currentSection;
    localStorage.setItem('metQuizProgress', JSON.stringify(saved));
  }
}

// Muestra el mensaje de tiempo agotado
function showTimeModal() {
  getElement('time-modal').classList.remove('hidden');
  getElement('timer-display').textContent = '00:00';
}

// Oculta el mensaje de tiempo agotado
function hideTimeModal() {
  getElement('time-modal').classList.add('hidden');
}

// Variables que guardan el estado actual del quiz
let questions = [];
// Índice de la pregunta actual
let currentQuestionIndex = 0;
// Opción seleccionada
let selectedOptionIndex = null;
// Puntuación por sección
let score = { WRITING: 0, LISTENING: 0, READING_AND_GRAMMAR: 0, SPEAKING: 0 };
// Preguntas ya respondidas
let answeredQuestions = new Set();
// Preguntas en orden mezclado
let shuffledQuestions = [];
// Grupos de preguntas
let questionGroups = [];
// Índice del grupo actual
let currentGroupIndex = 0;
// Sección actual
let currentSection = null;
// Parte actual
let currentPartKey = null;
// Índice de pregunta en la parte
let currentPartQuestionIndex = 0;
// Respuestas por parte
let answersByPart = {};
// Intervalo del cronómetro
let timerInterval = null;
// Tiempo restante
let timerRemaining = 0;
// Si el cronómetro está corriendo
let timerRunning = false;
// Índice del ejercicio actual
let currentExerciseIndex = 0;
// Fuente del audio actual
let currentAudioSrc = null;
// Elemento de audio
let currentAudioElement = null;
// Si estamos en modo vista previa
let sectionPreviewMode = false;

// Usuario actual
let currentUser = null;
// Sección pendiente por cargar
let pendingSection = null;

// Grupo actual
let currentGroup = null;
// Respuestas de la sección
let sectionResponses = [];
// Respuestas seleccionadas en el grupo
let groupSelectedAnswers = {};
// Si el grupo ya fue revisado
let groupChecked = false;
// Paso actual de Writing
let currentWritingStep = 0;
// Índice de vista previa
let currentPreviewIndex = 0;

// Letras para las opciones
const letters = ['A', 'B', 'C', 'D'];

// URL para enviar datos a Google Sheets (En caso de actualizar, está en: línea 523, 709 y 740 y en SETUP.md)
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzo0UvJWgK-hGMpLPAyAzuz7D6InaGY1GGZMGfrYycEwmMBJNh1aSQ2UIA44DgX9Blp/exec';

// Límite de caracteres para Task 1
const TASK1_CHAR_LIMIT = 750;
// Límite de caracteres para Task 2
const TASK2_CHAR_LIMIT = 3500;

// Pasos del Writing (qué parte se está haciendo)
const WRITING_STEPS = {
  TASK1_Q1: 0,
  TASK1_Q2: 1,
  TASK1_Q3: 2,
  TASK2: 3,
  PREVIEW: 4
};

// Mezcla aleatoriamente los elementos de un arreglo
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Mezcla las opciones de una pregunta
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

// Guarda el progreso del quiz en el navegador
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

// Carga el progreso guardado del navegador
function loadProgress() {
  const saved = localStorage.getItem('metQuizProgress');
  return saved ? JSON.parse(saved) : null;
}

// Borra todo el progreso guardado
function clearProgress() {
  localStorage.removeItem('metQuizProgress');
}

// Reinicia todo el progreso del quiz
function resetAllProgress() {
  const modal = getElement('confirm-modal');
  const modalText = getElement('confirm-text');
  const modalOk = getElement('confirm-ok');
  const modalCancel = getElement('confirm-cancel');

  modalText.textContent = 'Are you sure you want to reset all progress? This cannot be undone.';

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

// Reinicia solo la sección actual
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

// Busca un elemento del HTML por su ID (atajo)
function getElement(id) {
  return document.getElementById(id);
}

// Guarda los datos del usuario en el navegador
function saveUser(user) {
  localStorage.setItem('metQuizUser', JSON.stringify(user));
  localStorage.setItem('metQuizTheme', document.documentElement.getAttribute('data-theme') || 'light');
  currentUser = user;
  updateUserDisplay();
}

// Carga los datos del usuario guardados
function loadUser() {
  const saved = localStorage.getItem('metQuizUser');
  if (saved) {
    currentUser = JSON.parse(saved);
    return currentUser;
  }
  return null;
}

// Verifica que el nombre sea válido
function isValidName(name) {
  if (!name || name.length < 2) return false;
  const cleanName = name.trim();
  if (/^\d+$/.test(cleanName)) return false;
  if (/^(.)\1+$/i.test(cleanName)) return false;
  return true;
}

// Actualiza cómo se muestra el nombre del usuario
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
    if (APPS_SCRIPT_URL && APPS_SCRIPT_URL !== 'https://script.google.com/macros/s/AKfycbzo0UvJWgK-hGMpLPAyAzuz7D6InaGY1GGZMGfrYycEwmMBJNh1aSQ2UIA44DgX9Blp/exec') {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    }
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
    if (APPS_SCRIPT_URL && APPS_SCRIPT_URL !== 'https://script.google.com/macros/s/AKfycbzo0UvJWgK-hGMpLPAyAzuz7D6InaGY1GGZMGfrYycEwmMBJNh1aSQ2UIA44DgX9Blp/exec') {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    }
  } catch (error) {
    console.log('Writing response logged locally:', data);
  }
}

// Muestra la ventana para registrar usuario
function showRegistrationModal() {
  const modal = getElement('registration-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  const nameInput = getElement('reg-name');
  const emailInput = getElement('reg-email');
  if (nameInput) {
    nameInput.value = '';
    nameInput.focus();
  }
  if (emailInput) emailInput.value = '';
}

// Oculta la ventana de registro
function hideRegistrationModal() {
  getElement('registration-modal').classList.add('hidden');
}

// Muestra la ventana de ayuda
function showHelpModal() {
  getElement('help-modal').classList.remove('hidden');
  getElement('help-text').value = '';
  getElement('help-text').focus();
}

// Oculta la ventana de ayuda
function hideHelpModal() {
  getElement('help-modal').classList.add('hidden');
}

// Muestra la ventana para cambiar usuario
function showChangeUserModal() {
  getElement('change-user-modal').classList.remove('hidden');
  getElement('change-name').value = currentUser?.name || '';
  getElement('change-email').value = currentUser?.email || '';
  getElement('change-name').focus();
}

// Oculta la ventana de cambiar usuario
function hideChangeUserModal() {
  getElement('change-user-modal').classList.add('hidden');
}

// Actualiza la barra de progreso de la sección.
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
      [WRITING_STEPS.TASK1_Q2]: 25,
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

// Aplana las preguntas de los ejercicios en una sola lista
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

// Muestra la pantalla de inicio con las categorías
function renderCategorySelect() {
  getElement('quiz-view').classList.add('hidden');
  getElement('results-container').classList.add('hidden');
  getElement('category-select').classList.remove('hidden');

  const container = getElement('category-buttons');
  container.innerHTML = '';

  const sections = [
    { key: 'WRITING', name: 'Writing', description: 'Task 1 (3 questions) and Task 2 (essay of 250 words)', parts: SECTION_PARTS.WRITING },
    { key: 'LISTENING', name: 'Listening', description: 'Parts 1-3, 50 questions total.', parts: SECTION_PARTS.LISTENING },
    { key: 'READING_AND_GRAMMAR', name: 'Reading & Grammar', description: 'Parts 1-3, 51 questions total.', parts: SECTION_PARTS.READING_AND_GRAMMAR },
    { key: 'SPEAKING', name: 'Speaking', description: 'Respond to prompts with recorded audio. Parts 1-2, 5 tasks total.', parts: SECTION_PARTS.SPEAKING }
  ];

  sections.forEach(sec => {
    const card = document.createElement('div');
    card.className = 'home-card';

    const titleEl = document.createElement('div');
    titleEl.className = 'home-card-title';
    titleEl.textContent = sec.name;
    card.appendChild(titleEl);

    const descEl = document.createElement('div');
    descEl.className = 'home-card-subtitle';
    descEl.textContent = sec.description;
    card.appendChild(descEl);

    const partsContainer = document.createElement('div');
    partsContainer.className = 'home-card-parts';

    sec.parts.forEach(part => {
      const config = SECTION_CONFIG[part.key];
      const hasContent = hasSectionContent(part.key);
      const saved = loadProgress();
      const partProgress = getPartProgress(part.key, saved);
      const percent = partProgress.percent;
      const label = percent > 0 ? `${percent}%` : '';

      const partBtn = document.createElement('div');
      partBtn.className = 'home-card-part' + (!hasContent ? ' disabled' : '');

      const partTitle = document.createElement('div');
      partTitle.className = 'home-card-part-title';
      partTitle.textContent = part.name;
      partBtn.appendChild(partTitle);

      if (!hasContent) {
        partBtn.classList.add('coming-soon');
      } else {
        const progressEl = document.createElement('div');
        progressEl.className = 'home-card-part-progress';
        progressEl.textContent = label;
        partBtn.appendChild(progressEl);

        partBtn.addEventListener('click', () => startFromSection(part.key));
      }

      partsContainer.appendChild(partBtn);
    });

    card.appendChild(partsContainer);
    container.appendChild(card);
  });
}

// Revisa si una sección ya tiene contenido disponible
function hasSectionContent(partKey) {
  const section = getSectionKey(partKey);
  if (section === 'WRITING') return quizData.WRITING && quizData.WRITING.groups && quizData.WRITING.groups.length > 0;
  if (section === 'LISTENING') return quizData.LISTENING && quizData.LISTENING.parts && quizData.LISTENING.parts.length > 0;
  if (section === 'READING_AND_GRAMMAR') return quizData.READING_AND_GRAMMAR && quizData.READING_AND_GRAMMAR.parts && quizData.READING_AND_GRAMMAR.parts.length > 0;
  if (section === 'SPEAKING') return quizData.SPEAKING && quizData.SPEAKING.parts && quizData.SPEAKING.parts.length > 0;
  return false;
}

// Obtiene el progreso de una parte específica
function getPartProgress(partKey, saved) {
  if (!saved) return { answered: 0, total: 0, percent: 0 };

  const section = getSectionKey(partKey);
  const config = SECTION_CONFIG[partKey];

  // MC sections (LISTENING, READING_AND_GRAMMAR)
  if (section === 'LISTENING' || section === 'READING_AND_GRAMMAR') {
    const total = config ? config.items : 0;
    if (!saved.answersByPart || !saved.answersByPart[partKey]) {
      return { answered: 0, total, percent: 0 };
    }
    const answered = saved.answersByPart[partKey].length;
    const percent = answered > 0 && total > 0 ? Math.round((answered / total) * 100) : 0;
    return { answered, total, percent };
  }

  // WRITING section
  if (section === 'WRITING') {
    const total = 4; // 3 Task 1 questions + 1 Task 2
    const writingResponses = saved.writingResponses || [];
    const answered = writingResponses.filter(r => r && r.length > 0).length;
    const percent = total > 0 ? Math.round((answered / total) * 100) : 0;
    return { answered, total, percent };
  }

  // SPEAKING section
  if (section === 'SPEAKING') {
    const total = config ? config.items : 5; // Default to 5 tasks
    const speakingResponses = saved.speakingResponses || [];
    const answered = speakingResponses.filter(r => r !== null && r !== undefined).length;
    const percent = total > 0 ? Math.round((answered / total) * 100) : 0;
    return { answered, total, percent };
  }

  return { answered: 0, total: 0, percent: 0 };
}

// Inicia el quiz desde una sección específica
function startFromSection(section) {
  pendingSection = section;

  if (!currentUser) {
    showRegistrationModal();
    return;
  }

  beginQuiz(section);
}

// Comienza el quiz para una sección
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

  if (section.startsWith('WRITING') || section === 'WRITING') {
    const parts = SECTION_PARTS.WRITING;
    const partKey = section.startsWith('WRITING_T') ? section : (parts && parts[0] ? parts[0].key : 'WRITING_TASK1');
    beginWriting(partKey, saved, SECTION_CONFIG.WRITING);
    return;
  }

  if (section.startsWith('LISTENING') || section === 'LISTENING') {
    const parts = SECTION_PARTS.LISTENING;
    const partKey = section.startsWith('LISTENING_P') ? section : (parts && parts[0] ? parts[0].key : 'LISTENING_P1');
    beginMcPart(partKey, saved);
    return;
  }

  if (section.startsWith('READING') || section === 'READING_AND_GRAMMAR') {
    const parts = SECTION_PARTS.READING_AND_GRAMMAR;
    const partKey = section.startsWith('READING_P') ? section : (parts && parts[0] ? parts[0].key : 'READING_P1');
    beginMcPart(partKey, saved);
    return;
  }

  if (section.startsWith('SPEAKING') || section === 'SPEAKING') {
    const parts = SECTION_PARTS.SPEAKING;
    const partKey = section.startsWith('SPEAKING_P') ? section : (parts && parts[0] ? parts[0].key : 'SPEAKING_P1');
    beginSpeaking(partKey, saved);
    return;
  }

  alert('Esta sección aún no tiene contenido.');
}

// Inicia la sección de Writing
function beginWriting(partKey, saved, config) {
  if (!quizData.WRITING || !quizData.WRITING.groups || quizData.WRITING.groups.length === 0) {
    alert('La sección de Writing aún no tiene contenido.');
    return;
  }

  currentPartKey = partKey;
  const isTask2 = partKey.endsWith('TASK2');
  const hasSavedProgress = saved && saved.currentPartKey === partKey;

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

// Inicia una parte de preguntas de opción múltiple (Listening o Reading)
function beginMcPart(partKey, saved = null) {
  const config = SECTION_CONFIG[partKey];
  if (!config || !config.partId) return false;

  const section = getSectionKey(partKey);
  let partData = null;

  if (section === 'LISTENING') {
    partData = quizData.LISTENING?.parts?.find(p => p.id === config.partId);
  } else if (section === 'READING_AND_GRAMMAR') {
    const parts = quizData.READING_AND_GRAMMAR?.parts || [];
    partData = parts[config.partId - 1] || null;
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

// Procesa una pregunta individual para el quiz
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

// Crea los grupos de preguntas para una parte
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

// Configura el panel de instrucciones
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

// Obtiene la ruta correcta del archivo de audio
function getAudioPath(audioSrc) {
  if (!audioSrc) return '';
  if (audioSrc.startsWith('data/') || audioSrc.startsWith('http')) return audioSrc;
  if (currentPartKey && currentPartKey.startsWith('LISTENING_P')) {
    const partNum = currentPartKey.replace('LISTENING_P', '');
    return `data/audios/listening-p${partNum}/${audioSrc}`;
  }
  return `data/audios/${audioSrc}`;
}

// Carga un grupo de preguntas en pantalla
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

// Dibuja las preguntas del grupo en pantalla
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

// Dibuja un artículo de revista en pantalla
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

// Selecciona una opción en el grupo de preguntas
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

  updatePrevButtonVisibility();
}

// Revisa una pregunta individual
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

// Revisa todo el grupo de preguntas
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

  updatePrevButtonVisibility();
}

// Avanza al siguiente grupo de preguntas
function navigateToNextGroup() {
  if (currentGroupIndex < questionGroups.length - 1) {
    currentGroupIndex++;
    loadGroup();
    saveProgress();
  } else {
    navigateToNextPart();
  }
}

// Regresa al grupo anterior de preguntas
function navigateToPrevGroup() {
  if (currentGroupIndex > 0) {
    currentGroupIndex--;
    loadGroup();
    return;
  }

  const prevPart = getPrevPartKey();
  if (!prevPart) return;

  pauseTimer();
  saveProgress();

  if (currentSection === 'SPEAKING') {
    beginSpeaking(prevPart.key);
    startTimer(currentSection);
  } else {
    beginMcPart(prevPart.key);
    startTimer(currentSection);
  }
}

// Navega a la parte anterior de la sección
function navigateToPrevPart() {
  pauseTimer();
  const prevPart = getPrevPartKey();

  if (!prevPart) {
    return;
  }

  saveProgress();

  if (currentSection === 'SPEAKING') {
    beginSpeaking(prevPart.key);
    startTimer(currentSection);
  } else {
    beginMcPart(prevPart.key);
    startTimer(currentSection);
  }
}

// Dibuja el paso actual de Writing
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
    case WRITING_STEPS.PREVIEW: html = ''; break;
  }

  getElement('question-text').innerHTML = '';
  getElement('options-container').innerHTML = html;
  updatePrevButtonVisibility();

  if (currentWritingStep === WRITING_STEPS.PREVIEW) {
    getElement('controls').classList.add('hidden');
  } else {
    getElement('controls').classList.remove('hidden');
    setupWritingTextareaEvents();
  }

  updatePrevButtonVisibility();
}

// Configura los eventos del área de texto de Writing
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

// Dibuja una pregunta de Task 1 de Writing
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

// Dibuja la Task 2 de Writing (el essay)
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

// Preview now handled by renderUnifiedPreview()

// Obtiene la siguiente parte de la sección
function getNextPartKey() {
  const parts = SECTION_PARTS[currentSection];
  if (!parts) return null;
  const currentIndex = parts.findIndex(p => p.key === currentPartKey);
  if (currentIndex < 0 || currentIndex >= parts.length - 1) return null;
  return parts[currentIndex + 1];
}

// Obtiene la parte anterior de la sección
function getPrevPartKey() {
  const parts = SECTION_PARTS[currentSection];
  if (!parts) return null;
  const currentIndex = parts.findIndex(p => p.key === currentPartKey);
  if (currentIndex <= 0) return null;
  return parts[currentIndex - 1];
}

// Revisa si es la primera parte de la sección
function isFirstPartOfSection() {
  if (currentSection === 'WRITING') {
    return currentWritingStep <= WRITING_STEPS.TASK1_Q3;
  }
  return getPrevPartKey() === null;
}

// Revisa si es la última parte de la sección
function isLastPartOfSection() {
  if (currentSection === 'WRITING') {
    return currentWritingStep >= WRITING_STEPS.TASK2;
  }
  return getNextPartKey() === null;
}

// Revisa si es la última pregunta de la sección
function isLastQuestionOfSection() {
  if (currentSection === 'WRITING') {
    return currentWritingStep === WRITING_STEPS.TASK2;
  }
  if (currentSection === 'SPEAKING') {
    return isLastPartOfSection() && speakingTaskIndex >= speakingPart.tasks.length - 1;
  }
  if (currentSection) {
    return isLastPartOfSection() && currentGroupIndex >= questionGroups.length - 1;
  }
  return false;
}

// Revisa si es la primera pregunta de la sección
function isFirstQuestionOfSection() {
  if (currentSection === 'WRITING') {
    return currentWritingStep === WRITING_STEPS.TASK1_Q1;
  }
  if (currentSection === 'SPEAKING') {
    return isFirstPartOfSection() && speakingTaskIndex === 0;
  }
  if (currentSection) {
    return isFirstPartOfSection() && currentGroupIndex === 0;
  }
  return false;
}

// Obtiene el nombre de la siguiente parte de Writing
function getWritingNextPartName() {
  if (currentWritingStep >= WRITING_STEPS.TASK1_Q1 && currentWritingStep <= WRITING_STEPS.TASK1_Q3) {
    const writingParts = SECTION_PARTS.WRITING;
    if (!writingParts) return 'Task 2';
    const task2Part = writingParts.find(p => p.key.endsWith('TASK2'));
    return task2Part ? task2Part.name : 'Task 2';
  }
  return null;
}

// Actualiza qué botones se ven (Anterior, Siguiente, etc.)
function updatePrevButtonVisibility() {
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const submitBtn = document.getElementById('submit-section-btn');
  const skipBtn = document.getElementById('skip-btn');
  const checkBtn = document.getElementById('check-btn');
  const controlsSecondary = document.getElementById('controls-secondary');

  // Reset all buttons
  if (prevBtn) prevBtn.classList.remove('hidden');
  if (nextBtn) {
    nextBtn.classList.remove('hidden');
    nextBtn.textContent = 'Siguiente';
    nextBtn.classList.remove('btn-primary');
    nextBtn.classList.add('btn-secondary');
  }
  if (submitBtn) submitBtn.classList.add('hidden');
  if (skipBtn) skipBtn.classList.add('hidden');
  if (checkBtn) checkBtn.classList.add('hidden');
  if (controlsSecondary) controlsSecondary.classList.add('hidden');

  if (!currentSection) return;

  // PREVIEW MODE - only Confirm button
  if (sectionPreviewMode) {
    if (prevBtn) prevBtn.classList.add('hidden');
    if (nextBtn) nextBtn.classList.add('hidden');
    if (submitBtn) {
      submitBtn.classList.remove('hidden');
      submitBtn.textContent = 'Confirmar';
    }
    return;
  }

  // Check if this is the first question/step
  const isFirst = isFirstQuestionOfSection();
  const isLastQ = isLastQuestionOfSection();
  const isLastPart = isLastPartOfSection();
  const nextPart = getNextPartKey();

  // PREVIOUS: always show unless first question of section
  if (prevBtn) {
    prevBtn.classList.toggle('hidden', isFirst);
  }

  if (currentSection === 'WRITING') {
    const isPreview = currentWritingStep === WRITING_STEPS.PREVIEW;

    if (isPreview) {
      // Handled above in sectionPreviewMode check
      return;
    }

    // NEXT/FINISH button
    if (nextBtn) {
      if (isLastQ) {
        nextBtn.textContent = 'Finalizar sección';
        nextBtn.classList.remove('btn-secondary');
        nextBtn.classList.add('btn-primary');
      } else {
        nextBtn.textContent = 'Siguiente';
        nextBtn.classList.remove('btn-primary');
        nextBtn.classList.add('btn-secondary');
      }
    }

    // SKIP TO button
    if (skipBtn) {
      skipBtn.classList.remove('hidden');
      const targetName = getWritingNextPartName();
      skipBtn.textContent = targetName ? `Skip to ${targetName}` : 'Skip to Preview';
      skipBtn.classList.remove('btn-primary');
      skipBtn.classList.add('btn-secondary');
    }

  } else if (currentSection === 'SPEAKING') {
    const pastTasks = speakingTaskIndex >= speakingPart.tasks.length;

    if (pastTasks) {
      // Should be in preview mode
      return;
    }

    // NEXT/FINISH button
    if (nextBtn) {
      if (isLastQ) {
        nextBtn.textContent = 'Finalizar sección';
        nextBtn.classList.remove('btn-secondary');
        nextBtn.classList.add('btn-primary');
      } else {
        nextBtn.textContent = 'Siguiente';
        nextBtn.classList.remove('btn-primary');
        nextBtn.classList.add('btn-secondary');
      }
    }

    // SKIP TO button
    if (skipBtn && !isLastQ) {
      skipBtn.classList.remove('hidden');
      const targetName = nextPart ? `Skip to ${nextPart.name}` : 'Skip to Preview';
      skipBtn.textContent = targetName;
      if (isLastPart) {
        skipBtn.classList.remove('btn-secondary');
        skipBtn.classList.add('btn-primary');
      } else {
        skipBtn.classList.remove('btn-primary');
        skipBtn.classList.add('btn-secondary');
      }
    }

  } else {
    // MC sections (LISTENING, READING_AND_GRAMMAR)
    const grp = questionGroups[currentGroupIndex];
    const allChecked = grp && grp.questions.every(q => {
      const qi = shuffledQuestions.findIndex(sq => sq.globalNumber === q.globalNumber);
      return answeredQuestions.has(qi);
    });

    // NEXT/FINISH button - only show when group is checked
    if (nextBtn) {
      if (allChecked) {
        nextBtn.classList.remove('hidden');
        if (isLastQ) {
          nextBtn.textContent = 'Finalizar sección';
          nextBtn.classList.remove('btn-secondary');
          nextBtn.classList.add('btn-primary');
        } else {
          nextBtn.textContent = 'Siguiente';
          nextBtn.classList.remove('btn-primary');
          nextBtn.classList.add('btn-secondary');
        }
      } else {
        nextBtn.classList.add('hidden');
      }
    }

    // CHECK button - show when at least one option selected but not all answered
    if (checkBtn && grp) {
      const anySelected = grp.questions.some(q => groupSelectedAnswers[q.globalNumber] !== undefined);
      if (anySelected && !allChecked) {
        checkBtn.classList.remove('hidden');
      } else {
        checkBtn.classList.add('hidden');
      }
    }

    // SKIP TO button
    if (skipBtn && !isLastQ) {
      skipBtn.classList.remove('hidden');
      const targetName = nextPart ? `Skip to ${nextPart.name}` : 'Skip to Preview';
      skipBtn.textContent = targetName;
      if (isLastPart) {
        skipBtn.classList.remove('btn-secondary');
        skipBtn.classList.add('btn-primary');
      } else {
        skipBtn.classList.remove('btn-primary');
        skipBtn.classList.add('btn-secondary');
      }
    }
  }
}

// Guarda la respuesta actual de Writing
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

// Variables para la sección de Speaking
let speakingPart = null;
// Índice de la tarea actual
let speakingTaskIndex = 0;
// Respuestas de audio
let speakingResponses = [];
// Tiempo restante de Speaking
let speakingTimerRemaining = 0;
// Intervalo del cronómetro
let speakingTimerInterval = null;
// Grabadora de audio
let speakingMediaRecorder = null;
// Fragmentos de audio grabado
let speakingAudioChunks = [];
// Flujo del micrófono
let speakingStream = null;
// Contexto de audio
let speakingAudioContext = null;
// Analizador de audio
let speakingAnalyser = null;
// ID de animación
let speakingAnimationId = null;

// Configuración de la base de datos para Speaking
const SPEAKING_DB_NAME = 'SpeakingAudioDB';
const SPEAKING_DB_VERSION = 1;
const SPEAKING_STORE_NAME = 'audioResponses';

// Conexión a la base de datos
let speakingDB = null;

// Abre la base de datos para guardar audios de Speaking
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

// Guarda un audio de Speaking en la base de datos
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

// Obtiene un audio guardado de Speaking
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

// Obtiene todos los audios de Speaking guardados
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

// Borra todos los audios de Speaking
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

// Pasos del Speaking (qué tarea se está haciendo)
const SPEAKING_STEPS = {
  TASK_1: 0,
  TASK_2: 1,
  TASK_3: 2,
  TASK_4: 3,
  TASK_5: 4,
  PREVIEW: 5
};

// Inicia la sección de Speaking
function beginSpeaking(partKey, saved = null) {
  stopSpeakingMic();

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

// Dibuja la tarea actual de Speaking
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

// Empieza a grabar la respuesta de Speaking
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

// Configura la visualización de ondas de audio
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

// Detiene la visualización de ondas de audio
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

// Detiene el micrófono de Speaking
function stopSpeakingMic() {
  if (speakingMediaRecorder && speakingMediaRecorder.state !== 'inactive') {
    speakingMediaRecorder.stop();
  }
  if (speakingStream) {
    speakingStream.getTracks().forEach(track => track.stop());
    speakingStream = null;
  }
  if (speakingTimerInterval) {
    clearInterval(speakingTimerInterval);
    speakingTimerInterval = null;
  }
  stopAudioVisualization();
}

// Reproduce una grabación de Speaking
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

// Actualiza la barra de progreso de Speaking
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

// Avanza al siguiente paso de Writing
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

// Muestra los resultados de Writing
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
      <span class="result-category-score">${part1Answered}/${part1Count} completed • ${part2Answered}/${part2Count} completed</span>
    </div>
  `;

  getElement('email-btn').classList.remove('hidden');
}

// Navega a la siguiente parte de la sección
function navigateToNextPart() {
  pauseTimer();
  const nextPart = getNextPartKey();

  if (!nextPart) {
    goToPreview();
    return;
  }

  saveProgress();

  // Stop mic if leaving Speaking
  if (currentSection === 'SPEAKING') {
    stopSpeakingMic();
  }

  if (currentSection === 'SPEAKING') {
    beginSpeaking(nextPart.key);
    startTimer(currentSection);
  } else {
    beginMcPart(nextPart.key);
    startTimer(currentSection);
  }
}

// Navega a una parte específica de la sección
function navigateToPart(partKey) {
  if (!currentSection) return;

  const targetSection = getSectionKey(partKey);
  if (targetSection !== currentSection) return;
  if (partKey === currentPartKey) return;

  pauseTimer();
  saveProgress();

  if (targetSection === 'WRITING') {
    beginQuiz(partKey);
    startTimer(targetSection);
  } else if (targetSection === 'SPEAKING') {
    stopSpeakingMic();
    beginSpeaking(partKey);
    startTimer(targetSection);
  } else {
    beginMcPart(partKey);
    startTimer(targetSection);
  }
}

// Regresa a la pregunta anterior
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
      saveProgress();
    }
    return;
  }

  if (currentSection === 'SPEAKING') {
    previousSpeakingTask();
    return;
  }

  navigateToPrevGroup();
  saveProgress();
}

// Avanza a la siguiente pregunta
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

// Va a la vista previa de la sección
function goToPreview() {
  pauseTimer();
  if (!currentSection) return;

  if (currentSection === 'WRITING') {
    saveCurrentWritingResponse();
  }
  if (currentSection === 'SPEAKING') {
    stopSpeakingMic();
  }
  saveProgress();

  hashNavigationLocked = true;
  const sectionHash = currentSection.toLowerCase().replace(/_/g, '-');
  window.location.hash = `#/${sectionHash}/preview`;
  hashNavigationLocked = false;

  renderUnifiedPreview();
}

// Avanza a la siguiente tarea de Speaking
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

// Regresa a la tarea anterior de Speaking
function previousSpeakingTask() {
  if (currentSection !== 'SPEAKING') return;

  if (speakingTaskIndex > 0) {
    speakingTaskIndex--;
    renderSpeakingTask();
    saveProgress();
  }
}

// Crea todos los grupos de preguntas de una sección
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

// Dibuja la vista previa unificada
function renderUnifiedPreview() {
  sectionPreviewMode = true;

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

  getElement('category-badge').textContent = getSectionBadge(currentPartKey);
  getElement('progress-text').textContent = 'Preview';
  getElement('progress-bar').style.width = '100%';

  getElement('audio-container').classList.add('hidden');
  getElement('transcription-toggle').classList.add('hidden');
  getElement('transcription-text').classList.add('hidden');
  getElement('reading-text').classList.add('hidden');

  let html = '<div class="preview-section"><h3>Revisa tus respuestas</h3>';
  html += '<div class="preview-scroll-container">';

  if (currentSection === 'WRITING') {
    html += renderWritingPreviewItems();
  } else if (currentSection === 'SPEAKING') {
    html += renderSpeakingPreviewItems();
  } else {
    html += renderMCPreviewItems();
  }

  html += '</div>';
  html += `<div class="preview-summary">${getPreviewSummary()}</div>`;
  html += `<div class="preview-submit-container"><button class="btn-submit-preview" onclick="submitFromPreview()">ENVIAR</button></div>`;
  html += '</div>';

  getElement('question-text').classList.add('hidden');
  getElement('options-container').innerHTML = html;
  getElement('controls').classList.add('hidden');

  // Attach event listeners
  attachPreviewItemListeners();
}

// Dibuja los elementos de vista previa para Writing
function renderWritingPreviewItems() {
  if (!currentGroup) return '';
  const task1 = currentGroup.task1 || [];
  const task2 = currentGroup.task2;
  let html = '';

  // Task 1 Questions
  task1.forEach((q, i) => {
    const response = sectionResponses[i] || '';
    const hasResponse = response.length > 0;
    const statusClass = hasResponse ? 'answered' : 'unanswered';
    const statusText = hasResponse ? `Answered (${response.length} chars)` : 'Sin respuesta';
    const canEdit = timerRemaining > 0;

    html += `<div class="preview-slide" data-writing-step="${WRITING_STEPS.TASK1_Q1 + i}">`;
    html += `<div class="preview-slide-header">Task 1 — Question ${i + 1} of 3</div>`;
    html += `<div class="preview-question">`;
    html += `<div class="preview-q-text"><span class="preview-q-num">Q${i + 1}.</span> ${q.text}</div>`;
    html += `<div class="preview-q-answer ${statusClass}">${statusText}`;
    if (canEdit) {
      html += ` <button class="btn-preview-edit" data-writing-step="${WRITING_STEPS.TASK1_Q1 + i}" style="margin-left:8px;">✏️ Edit</button>`;
    }
    html += `</div></div></div>`;
  });

  // Task 2
  if (task2) {
    const response = sectionResponses[3] || '';
    const hasResponse = response.length > 0;
    const statusClass = hasResponse ? 'answered' : 'unanswered';
    const statusText = hasResponse ? `Answered (${response.length} chars)` : 'Sin respuesta';
    const canEdit = timerRemaining > 0;

    html += `<div class="preview-slide" data-writing-step="${WRITING_STEPS.TASK2}">`;
    html += `<div class="preview-slide-header">Task 2 — Essay</div>`;
    html += `<div class="preview-question">`;
    html += `<div class="preview-q-text"><span class="preview-q-num">Essay:</span> ${task2.topic}</div>`;
    html += `<div class="preview-q-answer ${statusClass}">${statusText}`;
    if (canEdit) {
      html += ` <button class="btn-preview-edit" data-writing-step="${WRITING_STEPS.TASK2}" style="margin-left:8px;">✏️ Edit</button>`;
    }
    html += `</div></div></div>`;
  }

  return html;
}

// Dibuja los elementos de vista previa para Speaking
function renderSpeakingPreviewItems() {
  if (!speakingPart) return '';
  const tasks = speakingPart.tasks || [];
  let html = '';

  tasks.forEach((task, i) => {
    const hasRecording = speakingResponses[i] !== null && speakingResponses[i] !== undefined;
    const duration = hasRecording ? speakingResponses[i].duration : null;
    const statusClass = hasRecording ? 'correct' : 'unanswered';
    const statusText = hasRecording ? `✓ Response recorded (${duration}s)` : 'Sin respuesta';
    const canEdit = timerRemaining > 0;

    html += `<div class="preview-slide" data-speaking-task="${i}">`;
    html += `<div class="preview-slide-header">Task ${task.number} — ${task.timeLimit}s limit</div>`;
    html += `<div class="preview-question">`;
    html += `<div class="preview-q-text"><span class="preview-q-num">Prompt:</span> ${task.prompt}</div>`;
    html += `<div class="preview-q-answer ${statusClass}">${statusText}`;
    if (hasRecording) {
      html += ` <button class="btn-preview-playback" data-task-idx="${i}" style="margin-left:8px;">▶ Play</button>`;
      html += `<audio class="hidden" id="preview-audio-${i}"></audio>`;
    }
    if (canEdit) {
      html += ` <button class="btn-preview-edit-speaking" data-task-idx="${i}" style="margin-left:8px;">✏️ Edit</button>`;
    }
    html += `</div></div></div>`;
  });

  return html;
}

// Dibuja los elementos de vista previa para preguntas de opción múltiple
function renderMCPreviewItems() {
  const allGroups = buildAllSectionGroups(currentSection);
  let html = '';
  let answeredCount = 0;
  let totalQ = 0;

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
            ? `✓ Your answer: ${userLetter}. ${userText}`
            : `✗ Your answer: ${userLetter}. ${userText} — Correct: ${correctLetter}. ${correctText}`;
        }
      }

      html += `<div class="preview-question">`;
      html += `<div class="preview-q-text"><span class="preview-q-num">Q${displayNum}.</span> ${q.question}</div>`;
      html += `<div class="preview-q-answer ${statusClass}">`;
      html += answerDetail || 'Sin responder';
      html += `</div></div>`;
    });

    html += '</div>';
  });

  // Store for summary
  renderMCPreviewItems.answeredCount = answeredCount;
  renderMCPreviewItems.totalQ = totalQ;

  return html;
}

// Obtiene el resumen de la vista previa
function getPreviewSummary() {
  if (currentSection === 'WRITING') {
    const total = 4;
    const answered = sectionResponses.filter(r => r && r.length > 0).length;
    return `${answered}/${total} answered`;
  } else if (currentSection === 'SPEAKING') {
    const total = speakingPart ? speakingPart.tasks.length : 0;
    const answered = speakingResponses.filter(r => r !== null && r !== undefined).length;
    return `${answered}/${total} answered`;
  } else {
    const answered = renderMCPreviewItems.answeredCount || 0;
    const total = renderMCPreviewItems.totalQ || 0;
    return `${answered}/${total} answered`;
  }
}

// Agrega los eventos a los elementos de la vista previa
function attachPreviewItemListeners() {
  // MC items are NOT editable — no click handler to navigate back

  // Writing edit buttons
  document.querySelectorAll('.btn-preview-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const step = parseInt(btn.dataset.writingStep);
      editWritingFromPreview(step);
    });
  });

  // Speaking playback buttons
  document.querySelectorAll('.btn-preview-playback').forEach(btn => {
    btn.addEventListener('click', () => {
      const taskIdx = parseInt(btn.dataset.taskIdx);
      playSpeakingPreviewRecording(taskIdx, btn);
    });
  });

  // Speaking edit buttons
  document.querySelectorAll('.btn-preview-edit-speaking').forEach(btn => {
    btn.addEventListener('click', () => {
      const taskIdx = parseInt(btn.dataset.taskIdx);
      editSpeakingTask(taskIdx);
    });
  });
}

// Edita una respuesta de Writing desde la vista previa
function editWritingFromPreview(step) {
  saveCurrentWritingResponse();

  currentWritingStep = step;
  sectionPreviewMode = false;
  renderWritingStep();

  const taskPart = step === WRITING_STEPS.TASK2 ? 'task2' : 'task1';
  const qNum = step === WRITING_STEPS.TASK2 ? 1 : step + 1;
  updateWritingHash(taskPart, qNum);
}

// Reproduce una grabación desde la vista previa
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

// Navega a una pregunta específica
function navigateToQuestion(globalNum) {
  sectionPreviewMode = false;
  const qIndex = shuffledQuestions.findIndex(q => q.globalNumber === globalNum);
  if (qIndex === -1) return;

  const targetGroupIndex = questionGroups.findIndex(g =>
    g.questionRange.start <= globalNum && g.questionRange.end >= globalNum
  );
  if (targetGroupIndex === -1) return;

  currentGroupIndex = targetGroupIndex;
  currentGroup = questionGroups[currentGroupIndex];
  currentQuestionIndex = qIndex;
  groupChecked = false;

  loadQuestion();
  renderQuestion();
  updateNavigationButtons();
  updateTranscriptionVisibility();
  resumeTimer();
}

// Edita una tarea de Speaking
function editSpeakingTask(taskIdx) {
  speakingTaskIndex = taskIdx;
  sectionPreviewMode = false;
  renderSpeakingTask();
  resumeTimer();
}

// Envía desde la vista previa
function submitFromPreview() {
  pauseTimer();
  saveProgress();
  showResults();
}

// Muestra los resultados finales
function showResults() {
  pauseTimer();

  hashNavigationLocked = true;
  if (currentSection) {
    const sectionHash = currentSection.toLowerCase().replace(/_/g, '-');
    window.location.hash = `#/${sectionHash}/results`;
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
      const part1Count = (catData?.groups && catData.groups[0]?.task1?.length) || 0;
      const part2Count = (catData?.groups && catData.groups[0]?.task2) ? 1 : 0;
      totalParts += part1Count + part2Count;
      const answered = sectionResponses.filter(r => r && r.length > 0).length;
      totalScore += Math.min(answered, part1Count);
      totalScore += answered > part1Count ? 1 : 0;

      const part1Answered = Math.min(answered, part1Count);
      const part2Answered = answered > part1Count ? 1 : 0;
      displayScore = `${part1Answered}/${part1Count} • ${part2Answered}/${part2Count}`;
    } else if (cat === 'LISTENING' || cat === 'READING_AND_GRAMMAR') {
      let count = 0;
      if (catData && catData.parts) {
        catData.parts.forEach(p => {
          if (p.questions) count += p.questions.length;
          if (p.audioGroups) p.audioGroups.forEach(g => { count += g.questions.length; });
          if (p.readingGroups) p.readingGroups.forEach(g => { count += g.questions.length; });
        });
      }
      totalParts += count;
      totalScore += score[cat] || 0;
      displayScore = count > 0 ? `${score[cat] || 0}/${count}` : '0/0';
    } else if (cat === 'SPEAKING') {
      const totalTasks = (catData?.parts && catData.parts.reduce((sum, p) => sum + (p.tasks?.length || 0), 0)) || 0;
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

// Envía los resultados por correo electrónico
function sendEmail() {
  let listeningCount = 0;
  let readingCount = 0;

  if (quizData.LISTENING && quizData.LISTENING.parts) {
    quizData.LISTENING.parts.forEach(p => {
      if (p.questions) listeningCount += p.questions.length;
      if (p.audioGroups) p.audioGroups.forEach(g => { listeningCount += g.questions.length; });
    });
  }

  if (quizData.READING_AND_GRAMMAR && quizData.READING_AND_GRAMMAR.parts) {
    quizData.READING_AND_GRAMMAR.parts.forEach(item => {
      if (item.questions) readingCount += item.questions.length;
      if (item.readingGroups) item.readingGroups.forEach(g => { readingCount += g.questions.length; });
    });
  }

  const writingPart1 = (currentGroup?.task1 && currentGroup.task1.length) || 0;
  const writingPart2 = currentGroup?.task2 ? 1 : 0;
  const part1Answered = sectionResponses.filter((r, i) => r && r.length > 0 && i < writingPart1).length;
  const part2Answered = (sectionResponses[writingPart1] && sectionResponses[writingPart1].length > 0) ? 1 : 0;
  const speakingTaskCount = (quizData.SPEAKING && quizData.SPEAKING.parts && quizData.SPEAKING.parts.reduce((sum, p) => sum + (p.tasks?.length || 0), 0)) || 0;
  const speakingAnswered = speakingResponses.filter(r => r).length;

  const totalScore = score.WRITING + score.LISTENING + score.READING_AND_GRAMMAR + speakingAnswered;
  const totalParts = writingPart1 + writingPart2 + listeningCount + readingCount + speakingTaskCount;
  const percentage = totalParts > 0 ? Math.round((totalScore / totalParts) * 100) : 0;

  const subject = 'Resultados MET Quiz - Your English World';
  const speakingDetails = speakingResponses
    .map((r, i) => r ? `  Task ${i + 1}: ${r.duration}s recorded` : `  Task ${i + 1}: No response`)
    .join('\n');

  const body = `Resultados del Test MET
======================
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
  if (!saved) return;
  currentSection = saved.currentSection;
  currentQuestionIndex = saved.currentIndex;
  score = saved.score;
  answeredQuestions = new Set(saved.answeredQuestions);
  if (!currentSection || currentSection === 'WRITING') return;
  const sourceData = quizData[currentSection];
  if (!sourceData) return;

  const allQuestions = [];
  if (sourceData.parts) {
    sourceData.parts.forEach((exercise, exerciseIndex) => {
      if (exercise.questions) {
        exercise.questions.forEach((q, qIndex) => {
          const qCopy = Object.assign({}, q);
          qCopy.exerciseIndex = exerciseIndex;
          qCopy.questionIndex = qIndex;
          qCopy.category = currentSection;
          qCopy.audio = exercise.audio || null;
          allQuestions.push(qCopy);
        });
      }
      if (exercise.audioGroups) {
        exercise.audioGroups.forEach(group => {
          group.questions.forEach((q, qIndex) => {
            const qCopy = Object.assign({}, q);
            qCopy.exerciseIndex = exerciseIndex;
            qCopy.questionIndex = qIndex;
            qCopy.category = currentSection;
            qCopy.mainAudio = group.mainAudio;
            qCopy.extraAudio = q.extraAudio || null;
            allQuestions.push(qCopy);
          });
        });
      }
    });
  }

  shuffledQuestions = saved.questionsOrder.map(order => {
    const original = allQuestions.find(
      q => q.exerciseIndex === order.exerciseIndex && q.questionIndex === order.questionIndex
    );
    if (!original) return null;
    const shuffled = shuffleOptions(original);
    shuffled.exerciseIndex = original.exerciseIndex;
    shuffled.questionIndex = original.questionIndex;
    return shuffled;
  }).filter(item => item !== null);

  getElement('category-select').classList.add('hidden');
  getElement('quiz-view').classList.remove('hidden');
  loadQuestion();
  resumeTimer();
}

// Inicializa los escuchadores de eventos
function initEventListeners() {
  getElement('next-btn')?.addEventListener('click', nextQuestion);
  getElement('prev-btn')?.addEventListener('click', previousQuestion);
  getElement('check-btn')?.addEventListener('click', checkCurrentGroup);
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
      saveCurrentWritingResponse();
      const nextPartKey = getWritingNextPartName();
      if (nextPartKey) {
        navigateToPart(nextPartKey);
      } else {
        goToPreview();
      }
    } else if (currentSection === 'SPEAKING') {
      const nextPart = getNextPartKey();
      if (nextPart) {
        beginSpeaking(nextPart.key);
        startTimer(currentSection);
      } else {
        goToPreview();
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

// Regresa a la página de inicio
function goHome() {
  stopTimer();
  stopSpeakingMic();

  if (currentSection === 'WRITING') {
    saveCurrentWritingResponse();
  }
  saveProgress();

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

// Inicializa la aplicación
async function init() {
  loadUser();
  updateUserDisplay();
  initTheme();
  initEventListeners();

  const loaded = await loadAllData();

  if (window.location.hash && window.location.hash.length > 1 && window.location.hash !== '#/') {
    loadFromHash();
  } else {
    renderCategorySelect();
  }
}

// Inicializa el tema (claro/oscuro)
function initTheme() {
  const themeSwitch = document.getElementById('theme-switch');
  const savedTheme = localStorage.getItem('metQuizTheme') || 'light';
  
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    if (themeSwitch) themeSwitch.checked = true;
  }
  
  if (themeSwitch) {
    themeSwitch.addEventListener('change', function() {
      if (this.checked) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('metQuizTheme', 'dark');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('metQuizTheme', 'light');
      }
    });
  }
}

// Permite exportar funciones si se usa en Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { quizData, loadGroup, loadAllData };
}

init();
