// Archivo principal de JavaScript para el quiz MET de Your English World
// Este archivo contiene toda la lógica del quiz: preguntas, temporizador, navegación, etc.
// Los comentarios en español explican cada función para personas sin experiencia en programación.

// Datos de las preguntas - se cargan desde los archivos JSON
const quizData = {
  WRITING: null, // Datos de Writing (se cargan después)
  LISTENING: null, // Preguntas de Listening
  READING_AND_GRAMMAR: null, // Preguntas de Reading & Grammar
  SPEAKING: null, // Preguntas de Speaking
};

// Configuración de cada sección: tiempo en segundos, partes, etc.
const SECTION_CONFIG = {
  WRITING: { time: 45 * 60, tasks: 2, items: 4, name: "writing" },
  LISTENING: { time: 35 * 60, parts: 3, items: 50, name: "listening" },
  READING_AND_GRAMMAR: { time: 65 * 60, parts: 3, items: 50, name: "reading" },
  SPEAKING: { time: 10 * 60, parts: 2, items: 5, name: "speaking" },
  // Configuración de cada parte individual (Task 1, Task 2, Part 1, etc.)
  WRITING_TASK1: {
    key: "WRITING_TASK1",
    time: 30 * 60,
    tasks: 1,
    items: 3,
    name: "Task 1",
    parentSection: "WRITING",
    partId: 1,
  },
  WRITING_TASK2: {
    key: "WRITING_TASK2",
    time: 45 * 60,
    tasks: 1,
    items: 1,
    name: "Task 2",
    parentSection: "WRITING",
    partId: 2,
  },
  LISTENING_P1: {
    key: "LISTENING_P1",
    time: 35 * 60,
    parts: 3,
    items: 19,
    name: "listening-p1",
    parentSection: "LISTENING",
    partId: 1,
  },
  LISTENING_P2: {
    key: "LISTENING_P2",
    time: 35 * 60,
    parts: 3,
    items: 14,
    name: "listening-p2",
    parentSection: "LISTENING",
    partId: 2,
  },
  LISTENING_P3: {
    key: "LISTENING_P3",
    time: 35 * 60,
    parts: 3,
    items: 17,
    name: "listening-p3",
    parentSection: "LISTENING",
    partId: 3,
  },
  READING_P1: {
    key: "READING_P1",
    time: 65 * 60,
    parts: 3,
    items: 20,
    name: "reading-p1",
    parentSection: "READING_AND_GRAMMAR",
    partId: 1,
  },
  READING_P2: {
    key: "READING_P2",
    time: 65 * 60,
    parts: 3,
    items: 11,
    name: "reading-p2",
    parentSection: "READING_AND_GRAMMAR",
    partId: 2,
  },
  READING_P3: {
    key: "READING_P3",
    time: 65 * 60,
    parts: 3,
    items: 20,
    name: "reading-p3",
    parentSection: "READING_AND_GRAMMAR",
    partId: 3,
  },
  SPEAKING_P1: {
    key: "SPEAKING_P1",
    time: 10 * 60,
    parts: 2,
    items: 3,
    name: "Part 1",
    parentSection: "SPEAKING",
    partId: 1,
  },
  SPEAKING_P2: {
    key: "SPEAKING_P2",
    time: 10 * 60,
    parts: 2,
    items: 2,
    name: "Part 2",
    parentSection: "SPEAKING",
    partId: 2,
  },
};

// Convierte nombre de sección (escrito) a clave interna (en inglés)
const SECTION_NAMES = {
  writing: "WRITING",
  listening: "LISTENING",
  reading: "READING_AND_GRAMMAR",
  speaking: "SPEAKING",
};

// Texto que se muestra en pantalla para cada sección
const SECTION_DISPLAY = {
  WRITING: "WRITING",
  LISTENING: "LISTENING",
  READING_AND_GRAMMAR: "READING & GRAMMAR",
  SPEAKING: "SPEAKING",
};

// Obtiene la sección padre a partir de una clave (ej: "writing-task1" → "WRITING")
function getSectionKey(partKey) {
  if (!partKey) return null;
  if (partKey.startsWith("WRITING")) return "WRITING";
  if (partKey.startsWith("LISTENING")) return "LISTENING";
  if (partKey.startsWith("READING")) return "READING_AND_GRAMMAR";
  if (partKey.startsWith("SPEAKING")) return "SPEAKING";
  return null;
}

// Get the type of section: "textarea", "audio", or "mc"
function getSectionType(partKey) {
  const section = getSectionKey(partKey);
  if (!section) return null;
  if (section === "WRITING") return "textarea";
  if (section === "SPEAKING") return "audio";
  return "mc";
}

// Convierte el nombre de la URL (hash) a una clave interna
// Ejemplo: "writing-task1" se convierte en "WRITING_TASK1"
// Convierte el nombre de la URL (hash) a una clave interna
function getPartKeyFromHashName(hashName) {
  // Busca si el hash empieza con writing, listening, reading o speaking
  const sectionMatch = hashName.match(/^(writing|listening|reading|speaking)-/);
  // Si no coincide, devuelve el nombre en mayúsculas cambiando guiones por guiones bajos
  if (!sectionMatch) return hashName.toUpperCase().replace(/-/g, "_");

  // Toma la parte del nombre (writing, listening, etc.)
  const sectionBase = sectionMatch[1].toUpperCase();
  // Quita la parte inicial para obtener el resto (task1, part2, etc.)
  const suffix = hashName.replace(sectionMatch[0], "");

  // Busca si hay "part" o "task" seguido de un número
  const partNum = suffix.match(/(?:part|task)(\d+)/i);
  if (partNum) {
    // Combina la sección con el número de parte
    // Para Writing usa TASK1, para otros usa P1
    return `${sectionBase}_P${partNum[1]}`.replace(
      "_P",
      sectionBase === "WRITING" ? "_TASK" : "_P",
    );
  }

  // Si no hay número de parte, devuelve el nombre convertido
  return hashName.toUpperCase().replace(/-/g, "_");
}

// Muestra el nombre corto de la sección en la barra superior
function getSectionBadge(partKey) {
  const section = getSectionKey(partKey);
  if (!section) return "MET QUIZ";
  return SECTION_DISPLAY[section] || section;
}

// Obtiene la etiqueta de la parte (ej: "Task 1" o "Part 2")
function getPartLabel(partKey) {
  const config = SECTION_CONFIG[partKey];
  if (!config || !config.partId) return "";
  const section = getSectionKey(partKey);
  // Para Writing usa "Task", para otros usa "Part"
  return section === "WRITING"
    ? `Task ${config.partId}`
    : `Part ${config.partId}`;
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
  WRITING: 45 * 60, // 45 minutos
  LISTENING: 35 * 60, // 35 minutos
  READING_AND_GRAMMAR: 65 * 60, // 65 minutos
  SPEAKING: 10 * 60, // 10 minutos
};

// Tiempo de advertencia (5 minutos antes de acabar)
const WARNING_TIME = 5 * 60;

// Lista de partes para cada sección (para navegación)
// Define qué partes tiene cada sección (Task 1, Task 2, Part 1, etc.)
const SECTION_PARTS = {
  // Writing: 3 Task 1 questions + 1 Task 2 essay (universal items)
  WRITING: [
    {
      inputType: "textarea",
      task: 1,
      number: 1,
      partKey: "WRITING_TASK1",
      partLabel: "Task 1",
      itemNum: 1,
      totalInPart: 3,
    },
    {
      inputType: "textarea",
      task: 1,
      number: 2,
      partKey: "WRITING_TASK1",
      partLabel: "Task 1",
      itemNum: 2,
      totalInPart: 3,
    },
    {
      inputType: "textarea",
      task: 1,
      number: 3,
      partKey: "WRITING_TASK1",
      partLabel: "Task 1",
      itemNum: 3,
      totalInPart: 3,
    },
    {
      inputType: "textarea",
      task: 2,
      number: 1,
      partKey: "WRITING_TASK2",
      partLabel: "Task 2",
      itemNum: 1,
      totalInPart: 1,
      isEssay: true,
    },
  ],
  // Listening tiene 3 partes
  LISTENING: [
    { key: "LISTENING_P1", name: "Part 1", time: 35 * 60, partId: 1 },
    { key: "LISTENING_P2", name: "Part 2", time: 35 * 60, partId: 2 },
    { key: "LISTENING_P3", name: "Part 3", time: 35 * 60, partId: 3 },
  ],
  // Reading & Grammar tiene 3 partes
  READING_AND_GRAMMAR: [
    { key: "READING_P1", name: "Part 1", time: 65 * 60, partId: 1 },
    { key: "READING_P2", name: "Part 2", time: 65 * 60, partId: 2 },
    { key: "READING_P3", name: "Part 3", time: 65 * 60, partId: 3 },
  ],
  // Speaking tiene 2 partes, 5 tareas total (3 en Part 1, 2 en Part 2)
  SPEAKING: [
    {
      inputType: "audio",
      task: 1,
      number: 1,
      partKey: "SPEAKING_P1",
      partLabel: "Part 1",
      itemNum: 1,
      totalInPart: 3,
    },
    {
      inputType: "audio",
      task: 1,
      number: 2,
      partKey: "SPEAKING_P1",
      partLabel: "Part 1",
      itemNum: 2,
      totalInPart: 3,
    },
    {
      inputType: "audio",
      task: 1,
      number: 3,
      partKey: "SPEAKING_P1",
      partLabel: "Part 1",
      itemNum: 3,
      totalInPart: 3,
    },
    {
      inputType: "audio",
      task: 2,
      number: 1,
      partKey: "SPEAKING_P2",
      partLabel: "Part 2",
      itemNum: 1,
      totalInPart: 2,
    },
    {
      inputType: "audio",
      task: 2,
      number: 2,
      partKey: "SPEAKING_P2",
      partLabel: "Part 2",
      itemNum: 2,
      totalInPart: 2,
    },
  ],
};

// Crea el texto de la URL (hash) para una parte y grupo
function formatHash(partKey, groupIndex) {
  const config = SECTION_CONFIG[partKey];
  if (!config) return `#/${partKey}/g${groupIndex}`; // Formato simple

  const sectionName = getSectionKey(partKey).toLowerCase(); // Nombre de la sección
  const partNum = config.partId || 1; // Número de parte
  // Para Writing usa "task1", para otros usa "part1"
  const partName =
    sectionName === "writing" ? `task${partNum}` : `part${partNum}`;

  // Si hay grupos, añade el rango de preguntas (ej: q01-03)
  if (questionGroups && questionGroups[groupIndex]) {
    const group = questionGroups[groupIndex];
    const { start, end } = group.questionRange;
    const qRange =
      start === end
        ? `q${start.toString().padStart(2, "0")}`
        : `q${start.toString().padStart(2, "0")}-${end.toString().padStart(2, "0")}`;
    return `#/${sectionName}-${partName}/${qRange}`;
  }

  return `#/${sectionName}-${partName}/g${groupIndex}`;
}

// Actualiza la URL con el hash de la parte actual
function updateHash(partKey, groupIndex) {
  window.location.hash = formatHash(partKey, groupIndex);
}

// Lee la URL (hash) y extrae la información de la sección actual
function parseHash() {
  const hash = window.location.hash.slice(1); // Quita el # inicial
  if (!hash || hash === "/") return null; // URL vacía

  const parts = hash.split("/").filter((p) => p); // Divide por barras
  if (parts.length < 2) return null; // URL muy corta

  const rawKey = parts[0]; // Primera parte (ej: "writing" o "writing-task1")
  const sectionKey = getPartKeyFromHashName(rawKey); // Convierte a clave interna
  const parentSection = getSectionKey(sectionKey) || sectionKey;

  // Si es vista previa - usar nombre de sección (ej: /#/writing/preview)
  if (parts[1] === "preview") {
    return {
      section: parentSection,
      parentSection,
      taskPart: "preview",
      qStart: null,
      qEnd: null,
      groupIndex: null,
      hash,
    };
  }

  // Si es vista de resultados - usar nombre de sección (ej: /#/writing/results)
  if (parts[1] === "results") {
    return {
      section: parentSection,
      parentSection,
      taskPart: "results",
      qStart: null,
      qEnd: null,
      groupIndex: null,
      hash,
    };
  }

  // Para navegación normal, usar la clave de parte (ej: WRITING_TASK1)
  const sectionParts = SECTION_PARTS[parentSection];
  const sectionType = getSectionType(parentSection);

  if (sectionType === "textarea" || sectionType === "audio") {
    // Writing/Speaking: parse q number from hash
    const qMatch = parts[1]?.match(/^q(\d+)(?:-(\d+))?$/);
    if (qMatch) {
      const qStart = parseInt(qMatch[1], 10);
      return {
        section: sectionKey,
        parentSection,
        taskPart: null,
        qStart,
        qEnd: qMatch[2] ? parseInt(qMatch[2], 10) : qStart,
        groupIndex: null,
        hash,
      };
    }
  } else {
    // MC sections: parse q range from hash
    const rangeMatch = parts[1]?.match(/^q(\d+)(?:-(\d+))?$/);
    if (rangeMatch) {
      const qStart = parseInt(rangeMatch[1], 10);
      const qEnd = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : qStart;
      return {
        section: sectionKey,
        parentSection,
        taskPart: null,
        qStart,
        qEnd,
        groupIndex: null,
        hash,
      };
    }
  }

  return null;
}

// Crea una clave única para guardar cada respuesta
function getProgressKey(partKey, qNum) {
  const config = SECTION_CONFIG[partKey];
  if (config) {
    return `${config.name}_q${qNum.toString().padStart(2, "0")}`;
  }
  return `${partKey.toLowerCase()}_q${qNum}`;
}

// Guarda la respuesta en el navegador
function saveAnswerToHash(answer, qGlobalNum) {
  const key = getProgressKey(currentPartKey, qGlobalNum);
  const saved = JSON.parse(localStorage.getItem("metQuizProgress") || "{}");
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
  localStorage.setItem("metQuizProgress", JSON.stringify(saved));
}

// Busca una respuesta guardada en el navegador
function getAnswerFromHash(partKey, qNum) {
  const key = getProgressKey(partKey, qNum); // Clave única
  const saved = JSON.parse(localStorage.getItem("metQuizProgress") || "{}");
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

  const { section, parentSection, taskPart, qStart, qEnd } = parsed;

  if (!section || !SECTION_CONFIG[section]) {
    if (!currentSection) renderCategorySelect();
    return;
  }

  if (!currentUser) {
    showRegistrationModal();
    return;
  }

  // Handle preview and results at section level
  if (taskPart === "preview") {
    if (currentSection !== parentSection) {
      beginQuiz(parentSection);
      setTimeout(() => goToPreview(), 100);
    } else {
      goToPreview();
    }
    return;
  }

  if (taskPart === "results") {
    if (currentSection !== parentSection) {
      beginQuiz(parentSection);
      setTimeout(() => showResults(), 100);
    } else {
      showResults();
    }
    return;
  }

  // Universal logic: handle navigation based on SECTION_PARTS
  const sectionKey = parentSection || getSectionKey(section);
  const sectionParts = SECTION_PARTS[sectionKey];
  const sectionType = getSectionType(section);

  if (sectionParts && sectionKey) {
    if (qStart !== null) {
      // Find the item in SECTION_PARTS that matches this question number
      const targetItem = sectionParts.find((item) => {
        if (sectionType === "textarea" || sectionType === "audio") {
          // For Writing/Speaking: qStart corresponds to item number
          return qStart === item.itemNum;
        }
        return false;
      });

      if (targetItem && currentPartKey !== targetItem.partKey) {
        navigateToPart(targetItem.partKey);
        return;
      } else if (targetItem) {
        // Same part, just render the step
        const itemIndex = sectionParts.indexOf(targetItem);
        renderStep(sectionKey, itemIndex, currentGroup, targetItem.inputType);
        return;
      }
    }
  }

  // For MC sections with question groups
  if (
    currentPartKey === section &&
    qStart !== null &&
    questionGroups.length > 0
  ) {
    const targetGroup = questionGroups.findIndex(
      (g) => qStart >= g.questionRange.start && qStart <= g.questionRange.end,
    );
    if (targetGroup >= 0 && targetGroup !== currentGroupIndex) {
      currentGroupIndex = targetGroup;
      loadGroup();
      return;
    }
    return;
  }

  // Navigate to different part
  if (
    sectionKey &&
    currentSection === sectionKey &&
    currentPartKey !== section
  ) {
    navigateToPart(section);
    return;
  }

  beginQuiz(section);
}

window.addEventListener("hashchange", loadFromHash);

// Inicializar la página al cargar
window.addEventListener("load", async () => {
  await loadAllData();

  // Load saved user and update display
  loadUser();
  updateUserDisplay();

  // Load saved theme
  const savedTheme = localStorage.getItem("metQuizTheme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);

  // Setup theme toggle
  const themeSwitch = document.getElementById("theme-switch");
  if (themeSwitch) {
    themeSwitch.checked = savedTheme === "dark";
    themeSwitch.addEventListener("change", function () {
      const theme = this.checked ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("metQuizTheme", theme);
    });
  }

  // Setup navigation event listeners
  setupEventListeners();

  loadFromHash();
});

// Convierte segundos a formato de tiempo (MM:SS)
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// Actualiza el reloj en pantalla
function updateTimerDisplay() {
  const display = getElement("timer-display");
  const container = getElement("timer-container");
  if (display) {
    display.textContent = formatTime(timerRemaining);
    if (container) {
      container.classList.toggle("warning", timerRemaining <= WARNING_TIME);
    }
  }
}

// Inicia el cronómetro de la sección
function startTimer(section) {
  if (timerRunning) return;

  const saved = loadProgress();
  const now = Date.now();
  if (
    saved &&
    saved.section === section &&
    saved.timerEnd &&
    saved.timerEnd > now
  ) {
    timerRemaining = Math.floor((saved.timerEnd - now) / 1000);
  } else {
    timerRemaining = SECTION_TIMES[section];
    if (saved) {
      saved.timerEnd = null;
      localStorage.setItem("metQuizProgress", JSON.stringify(saved));
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
    saved.timerEnd = Date.now() + timerRemaining * 1000;
    saved.section = currentSection;
    saved.currentSection = currentSection;
    localStorage.setItem("metQuizProgress", JSON.stringify(saved));
  }
}

// Muestra el mensaje de tiempo agotado
function showTimeModal() {
  getElement("time-modal").classList.remove("hidden");
  getElement("timer-display").textContent = "00:00";
}

// Oculta el mensaje de tiempo agotado
function hideTimeModal() {
  getElement("time-modal").classList.add("hidden");
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
// Índice del item actual basado en SECTION_PARTS
let currentItemIndex = 0;
// Índice de vista previa
let currentPreviewIndex = 0;

// Letras para las opciones
const letters = ["A", "B", "C", "D"];

// URL para enviar datos a Google Sheets (En caso de actualizar, está en: línea 523, 709 y 740 y en SETUP.md)
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzo0UvJWgK-hGMpLPAyAzuz7D6InaGY1GGZMGfrYycEwmMBJNh1aSQ2UIA44DgX9Blp/exec";

// Límite de caracteres para Task 1
const TASK1_CHAR_LIMIT = 750;
// Límite de caracteres para Task 2
const TASK2_CHAR_LIMIT = 3500;

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
  const optionsWithIndex = question.options.map((opt, i) => ({
    text: opt,
    originalIndex: i,
  }));
  const shuffled = shuffleArray(optionsWithIndex);
  return {
    ...question,
    shuffledOptions: shuffled.map((opt) => opt.text),
    correctShuffledIndex: shuffled.findIndex(
      (opt) => opt.originalIndex === question.correct,
    ),
    originalCorrectIndex: question.correct,
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
    questionsOrder: shuffledQuestions.map((q) => ({
      exerciseIndex: q.exerciseIndex,
      questionIndex: q.questionIndex,
    })),
    itemIndex: currentItemIndex,
    writingResponses: sectionResponses,
    writingGroupId: currentGroup?.id || null,
    speakingtaskIndex: speakingtaskIndex,
    speakingResponses: speakingResponses.map((r) =>
      r ? { duration: r.duration, timestamp: r.timestamp } : null,
    ),
  };
  localStorage.setItem("metQuizProgress", JSON.stringify(progress));
}

// Carga el progreso guardado del navegador
function loadProgress() {
  const saved = localStorage.getItem("metQuizProgress");
  return saved ? JSON.parse(saved) : null;
}

// Borra todo el progreso guardado
function clearProgress() {
  localStorage.removeItem("metQuizProgress");
}

// Reinicia todo el progreso del quiz
function resetAllProgress() {
  const modal = getElement("confirm-modal");
  const modalText = getElement("confirm-text");
  const modalOk = getElement("confirm-ok");
  const modalCancel = getElement("confirm-cancel");

  modalText.textContent =
    "Are you sure you want to reset all progress? This cannot be undone.";

  modal.classList.remove("hidden");

  const handleOk = () => {
    modal.classList.add("hidden");
    clearProgress();
    clearSpeakingDB().catch(console.error);
    score = { WRITING: 0, LISTENING: 0, READING_AND_GRAMMAR: 0, SPEAKING: 0 };
    answeredQuestions = new Set();
    sectionResponses = [];
    speakingResponses = [];
    currentItemIndex = 0;
    currentQuestionIndex = 0;
    renderCategorySelect();
  };

  modalOk.onclick = handleOk;
  modalCancel.onclick = () => modal.classList.add("hidden");
}

// Reinicia solo la sección actual
function resetSectionProgress() {
  if (!currentSection) return;

  const modal = getElement("confirm-modal");
  const modalText = getElement("confirm-text");
  const modalOk = getElement("confirm-ok");
  const modalCancel = getElement("confirm-cancel");

  modalText.textContent = `Reset progress for ${currentSection}? This cannot be undone.`;

  modal.classList.remove("hidden");

  const handleOk = () => {
    modal.classList.add("hidden");
    clearProgress();
    score = { WRITING: 0, LISTENING: 0, READING_AND_GRAMMAR: 0, SPEAKING: 0 };
    answeredQuestions = new Set();
    sectionResponses = [];
    currentItemIndex = 0;
    currentQuestionIndex = 0;
    beginQuiz(currentSection);
  };

  modalOk.onclick = handleOk;
  modalCancel.onclick = () => modal.classList.add("hidden");
}

// Busca un elemento del HTML por su ID (atajo)
function getElement(id) {
  return document.getElementById(id);
}

// Guarda los datos del usuario en el navegador
function saveUser(user) {
  localStorage.setItem("metQuizUser", JSON.stringify(user));
  currentUser = user;
  updateUserDisplay();
}

// Carga los datos del usuario guardados
function loadUser() {
  const saved = localStorage.getItem("metQuizUser");
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
    getElement("user-info").classList.remove("hidden");
    const displayName =
      currentUser.name.length > 12
        ? currentUser.name.substring(0, 12) + "..."
        : currentUser.name;
    getElement("user-name").textContent = displayName;
    getElement("quiz-user-name").textContent = "Hi " + currentUser.name + "!";
  } else {
    getElement("user-info").classList.add("hidden");
    getElement("quiz-user-name").textContent = "";
  }
}

async function logActivity(action, detail = "") {
  if (!currentUser) return;

  const data = {
    timestamp: new Date().toISOString(),
    name: currentUser.name,
    email: currentUser.email,
    category: currentSection || "",
    action: action,
    detail: detail,
  };

  try {
    if (
      APPS_SCRIPT_URL &&
      APPS_SCRIPT_URL !==
        "https://script.google.com/macros/s/AKfycbzo0UvJWgK-hGMpLPAyAzuz7D6InaGY1GGZMGfrYycEwmMBJNh1aSQ2UIA44DgX9Blp/exec"
    ) {
      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }
  } catch (error) {
    console.log("Activity logged locally:", data);
  }
}

// Muestra la ventana para registrar usuario
function showRegistrationModal() {
  const modal = getElement("registration-modal");
  if (!modal) return;
  modal.classList.remove("hidden");
  const nameInput = getElement("reg-name");
  const emailInput = getElement("reg-email");
  if (nameInput) {
    nameInput.value = "";
    nameInput.focus();
  }
  if (emailInput) emailInput.value = "";
}

// Oculta la ventana de registro
function hideRegistrationModal() {
  getElement("registration-modal").classList.add("hidden");
}

// Muestra la ventana de ayuda
function showHelpModal() {
  getElement("help-modal").classList.remove("hidden");
  getElement("help-text").value = "";
  getElement("help-text").focus();
}

// Oculta la ventana de ayuda
function hideHelpModal() {
  getElement("help-modal").classList.add("hidden");
}

// Muestra la ventana para cambiar usuario
function showChangeUserModal() {
  getElement("change-user-modal").classList.remove("hidden");
  getElement("change-name").value = currentUser?.name || "";
  getElement("change-email").value = currentUser?.email || "";
  getElement("change-name").focus();
}

// Oculta la ventana de cambiar usuario
function hideChangeUserModal() {
  getElement("change-user-modal").classList.add("hidden");
}

// Actualiza la barra de progreso de la sección (unificado)
function updateSectionProgress() {
  getElement("category-badge").textContent = getSectionBadge(currentPartKey);

  const sectionParts = SECTION_PARTS[currentSection];
  const sectionType = getSectionType(currentPartKey);

  // For sections with textarea or audio inputType (WRITING, SPEAKING)
  if (sectionType === "textarea" || sectionType === "audio") {
    // Find current item index in SECTION_PARTS
    const currentItemIndex = sectionParts.findIndex((item) => {
      return item.partKey === currentPartKey;
    });

    if (currentItemIndex >= 0) {
      const item = sectionParts[currentItemIndex];
      const partLabel = item.partLabel;

      // Universal progress text based on inputType
      if (item.inputType === "textarea") {
        const itemText =
          item.totalInPart > 1
            ? `${partLabel}: Q${item.itemNum}/${item.totalInPart}`
            : `${partLabel}: Essay`;
        getElement("progress-text").textContent = itemText;
      } else if (item.inputType === "audio") {
        getElement("progress-text").textContent =
          `${partLabel}: Task ${item.itemNum}/${item.totalInPart}`;
      }

      // Calculate progress based on saved responses
      const saved = loadProgress();
      let responses = [];
      if (sectionType === "textarea") {
        responses = saved?.writingResponses || sectionResponses || [];
      } else if (sectionType === "audio") {
        responses = saved?.speakingResponses || speakingResponses || [];
      }

      const answered = sectionParts.filter((itm) => {
        const response = responses[itm.itemNum - 1];
        if (!response) return false;
        if (itm.inputType === "textarea") {
          return typeof response === "string" && response.length > 0;
        } else if (itm.inputType === "audio") {
          return response !== null && response !== undefined;
        }
        return false;
      }).length;

      const percent = sectionParts.length > 0 ? (answered / sectionParts.length) * 100 : 0;
      getElement("progress-bar").style.width = percent + "%";
    }
    return;
  }

  // For MC sections (LISTENING, READING_AND_GRAMMAR)
  if (questionGroups.length > 0) {
    const grp = questionGroups[currentGroupIndex];
    const { start, end } = grp.questionRange;
    const totalQ = shuffledQuestions.length;
    getElement("progress-text").textContent = getPartProgressText(
      currentPartKey,
      start,
      end,
      totalQ,
    );
    const percent = ((currentGroupIndex + 1) / questionGroups.length) * 100;
    getElement("progress-bar").style.width = percent + "%";
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
          instructions: exercise.instructions || null,
        });
      });
    }
  });
  return flattened;
}

async function loadAllData() {
  try {
    const [writing, listening, readingAndGrammar, speaking] = await Promise.all(
      [
        fetch("data/writing.json")
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
        fetch("data/listening.json")
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
        fetch("data/reading.json")
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
        fetch("data/speaking.json")
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ],
    );

    quizData.WRITING = writing;
    quizData.LISTENING = listening;
    quizData.READING_AND_GRAMMAR = readingAndGrammar;
    quizData.SPEAKING = speaking;

    console.log("Data loaded:", quizData);
    return true;
  } catch (error) {
    console.error("Error loading data:", error);
    return false;
  }
}

// Muestra la pantalla de inicio con las categorías
function renderCategorySelect() {
  getElement("quiz-view").classList.add("hidden");
  getElement("results-container").classList.add("hidden");
  getElement("category-select").classList.remove("hidden");

  const container = getElement("category-buttons");
  container.innerHTML = "";

  const sections = [
    {
      key: "WRITING",
      name: "Writing",
      description: "Task 1 (3 questions) and Task 2 (essay of 250 words)",
      parts: [SECTION_CONFIG.WRITING_TASK1, SECTION_CONFIG.WRITING_TASK2],
    },
    {
      key: "LISTENING",
      name: "Listening",
      description: "Parts 1-3, 50 questions total.",
      parts: SECTION_PARTS.LISTENING,
    },
    {
      key: "READING_AND_GRAMMAR",
      name: "Reading & Grammar",
      description: "Parts 1-3, 51 questions total.",
      parts: SECTION_PARTS.READING_AND_GRAMMAR,
    },
    {
      key: "SPEAKING",
      name: "Speaking",
      description:
        "Respond to prompts with recorded audio. Parts 1-2, 5 tasks total.",
      parts: [SECTION_CONFIG.SPEAKING_P1, SECTION_CONFIG.SPEAKING_P2],
    },
  ];

  sections.forEach((sec) => {
    const card = document.createElement("div");
    card.className = "home-card";

    const titleEl = document.createElement("div");
    titleEl.className = "home-card-title";
    titleEl.textContent = sec.name;
    card.appendChild(titleEl);

    const descEl = document.createElement("div");
    descEl.className = "home-card-subtitle";
    descEl.textContent = sec.description;
    card.appendChild(descEl);

    const partsContainer = document.createElement("div");
    partsContainer.className = "home-card-parts";

    sec.parts.forEach((part) => {
      const hasContent = hasSectionContent(part.key);
      const saved = loadProgress();
      const partProgress = getPartProgress(part.key, saved);
      const percent = partProgress.percent;
      const label = percent > 0 ? `${percent}%` : "";

      const partBtn = document.createElement("div");
      partBtn.className = "home-card-part" + (!hasContent ? " disabled" : "");

      const partTitle = document.createElement("div");
      partTitle.className = "home-card-part-title";
      partTitle.textContent = part.name || part.partLabel;
      partBtn.appendChild(partTitle);

      if (!hasContent) {
        partBtn.classList.add("coming-soon");
      } else {
        const progressEl = document.createElement("div");
        progressEl.className = "home-card-part-progress";
        progressEl.textContent = label;
        partBtn.appendChild(progressEl);

        partBtn.addEventListener("click", () => startFromSection(part.key));
      }

      partsContainer.appendChild(partBtn);
    });

    card.appendChild(partsContainer);
    container.appendChild(card);
  });
}

// Revisa si una sección ya tiene contenido disponible (validación por tipo)
function hasSectionContent(partKey) {
  const section = getSectionKey(partKey);
  const sectionType = getSectionType(partKey);
  const sectionData = quizData[section];

  if (!sectionData) return false;

  // Textarea (Writing): validate groups array (has task1 + task2)
  if (sectionType === "textarea") {
    return sectionData.groups && sectionData.groups.length > 0;
  }

  // Audio (Speaking): validate parts array (has tasks)
  if (sectionType === "audio") {
    return sectionData.parts && sectionData.parts.length > 0;
  }

  // MC (Listening, Reading & Grammar): validate parts array
  return sectionData.parts && sectionData.parts.length > 0;
}

// Obtiene el progreso de una parte específica (unificado para todas las secciones)
function getPartProgress(partKey, saved) {
  if (!saved) return { answered: 0, total: 0, percent: 0 };

  const section = getSectionKey(partKey);
  const sectionType = getSectionType(partKey);
  const config = SECTION_CONFIG[partKey];
  const sectionParts = SECTION_PARTS[section];

  if (!sectionParts) return { answered: 0, total: 0, percent: 0 };

  // Find items for this partKey in SECTION_PARTS
  const itemsInPart = sectionParts.filter((item) => item.partKey === partKey);

  // If section type is textarea or audio (Writing/Speaking), use response-based counting
  if (sectionType === "textarea" || sectionType === "audio") {
    const total = itemsInPart.length;

    // Get responses from the correct source (sectionResponses for Writing, speakingResponses for Speaking)
    let responses = [];
    if (sectionType === "textarea") {
      // Writing uses sectionResponses (textarea responses)
      responses = saved.writingResponses || sectionResponses || [];
    } else if (sectionType === "audio") {
      // Speaking uses speakingResponses (audio responses)
      responses = saved.speakingResponses || speakingResponses || [];
    }

    const answered = itemsInPart.filter((item) => {
      const response = responses[item.itemNum - 1];
      if (!response) return false;

      if (item.inputType === "textarea") {
        return typeof response === "string" && response.length > 0;
      } else if (item.inputType === "audio") {
        return response !== null && response !== undefined;
      }
      return false;
    }).length;

    const percent = total > 0 ? Math.round((answered / total) * 100) : 0;
    return { answered, total, percent };
  }

  // MC sections (LISTENING, READING_AND_GRAMMAR)
  const total = config ? config.items : 0;
  if (!saved.answersByPart || !saved.answersByPart[partKey]) {
    return { answered: 0, total, percent: 0 };
  }
  const answered = saved.answersByPart[partKey].length;
  const percent =
    answered > 0 && total > 0 ? Math.round((answered / total) * 100) : 0;
  return { answered, total, percent };
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
    score = saved.score || {
      WRITING: 0,
      LISTENING: 0,
      READING_AND_GRAMMAR: 0,
      SPEAKING: 0,
    };
    answersByPart = saved.answersByPart || {};
    timerRemaining = saved.timerRemaining || SECTION_TIMES[currentSection];
  } else {
    score = { WRITING: 0, LISTENING: 0, READING_AND_GRAMMAR: 0, SPEAKING: 0 };
    answersByPart = {};
    timerRemaining = SECTION_TIMES[currentSection];
  }

  // Universal section initialization
  const sectionParts = SECTION_PARTS[currentSection];
  const firstPart = sectionParts && sectionParts[0];
  const sectionType = getSectionType(section);

  // Validate content exists before proceeding
  if (!hasSectionContent(section)) {
    alert(
      `La sección de ${SECTION_DISPLAY[currentSection]} aún no tiene contenido.`,
    );
    return;
  }

  const partKey = section.startsWith(currentSection)
    ? section
    : firstPart
      ? firstPart.key || firstPart.partKey
      : null;

  if (!partKey) {
    alert("Error: No se pudo determinar la parte inicial.");
    return;
  }

  // Determine if this section uses inputType (Writing/Speaking) or MC
  if (sectionType === "textarea") {
    beginWriting(partKey, saved);
  } else if (sectionType === "audio") {
    beginSpeaking(partKey, saved);
  } else {
    beginMcPart(partKey, saved);
  }
}

// Inicia una sección con inputType textarea (ej: Writing)
function beginWriting(partKey, saved) {
  const sectionData = quizData[currentSection];

  // Validation already done in beginQuiz(), just check for safety
  if (!sectionData || !sectionData.groups || sectionData.groups.length === 0) {
    console.error("Writing section has no content");
    return;
  }

  currentPartKey = partKey;
  const hasSavedProgress = saved && saved.currentPartKey === partKey;

  if (hasSavedProgress && saved.writingGroupId) {
    const group = sectionData.groups.find((g) => g.id === saved.writingGroupId);
    if (group) {
      currentGroup = group;
      sectionResponses = saved.writingResponses || [];
      currentItemIndex = saved.itemIndex || 0;
    } else {
      currentGroup = shuffleArray([...sectionData.groups])[0];
      sectionResponses = [];
      currentItemIndex = 0;
    }
  } else {
    currentGroup = shuffleArray([...sectionData.groups])[0];
    sectionResponses = [];
    currentItemIndex = 0;
  }
  currentPreviewIndex = 0;

  getElement("category-select").classList.add("hidden");
  getElement("quiz-view").classList.remove("hidden");
  getElement("results-container").classList.add("hidden");

  setupInstructionsPanel();
  logActivity("INICIO", `${currentSection} - Grupo: ${currentGroup.id}`);

  // Find the item index in SECTION_PARTS that matches the partKey
  const sectionParts = SECTION_PARTS[currentSection];
  const itemIndex = sectionParts.findIndex((item) => item.partKey === partKey);
  if (itemIndex >= 0) {
    currentItemIndex = itemIndex;
  }

  renderStep(currentSection, currentItemIndex, currentGroup, "textarea");
  updatePrevButtonVisibility();

  // Update hash using universal format
  hashNavigationLocked = true;
  updateHash(partKey, currentItemIndex);
  hashNavigationLocked = false;

  startTimer(currentSection);
}

// Universal step renderer for Writing (textarea) and Speaking (audio)
function renderStep(section, itemIndex, partData, inputType) {
  const container = getElement("quiz-container");
  container.classList.remove("fade-out");
  void container.offsetWidth;
  container.classList.add("fade-out");
  setTimeout(() => {
    container.classList.remove("fade-out");
    container.style.animation = "none";
    void container.offsetWidth;
    container.style.animation = "fadeIn 0.5s ease";
  }, 300);

  updateSectionProgress();

  getElement("transcription-toggle").innerHTML = "";
  getElement("transcription-toggle").classList.add("hidden");
  getElement("transcription-text").classList.add("hidden");
  getElement("reading-text").classList.add("hidden");
  getElement("feedback-container").classList.add("hidden");
  getElement("controls").classList.remove("hidden");

  const sectionParts = SECTION_PARTS[section];
  const currentItem = sectionParts ? sectionParts[itemIndex] : null;

  if (inputType === "textarea") {
    renderWritingStep(currentItem, partData);
  } else if (inputType === "audio") {
    renderSpeakingStep(currentItem, partData);
  }

  updatePrevButtonVisibility();
  resumeTimer();
}

// Render Writing step (textarea input)
function renderWritingStep(item, group) {
  if (!item) return;

  const container = getElement("options-container");
  const isEssay = item.isEssay || false;
  const limit = isEssay ? TASK2_CHAR_LIMIT : TASK1_CHAR_LIMIT;

  let html = '<div class="writing-question">';
  html += `<div class="writing-question-text">${item.partLabel} - Question ${item.itemNum}</div>`;

  if (isEssay) {
    const groupData = group;
    html += `<div class="writing-task-prompt">${groupData.task2.topic}</div>`;
    html += `<div class="writing-task-prompt" style="font-style:italic">${groupData.task2.prompt}</div>`;
  } else {
    const taskData = group.task1.find((t) => t.number === item.itemNum);
    if (taskData) {
      html += `<div class="writing-task-prompt">${taskData.text}</div>`;
    }
  }

  const savedResponse = sectionResponses[item.itemNum - 1] || "";
  html += `<textarea id="writing-textarea" class="writing-textarea${isEssay ? " writing-textarea-large" : ""}" placeholder="Write your response here...">${savedResponse}</textarea>`;
  html += `<div class="char-counter" id="char-count-container">`;
  html += `<span id="char-count">${savedResponse.length}</span> / ${limit}`;
  html += `</div></div>`;

  getElement("question-text").classList.add("hidden");
  container.innerHTML = html;

  setTimeout(() => setupTextareaEvents(), 0);
}

// Render Speaking step (audio input)
function renderSpeakingStep(item, partData) {
  if (!item) return;

  const container = getElement("options-container");
  const taskIndex = item.itemNum - 1;
  const task = partData.tasks[taskIndex];

  if (!task) return;

  let html = '<div class="speaking-task-container">';
  html += `<div class="writing-question-text">${item.partLabel} - Task ${item.itemNum}</div>`;
  html += `<div class="writing-task-prompt">${task.prompt}</div>`;
  html += `<div class="speaking-timer" id="speaking-timer-display">Time: ${formatTime(task.timeLimit)}</div>`;
  html += `<div class="speaking-controls">`;
  html += `<button id="start-recording-btn" class="btn btn-primary">Begin speaking now</button>`;
  html += `<button id="stop-recording-btn" class="btn btn-secondary hidden">Stop recording</button>`;
  html += `</div>`;
  html += `<div id="recording-status" class="hidden"></div>`;
  html += `<audio id="playback-audio" controls class="hidden"></audio>`;
  html += `</div>`;

  getElement("question-text").classList.add("hidden");
  container.innerHTML = html;

  setupSpeakingEvents(taskIndex, task.timeLimit);
}

// Setup Speaking recording events
function setupSpeakingEvents(taskIndex, timeLimit) {
  const startBtn = getElement("start-recording-btn");
  const stopBtn = getElement("stop-recording-btn");
  const statusEl = getElement("recording-status");
  const playbackAudio = getElement("playback-audio");

  if (startBtn) {
    startBtn.onclick = () => startSpeakingrecording(taskIndex, timeLimit);
  }
  if (stopBtn) {
    stopBtn.onclick = () => stopSpeakingrecording(taskIndex);
  }

  // Load saved recording if exists
  getSpeakingAudio(taskIndex).then((record) => {
    if (record && record.blob) {
      speakingResponses[taskIndex] = {
        blob: record.blob,
        duration: record.duration,
        timestamp: record.timestamp,
      };
      if (playbackAudio) {
        playbackAudio.src = URL.createObjectURL(record.blob);
        playbackAudio.classList.remove("hidden");
      }
      if (statusEl) {
        statusEl.textContent = "recording saved";
        statusEl.classList.remove("hidden");
      }
    }
  });
}

// Start Speaking recording
async function startSpeakingrecording(taskIndex, timeLimit) {
  const startBtn = getElement("start-recording-btn");
  const stopBtn = getElement("stop-recording-btn");
  const statusEl = getElement("recording-status");

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    speakingStream = stream;
    speakingMediaRecorder = new MediaRecorder(stream);
    speakingAudioChunks = [];

    speakingMediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) speakingAudioChunks.push(event.data);
    };

    speakingMediaRecorder.onstop = () => {
      const blob = new Blob(speakingAudioChunks, { type: "audio/webm" });
      const duration = timeLimit - speakingTimerRemaining;
      speakingResponses[taskIndex] = {
        blob,
        duration,
        timestamp: Date.now(),
      };
      saveSpeakingAudio(taskIndex, blob, duration);

      const playbackAudio = getElement("playback-audio");
      if (playbackAudio) {
        playbackAudio.src = URL.createObjectURL(blob);
        playbackAudio.classList.remove("hidden");
      }

      if (statusEl) {
        statusEl.textContent = "recording saved";
        statusEl.classList.remove("hidden");
      }

      if (startBtn) startBtn.classList.remove("hidden");
      if (stopBtn) stopBtn.classList.add("hidden");

      saveProgress();
      updatePrevButtonVisibility();
    };

    speakingMediaRecorder.start();
    speakingTimerRemaining = timeLimit;
    updateSpeakingTimerDisplay();

    if (startBtn) startBtn.classList.add("hidden");
    if (stopBtn) stopBtn.classList.remove("hidden");
    if (statusEl) {
      statusEl.textContent = "recording...";
      statusEl.classList.remove("hidden");
    }
  } catch (error) {
    console.error("Error starting recording:", error);
    alert("Could not access microphone. Please check permissions.");
  }
}

// Stop Speaking recording
function stopSpeakingrecording(taskIndex) {
  if (speakingMediaRecorder && speakingMediaRecorder.state !== "inactive") {
    speakingMediaRecorder.stop();
    if (speakingStream) {
      speakingStream.getTracks().forEach((track) => track.stop());
      speakingStream = null;
    }
  }
}

// Update Speaking timer display
function updateSpeakingTimerDisplay() {
  const timerDisplay = getElement("speaking-timer-display");
  if (timerDisplay) {
    timerDisplay.textContent = `Time: ${formatTime(speakingTimerRemaining)}`;
  }

  if (
    speakingTimerRemaining > 0 &&
    speakingMediaRecorder &&
    speakingMediaRecorder.state === "recording"
  ) {
    speakingTimerRemaining--;
    setTimeout(updateSpeakingTimerDisplay, 1000);
  }
}

// Inicia una parte de preguntas de opción múltiple (Listening o Reading)
function beginMcPart(partKey, saved = null) {
  const config = SECTION_CONFIG[partKey];
  if (!config || !config.partId) return false;

  const section = getSectionKey(partKey);
  let partData = null;

  if (section === "LISTENING") {
    partData = quizData.LISTENING?.parts?.find((p) => p.id === config.partId);
  } else if (section === "READING_AND_GRAMMAR") {
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

  getElement("category-select").classList.add("hidden");
  getElement("quiz-view").classList.remove("hidden");
  getElement("results-container").classList.add("hidden");

  setupInstructionsPanel();
  logActivity("INICIO", `${section} Part ${config.partId}`);
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
    globalNumber: globalNum,
  };
}

// Crea los grupos de preguntas para una parte
function buildQuestionGroups(partData, section, partId) {
  questionGroups = [];
  shuffledQuestions = [];
  let globalNum = 0;

  if (partData.questions) {
    partData.questions.forEach((q) => {
      globalNum++;
      const processed = processQuestion(q, section, partId, globalNum);
      shuffledQuestions.push(processed);
      questionGroups.push({
        groupNumber: globalNum,
        mainAudio: q.audio || null,
        questionRange: { start: globalNum, end: globalNum },
        questions: [processed],
      });
    });
  } else if (partData.audioGroups) {
    partData.audioGroups.forEach((audioGroup) => {
      const startNum = globalNum + 1;
      const groupQuestions = audioGroup.questions.map((q) => {
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
        questions: groupQuestions,
      });
    });
  } else if (partData.readingGroups) {
    partData.readingGroups.forEach((rg) => {
      const startNum = globalNum + 1;
      const groupQuestions = rg.questions.map((q) => {
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
        questions: groupQuestions,
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
  const contentEl = getElement("instructions-content");
  const contentPara = contentEl.querySelector("p");
  const sectionData = quizData[currentSection];

  if (contentPara && sectionData && sectionData.instructions) {
    contentPara.innerHTML = sectionData.instructions.replace(/\n/g, "<br>");
    getElement("section-instructions-panel").classList.remove("hidden");
  } else {
    getElement("section-instructions-panel").classList.add("hidden");
  }

  const toggleBtn = getElement("toggle-instructions");
  if (toggleBtn) {
    toggleBtn.onclick = function () {
      const icon = this.querySelector(".toggle-icon");
      if (contentEl.classList.contains("hidden")) {
        contentEl.classList.remove("hidden");
        icon.textContent = "^";
      } else {
        contentEl.classList.add("hidden");
        icon.textContent = "v";
      }
    };
  }
}

// Obtiene la ruta correcta del archivo de audio
function getAudioPath(audioSrc) {
  if (!audioSrc) return "";
  if (audioSrc.startsWith("data/") || audioSrc.startsWith("http"))
    return audioSrc;
  if (currentPartKey && currentPartKey.startsWith("LISTENING_P")) {
    const partNum = currentPartKey.replace("LISTENING_P", "");
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

  const container = getElement("quiz-container");
  container.classList.remove("fade-out");
  void container.offsetWidth;
  container.classList.add("fade-out");
  setTimeout(() => {
    container.classList.remove("fade-out");
    container.style.animation = "none";
    void container.offsetWidth;
    container.style.animation = "fadeIn 0.5s ease";
  }, 300);

  updateSectionProgress();

  getElement("transcription-toggle").innerHTML = "";
  getElement("transcription-toggle").classList.add("hidden");
  getElement("transcription-text").classList.add("hidden");
  getElement("reading-text").classList.add("hidden");
  getElement("feedback-container").classList.add("hidden");
  getElement("controls").classList.remove("hidden");

  if (grp.mainAudio) {
    const audioPath = getAudioPath(grp.mainAudio);
    let audioHTML = `<audio id="main-audio" controls src="${audioPath}"></audio>`;
    const hasExtra = grp.questions.some((q) => q.extraAudio);
    if (hasExtra) {
      grp.questions.forEach((q, idx) => {
        if (q.extraAudio) {
          audioHTML += `<audio id="extra-audio-${idx}" controls src="${getAudioPath(q.extraAudio)}" class="extra-audio" style="display:none"></audio>`;
        }
      });
    }
    getElement("audio-container").innerHTML = audioHTML;
    currentAudioSrc = grp.mainAudio;
    currentAudioElement = document.getElementById("main-audio");
    getElement("audio-container").classList.remove("hidden");
  } else {
    getElement("audio-container").classList.add("hidden");
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
  getElement("question-text").classList.add("hidden");

  let html = "";

  grp.questions.forEach((q, idx) => {
    if (q.passage && !grp.article && !grp.isConnector) {
      html += `<div class="reading-passage">${q.passage.replace(/\n/g, "<br>")}</div>`;
    }

    const globalNum = q.globalNumber;
    const questionIdx = shuffledQuestions.findIndex(
      (sq) => sq.globalNumber === globalNum,
    );
    const isAnswered = answeredQuestions.has(questionIdx);
    const savedAnswer = isAnswered
      ? getAnswerFromHash(currentPartKey, globalNum)
      : null;

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
      let classes = "option";
      if (isAnswered) {
        classes += " disabled";
        if (i === q.correctShuffledIndex) {
          classes += " correct";
        } else if (savedAnswer && letters[i] === savedAnswer) {
          classes += " incorrect";
        }
      }
      html += `<div class="${classes}" data-global="${globalNum}" data-option="${i}" ${isAnswered ? 'style="pointer-events:none"' : ""}>
        <span class="option-letter">${letters[i]}</span><span>${opt}</span>
      </div>`;
    });

    html += `</div>`;

    html += `<div class="group-q-feedback ${isAnswered ? "" : "hidden"}" data-global="${globalNum}">`;
    if (isAnswered && savedAnswer) {
      const isCorrect = letters[q.correctShuffledIndex] === savedAnswer;
      if (isCorrect) {
        html += "¡Correcto!";
      } else {
        html += `Incorrecto. Respuesta correcta: ${letters[q.correctShuffledIndex]}.`;
      }
    }
    html += `</div>`;
    html += `</div>`;
  });

  html += "</div>";
  html += '<div class="preview-submit-container">';
  html +=
    '<button id="preview-confirm-btn" class="btn-submit-review">Confirmar</button>';
  html += "</div>";

  getElement("options-container").innerHTML = html;

  document
    .querySelectorAll(".group-q-options .option:not(.disabled)")
    .forEach((opt) => {
      opt.addEventListener("click", () => {
        const globalNum = parseInt(opt.dataset.global);
        const optIdx = parseInt(opt.dataset.option);
        selectGroupOption(globalNum, optIdx, opt);
      });
    });

  const checkGroupBtn = document.getElementById("check-group-btn");
  if (checkGroupBtn) {
    checkGroupBtn.addEventListener("click", () => {
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

  const contentFormatted = art.content.replace(/\n/g, "<br>");
  html += `<div class="magazine-body">${contentFormatted}</div>`;

  if (art.bio) {
    html += `<p class="magazine-bio">${art.bio}</p>`;
  }

  html += `</div>`;
  return html;
}

// Selecciona una opción en el grupo de preguntas
function selectGroupOption(globalNum, optionIdx, element) {
  const questionIdx = shuffledQuestions.findIndex(
    (q) => q.globalNumber === globalNum,
  );
  if (questionIdx < 0 || answeredQuestions.has(questionIdx)) return;

  const grp = questionGroups[currentGroupIndex];

  document
    .querySelectorAll(`.option[data-global="${globalNum}"]`)
    .forEach((opt) => opt.classList.remove("selected"));
  element.classList.add("selected");

  groupSelectedAnswers[globalNum] = optionIdx;

  // Show the main check button in the controls bar for single questions
  const checkBtn = document.getElementById("check-btn");
  if (checkBtn && grp.questions.length === 1) {
    checkBtn.classList.remove("hidden");
  }

  updatePrevButtonVisibility();
}

// Revisa todo el grupo de preguntas
function checkCurrentGroup() {
  const grp = questionGroups[currentGroupIndex];
  if (!grp || groupChecked) return;

  let allSelected = true;
  grp.questions.forEach((q) => {
    if (groupSelectedAnswers[q.globalNumber] === undefined) {
      allSelected = false;
    }
  });

  if (!allSelected) return;

  groupChecked = true;

  grp.questions.forEach((q) => {
    const questionIdx = shuffledQuestions.findIndex(
      (sq) => sq.globalNumber === q.globalNumber,
    );
    if (questionIdx < 0 || answeredQuestions.has(questionIdx)) return;

    const optIdx = groupSelectedAnswers[q.globalNumber];
    const feedback = document.querySelector(
      `.group-q-feedback[data-global="${q.globalNumber}"]`,
    );
    const options = document.querySelectorAll(
      `.option[data-global="${q.globalNumber}"]`,
    );
    const selectedOpt = document.querySelector(
      `.option[data-global="${q.globalNumber}"][data-option="${optIdx}"]`,
    );

    options.forEach((opt) => {
      opt.classList.add("disabled");
      opt.style.pointerEvents = "none";
    });

    const isCorrect = optIdx === q.correctShuffledIndex;

    if (isCorrect) {
      score[q.category]++;
      selectedOpt.classList.add("correct");
      if (feedback) {
        feedback.className = "group-q-feedback correct";
        feedback.textContent = "¡Correcto!";
      }
    } else {
      selectedOpt.classList.add("incorrect");
      const correctOpt = document.querySelector(
        `.option[data-global="${q.globalNumber}"][data-option="${q.correctShuffledIndex}"]`,
      );
      if (correctOpt) correctOpt.classList.add("correct");
      if (feedback) {
        feedback.className = "group-q-feedback incorrect";
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

// Avanza al siguiente grupo de preguntas (unificado)
function navigateToNextGroup() {
  const sectionParts = SECTION_PARTS[currentSection];
  const hasInputType = sectionParts && sectionParts[0]?.inputType;

  if (hasInputType) {
    // Writing or Speaking - use itemIndex
    if (currentItemIndex < sectionParts.length - 1) {
      const nextPart = getNextPartKey();
      if (nextPart) {
        pauseTimer();
        saveProgress();
        if (hasInputType === "textarea") {
          beginWriting(nextPart.partKey);
        } else if (hasInputType === "audio") {
          beginSpeaking(nextPart.partKey);
        }
        startTimer(currentSection);
      }
    } else {
      goToPreview();
    }
  } else {
    // MC sections - use groupIndex
    if (currentGroupIndex < questionGroups.length - 1) {
      currentGroupIndex++;
      loadGroup();
      saveProgress();
    } else {
      navigateToNextPart();
    }
  }
}

// Regresa al grupo anterior de preguntas (unificado)
function navigateToPrevGroup() {
  const sectionParts = SECTION_PARTS[currentSection];
  const hasInputType = sectionParts && sectionParts[0]?.inputType;

  if (hasInputType) {
    // Writing or Speaking - use itemIndex
    if (currentItemIndex > 0) {
      const prevPart = getPrevPartKey();
      if (prevPart) {
        pauseTimer();
        saveProgress();
        if (hasInputType === "textarea") {
          beginWriting(prevPart.partKey);
        } else if (hasInputType === "audio") {
          beginSpeaking(prevPart.partKey);
        }
        startTimer(currentSection);
      }
    }
    return;
  }

  // MC sections - use groupIndex
  if (currentGroupIndex > 0) {
    currentGroupIndex--;
    loadGroup();
    return;
  }

  const prevPart = getPrevPartKey();
  if (!prevPart) return;

  pauseTimer();
  saveProgress();
  beginMcPart(prevPart.key);
  startTimer(currentSection);
}

// Navega a la parte anterior de la sección (unificado)
function navigateToPrevPart() {
  pauseTimer();
  const prevPart = getPrevPartKey();

  if (!prevPart) {
    return;
  }

  saveProgress();

  const sectionParts = SECTION_PARTS[currentSection];
  const hasInputType = sectionParts && sectionParts[0]?.inputType;

  if (hasInputType) {
    // Writing or Speaking
    if (hasInputType === "textarea") {
      beginWriting(prevPart.partKey);
    } else if (hasInputType === "audio") {
      beginSpeaking(prevPart.partKey);
    }
  } else {
    // MC sections
    beginMcPart(prevPart.key);
  }
  startTimer(currentSection);
}

// Configura los eventos del área de texto (universal para textarea inputType)
function setupTextareaEvents() {
  const textarea = document.getElementById("writing-textarea");
  const counter = document.getElementById("char-count");
  const counterContainer = document.querySelector(".char-counter");

  if (!textarea) return;

  const sectionParts = SECTION_PARTS[currentSection];
  const currentItem = sectionParts ? sectionParts[currentItemIndex] : null;
  const isEssay = currentItem ? currentItem.isEssay : false;
  const limit = isEssay ? TASK2_CHAR_LIMIT : TASK1_CHAR_LIMIT;

  textarea.addEventListener("input", function () {
    const count = this.value.length;
    if (counter) counter.textContent = count;
    if (counterContainer)
      counterContainer.classList.toggle("visible", count > limit * 0.9);
  });

  textarea.focus();
}

// Obtiene el nombre de la siguiente parte de forma universal
function getNextPartName() {
  const sectionParts = SECTION_PARTS[currentSection];
  if (!sectionParts) return null;

  const sectionType = getSectionType(currentPartKey);

  if (sectionType === "textarea" || sectionType === "audio") {
    // For Writing/Speaking (uses currentItemIndex)
    if (currentItemIndex < sectionParts.length - 1) {
      return sectionParts[currentItemIndex + 1].partLabel;
    }
  } else {
    // For MC sections (uses currentPartKey)
    const currentPart = sectionParts.find((p) => p.key === currentPartKey);
    if (!currentPart) return null;

    const currentIndex = sectionParts.indexOf(currentPart);
    if (currentIndex < sectionParts.length - 1) {
      return sectionParts[currentIndex + 1].name;
    }
  }
  return "Preview";
}

// Actualiza qué botones se ven (Anterior, Siguiente, etc.) - unificado
function updatePrevButtonVisibility() {
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const submitBtn = document.getElementById("submit-section-btn");
  const skipBtn = document.getElementById("skip-btn");
  const checkBtn = document.getElementById("check-btn");
  const controlsSecondary = document.getElementById("controls-secondary");

  // Reset all buttons
  if (prevBtn) prevBtn.classList.remove("hidden");
  if (nextBtn) {
    nextBtn.classList.remove("hidden");
    nextBtn.textContent = "Siguiente";
    nextBtn.classList.remove("btn-primary");
    nextBtn.classList.add("btn-secondary");
  }
  if (submitBtn) submitBtn.classList.add("hidden");
  if (skipBtn) skipBtn.classList.add("hidden");
  if (checkBtn) checkBtn.classList.add("hidden");
  if (controlsSecondary) controlsSecondary.classList.add("hidden");

  if (!currentSection) return;

  // PREVIEW MODE - only Confirm button
  if (sectionPreviewMode) {
    if (prevBtn) prevBtn.classList.add("hidden");
    if (nextBtn) nextBtn.classList.add("hidden");
    if (submitBtn) {
      submitBtn.classList.remove("hidden");
      submitBtn.textContent = "Confirmar";
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
    prevBtn.classList.toggle("hidden", isFirst);
  }

  // Determine if current section uses inputType (Writing/Speaking) or MC
  const sectionParts = SECTION_PARTS[currentSection];
  const hasInputType = sectionParts && sectionParts[0]?.inputType;

  if (hasInputType) {
    // For Writing (textarea) and Speaking (audio)
    // NEXT/FINISH button
    if (nextBtn) {
      if (isLastQ) {
        nextBtn.textContent = "Finalizar sección";
        nextBtn.classList.remove("btn-secondary");
        nextBtn.classList.add("btn-primary");
      }
    }

    // SKIP TO button
    if (skipBtn && !isLastQ) {
      skipBtn.classList.remove("hidden");
      const targetName = getNextPartName();
      skipBtn.textContent = targetName
        ? `Skip to ${targetName}`
        : "Skip to Preview";
      if (isLastPart) {
        skipBtn.classList.remove("btn-secondary");
        skipBtn.classList.add("btn-primary");
      }
    }
  } else {
    // MC sections (LISTENING, READING_AND_GRAMMAR)
    const grp = questionGroups[currentGroupIndex];
    const allChecked =
      grp &&
      grp.questions.every((q) => {
        const qi = shuffledQuestions.findIndex(
          (sq) => sq.globalNumber === q.globalNumber,
        );
        return answeredQuestions.has(qi);
      });

    // NEXT/FINISH button - only show when group is checked
    if (nextBtn) {
      if (allChecked) {
        nextBtn.classList.remove("hidden");
        if (isLastQ) {
          nextBtn.textContent = "Finalizar sección";
          nextBtn.classList.remove("btn-secondary");
          nextBtn.classList.add("btn-primary");
        }
      } else {
        nextBtn.classList.add("hidden");
      }
    }

    // CHECK button - show when at least one option selected but not all answered
    if (checkBtn && grp) {
      const anySelected = grp.questions.some(
        (q) => groupSelectedAnswers[q.globalNumber] !== undefined,
      );
      if (anySelected && !allChecked) {
        checkBtn.classList.remove("hidden");
      }
    }

    // SKIP TO button
    if (skipBtn && !isLastQ) {
      skipBtn.classList.remove("hidden");
      const targetName = nextPart
        ? `Skip to ${nextPart.name}`
        : "Skip to Preview";
      skipBtn.textContent = targetName;
      if (isLastPart) {
        skipBtn.classList.remove("btn-secondary");
        skipBtn.classList.add("btn-primary");
      }
    }
  }
}

// Variables para la sección de Speaking
let speakingPart = null;
// Índice de la tarea actual
let speakingtaskIndex = 0;
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
const SPEAKING_DB_NAME = "SpeakingAudioDB";
const SPEAKING_DB_VERSION = 1;
const SPEAKING_STORE_NAME = "audioResponses";

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
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(SPEAKING_STORE_NAME)) {
        db.createObjectStore(SPEAKING_STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = (event) => {
      speakingDB = event.target.result;
      resolve(speakingDB);
    };
    request.onerror = (event) => reject(event.target.error);
  });
}

// Guarda un audio de Speaking en la base de datos
function saveSpeakingAudio(taskIndex, blob, duration) {
  return openSpeakingDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SPEAKING_STORE_NAME, "readwrite");
      const store = tx.objectStore(SPEAKING_STORE_NAME);
      const record = {
        id: `speaking_task_${taskIndex}`,
        taskIndex,
        blob,
        duration,
        timestamp: Date.now(),
      };
      store.put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = (event) => reject(event.target.error);
    });
  });
}

// Obtiene un audio guardado de Speaking
function getSpeakingAudio(taskIndex) {
  return openSpeakingDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SPEAKING_STORE_NAME, "readonly");
      const store = tx.objectStore(SPEAKING_STORE_NAME);
      const request = store.get(`speaking_task_${taskIndex}`);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = (event) => reject(event.target.error);
    });
  });
}

// Obtiene todos los audios de Speaking guardados
function getAllSpeakingAudio() {
  return openSpeakingDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SPEAKING_STORE_NAME, "readonly");
      const store = tx.objectStore(SPEAKING_STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = (event) => reject(event.target.error);
    });
  });
}

// Borra todos los audios de Speaking
function clearSpeakingDB() {
  return openSpeakingDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SPEAKING_STORE_NAME, "readwrite");
      const store = tx.objectStore(SPEAKING_STORE_NAME);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = (event) => reject(event.target.error);
    });
  });
}

// Inicia una sección con inputType audio (ej: Speaking)
function beginSpeaking(partKey, saved = null) {
  stopSpeakingMic();

  const config = SECTION_CONFIG[partKey];
  if (!config || !config.partId) return false;

  const sectionData = quizData[currentSection];
  const partData = sectionData?.parts?.find((p) => p.id === config.partId);
  if (!partData) return false;

  speakingPart = partData;
  const hasSavedProgress = saved && saved.currentPartKey === partKey;
  speakingtaskIndex = hasSavedProgress ? saved.speakingtaskIndex || 0 : 0;
  speakingResponses = hasSavedProgress ? saved.speakingResponses || [] : [];

  currentPartKey = partKey;

  getElement("category-select").classList.add("hidden");
  getElement("quiz-view").classList.remove("hidden");
  getElement("results-container").classList.add("hidden");

  setupInstructionsPanel();
  logActivity("INICIO", `${currentSection} Part ${config.partId}`);

  getAllSpeakingAudio()
    .then((records) => {
      records.forEach((record) => {
        if (
          record.taskIndex >= 0 &&
          record.taskIndex < speakingPart.tasks.length
        ) {
          speakingResponses[record.taskIndex] = {
            blob: record.blob,
            duration: record.duration,
            timestamp: record.timestamp,
          };
        }
      });
      // Find correct itemIndex for renderStep
      const sectionParts = SECTION_PARTS[currentSection];
      const itemIndex = sectionParts.findIndex(
        (item) => item.partKey === currentPartKey,
      );
      renderStep(
        currentSection,
        itemIndex >= 0 ? itemIndex : 0,
        speakingPart,
        "audio",
      );
    })
    .catch(() => {
      const sectionParts = SECTION_PARTS[currentSection];
      const itemIndex = sectionParts.findIndex(
        (item) => item.partKey === currentPartKey,
      );
      renderStep(
        currentSection,
        itemIndex >= 0 ? itemIndex : 0,
        speakingPart,
        "audio",
      );
    });

  updatePrevButtonVisibility();
  startTimer(currentSection);
  return true;
}

// Dibuja la tarea actual de Speaking
// Empieza a grabar la respuesta de Speaking

// Navigate to preview using universal renderPreview
function goToPreview() {
  sectionPreviewMode = true;
  const sectionParts = SECTION_PARTS[currentSection];
  const sectionType = getSectionType(currentPartKey);
  renderPreview(currentSection, sectionParts, sectionType || "mc");
}

// Universal preview renderer (unificado)
function renderPreview(section, items, inputType) {
  const container = getElement("quiz-container");
  container.innerHTML = "";
  container.classList.remove("fade-out");
  void container.offsetWidth;
  container.classList.add("fade-out");
  setTimeout(() => {
    container.classList.remove("fade-out");
    container.style.animation = "none";
    void container.offsetWidth;
    container.style.animation = "fadeIn 0.5s ease";
  }, 300);

  getElement("question-text").classList.add("hidden");
  getElement("options-container").innerHTML = "";
  getElement("audio-container").classList.add("hidden");
  getElement("transcription-toggle").classList.add("hidden");
  getElement("transcription-text").classList.add("hidden");
  getElement("reading-text").classList.add("hidden");
  getElement("feedback-container").classList.add("hidden");

  let html = '<div class="preview-scroll-container">';
  html += `<h3>Preview - ${SECTION_DISPLAY[section] || section}</h3>`;

  const saved = loadProgress();

  if (inputType === "textarea") {
    // Writing preview
    items.forEach((item, idx) => {
      const response = sectionResponses[item.itemNum - 1];
      const hasResponse = response && response.length > 0;
      html += '<div class="preview-slide">';
      html += `<div class="preview-slide-header">${item.partLabel} - Question ${item.itemNum}</div>`;
      if (item.isEssay) {
        const group = currentGroup;
        if (group && group.task2) {
          html += `<div class="preview-question"><strong>Topic:</strong> ${group.task2.topic}</div>`;
        }
      }
      html += `<div class="preview-q-answer ${hasResponse ? "answered" : "unanswered"}">`;
      html += hasResponse
        ? response.substring(0, 200) + (response.length > 200 ? "..." : "")
        : "Not answered";
      html += "</div></div>";
    });
  } else if (inputType === "audio") {
    // Speaking preview
    items.forEach((item, idx) => {
      const response = speakingResponses[item.itemNum - 1];
      const hasResponse = response && response.blob;
      html += '<div class="preview-slide">';
      html += `<div class="preview-slide-header">${item.partLabel} - Task ${item.itemNum}</div>`;
      html += `<div class="preview-q-answer ${hasResponse ? "answered" : "unanswered"}">`;
      if (hasResponse) {
        html += `<button class="btn-preview-playback" onclick="playSpeakingPreview(${item.itemNum - 1})">Play recording (${response.duration}s)</button>`;
      } else {
        html += "Not answered";
      }
      html += "</div></div>";
    });
  } else {
    // MC sections
    items.forEach((part) => {
      const partProgress = getPartProgress(part.key, saved);
      html += '<div class="preview-slide">';
      html += `<div class="preview-slide-header">${part.name}</div>`;
      html += `<div class="preview-summary">${partProgress.answered}/${partProgress.total} answered (${partProgress.percent}%)</div>`;
      html += "</div>";
    });
  }

  html += "</div>";
  html += '<div class="preview-submit-container">';
  html +=
    '<button id="preview-confirm-btn" class="btn-submit-preview">Confirmar</button>';
  html += "</div>";

  container.innerHTML = html;

  const confirmBtn = getElement("preview-confirm-btn");
  if (confirmBtn) {
    confirmBtn.onclick = () => showResults();
  }

  updatePrevButtonVisibility();
}

// Play speaking preview audio
function playSpeakingPreview(taskIndex) {
  const response = speakingResponses[taskIndex];
  if (response && response.blob) {
    const audio = new Audio(URL.createObjectURL(response.blob));
    audio.play();
  }
}

// Show final results (unificado)
function showResults() {
  getElement("quiz-view").classList.add("hidden");
  getElement("results-container").classList.remove("hidden");
  getElement("category-select").classList.add("hidden");

  const saved = loadProgress();

  // Calculate total score (total correct answers / total questions)
  const totalScore = Object.values(score).reduce((a, b) => a + b, 0);

  // Calculate totalParts dynamically using SECTION_PARTS and quiz data
  let totalParts = 0;

  // MC sections: count questions from data
  if (quizData.LISTENING) {
    totalParts += quizData.LISTENING.parts
      ? quizData.LISTENING.parts.reduce(
          (sum, p) => sum + (p.questions ? p.questions.length : 0),
          0,
        )
      : 0;
  }
  if (quizData.READING_AND_GRAMMAR) {
    totalParts += quizData.READING_AND_GRAMMAR.parts
      ? quizData.READING_AND_GRAMMAR.parts.reduce(
          (sum, p) => sum + (p.questions ? p.questions.length : 0),
          0,
        )
      : 0;
  }

  // Writing: count items from SECTION_PARTS
  if (SECTION_PARTS.WRITING) {
    totalParts += SECTION_PARTS.WRITING.length;
  }

  // Speaking: count items from SECTION_PARTS
  if (SECTION_PARTS.SPEAKING) {
    totalParts += SECTION_PARTS.SPEAKING.length;
  }

  const percentage =
    totalParts > 0 ? Math.round((totalScore / totalParts) * 100) : 0;

  getElement("score-display").textContent =
    `${percentage}% (${totalScore}/${totalParts})`;

  // Render breakdown with section-specific display
  let html = "";
  const sections = ["WRITING", "LISTENING", "READING_AND_GRAMMAR", "SPEAKING"];
  sections.forEach((sec) => {
    html += '<div class="result-category">';
    html += `<span class="result-category-name">${SECTION_DISPLAY[sec]}</span>`;

    // Section-specific score display using getPartProgress
    if (sec === "WRITING" || sec === "SPEAKING") {
      // For Writing/Speaking, show completed/total from SECTION_PARTS
      const sectionParts = SECTION_PARTS[sec];
      const total = sectionParts ? sectionParts.length : 0;

      // Get responses from the correct source
      let responses = [];
      if (sec === "WRITING") {
        // Writing uses sectionResponses (saved as writingResponses in progress)
        responses = saved?.writingResponses || sectionResponses || [];
      } else {
        // Speaking uses speakingResponses
        responses = saved?.speakingResponses || speakingResponses || [];
      }

      const completed = sectionParts
        ? sectionParts.filter((item) => {
            const response = responses[item.itemNum - 1];
            if (!response) return false;
            if (item.inputType === "textarea") {
              return typeof response === "string" && response.length > 0;
            } else if (item.inputType === "audio") {
              return response !== null && response !== undefined;
            }
            return false;
          }).length
        : 0;

      html += `<span class="result-category-score">${completed}/${total}</span>`;
    } else {
      // MC sections - show correct answers
      html += `<span class="result-category-score">${score[sec]}</span>`;
    }

    html += "</div>";
  });
  getElement("results-breakdown").innerHTML = html;

  logActivity("RESULTS", `Final score: ${percentage}%`);

  stopTimer();
}

// Check if first question/step of section (unificado)
function isFirstQuestionOfSection() {
  const sectionParts = SECTION_PARTS[currentSection];
  const hasInputType = sectionParts && sectionParts[0]?.inputType;

  if (hasInputType) {
    // Writing or Speaking (uses currentItemIndex)
    return currentItemIndex === 0;
  } else {
    // MC sections (uses currentGroupIndex)
    return currentGroupIndex === 0;
  }
}

// Check if last question/step of section (unificado)
function isLastQuestionOfSection() {
  const sectionParts = SECTION_PARTS[currentSection];
  const hasInputType = sectionParts && sectionParts[0]?.inputType;

  if (hasInputType) {
    // Writing or Speaking (uses currentItemIndex)
    return currentItemIndex >= sectionParts.length - 1;
  } else {
    // MC sections (uses currentGroupIndex)
    return currentGroupIndex >= questionGroups.length - 1;
  }
}

// Check if last part of section (unificado)
function isLastPartOfSection() {
  const sectionParts = SECTION_PARTS[currentSection];
  if (!sectionParts) return true;

  const hasInputType = sectionParts[0]?.inputType;
  const currentIndex = hasInputType ? currentItemIndex : currentGroupIndex;

  const currentPart = sectionParts[currentIndex];
  if (!currentPart) return true;

  const lastPart = sectionParts[sectionParts.length - 1];
  return currentPart.partKey === lastPart.partKey;
}

// Get next part key (unificado)
function getNextPartKey() {
  const sectionParts = SECTION_PARTS[currentSection];
  if (!sectionParts) return null;

  const hasInputType = sectionParts[0]?.inputType;

  if (hasInputType) {
    // Writing or Speaking (uses currentItemIndex)
    return currentItemIndex < sectionParts.length - 1
      ? sectionParts[currentItemIndex + 1]
      : null;
  } else {
    // MC sections (uses currentPartKey)
    const currentPart = sectionParts.find((p) => p.key === currentPartKey);
    if (!currentPart) return null;
    const currentIndex = sectionParts.indexOf(currentPart);
    return currentIndex < sectionParts.length - 1
      ? sectionParts[currentIndex + 1]
      : null;
  }
}

// Navigate to next part (unificado)
function navigateToNextPart() {
  pauseTimer();
  saveProgress();

  const nextPart = getNextPartKey();
  if (!nextPart) {
    goToPreview();
    return;
  }

  const sectionParts = SECTION_PARTS[currentSection];
  const hasInputType = sectionParts && sectionParts[0]?.inputType;

  if (hasInputType) {
    // Writing or Speaking
    if (hasInputType === "textarea") {
      beginWriting(nextPart.partKey);
    } else if (hasInputType === "audio") {
      beginSpeaking(nextPart.partKey);
    }
  } else {
    // MC sections
    beginMcPart(nextPart.key);
  }
  startTimer(currentSection);
}

// Get previous part key (unificado)
function getPrevPartKey() {
  const sectionParts = SECTION_PARTS[currentSection];
  if (!sectionParts) return null;

  const hasInputType = sectionParts[0]?.inputType;

  if (hasInputType) {
    // Writing or Speaking (uses currentItemIndex)
    return currentItemIndex > 0 ? sectionParts[currentItemIndex - 1] : null;
  } else {
    // MC sections (uses currentPartKey)
    const currentPart = sectionParts.find((p) => p.key === currentPartKey);
    if (!currentPart) return null;
    const currentIndex = sectionParts.indexOf(currentPart);
    return currentIndex > 0 ? sectionParts[currentIndex - 1] : null;
  }
}

// Navigate to a specific part
function navigateToPart(partKey) {
  pauseTimer();
  saveProgress();

  const sectionParts = SECTION_PARTS[currentSection];
  const hasInputType = sectionParts && sectionParts[0]?.inputType;

  if (hasInputType === "textarea") {
    beginWriting(partKey);
  } else if (hasInputType === "audio") {
    beginSpeaking(partKey);
  } else {
    beginMcPart(partKey);
  }
}

// Stop speaking microphone
function stopSpeakingMic() {
  if (speakingMediaRecorder && speakingMediaRecorder.state !== "inactive") {
    speakingMediaRecorder.stop();
  }
  if (speakingStream) {
    speakingStream.getTracks().forEach((track) => track.stop());
    speakingStream = null;
  }
  if (speakingAnimationId) {
    cancelAnimationFrame(speakingAnimationId);
    speakingAnimationId = null;
  }
}

// Setup all navigation event listeners
function setupEventListeners() {
  // Home button - render home screen directly
  document.getElementById("home-btn")?.addEventListener("click", () => {
    window.location.hash = "/";
    renderCategorySelect();
  });

  // Next button
  document.getElementById("next-btn")?.addEventListener("click", () => {
    if (sectionPreviewMode) return;
    const sectionParts = SECTION_PARTS[currentSection];
    const hasInputType = sectionParts && sectionParts[0]?.inputType;
    if (hasInputType) {
      navigateToNextPart();
    } else {
      navigateToNextGroup();
    }
  });

  // Previous button
  document.getElementById("prev-btn")?.addEventListener("click", () => {
    navigateToPrevGroup();
  });

  // Skip button
  document.getElementById("skip-btn")?.addEventListener("click", () => {
    navigateToNextPart();
  });

  // Check button (MC groups)
  document.getElementById("check-btn")?.addEventListener("click", () => {
    checkCurrentGroup();
  });

  // Submit/Confirm button (preview)
  document
    .getElementById("submit-section-btn")
    ?.addEventListener("click", () => {
      showResults();
    });

  // Reset all progress button (home)
  document.getElementById("reset-all-btn")?.addEventListener("click", () => {
    resetAllProgress();
  });

  // Reset section progress button (quiz)
  document.getElementById("reset-btn")?.addEventListener("click", () => {
    resetSectionProgress();
  });

  // Help buttons
  document.getElementById("help-btn-home")?.addEventListener("click", () => {
    showHelpModal();
  });
  document.getElementById("help-btn-quiz")?.addEventListener("click", () => {
    showHelpModal();
  });

  // Registration form
  document
    .getElementById("registration-form")
    ?.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("reg-name").value.trim();
      const emailUser = document
        .getElementById("reg-email-username")
        .value.trim();
      const emailDomain = document
        .getElementById("reg-email-domain")
        .value.trim();
      const email = `${emailUser}@${emailDomain}`;
      if (!isValidName(name) || !email.includes("@")) {
        alert("Please enter a valid name and email.");
        return;
      }
      const user = { name, email };
      saveUser(user);
      hideRegistrationModal();
      if (pendingSection) {
        beginQuiz(pendingSection);
        pendingSection = null;
      }
    });

  // Registration cancel
  document.getElementById("reg-cancel")?.addEventListener("click", () => {
    hideRegistrationModal();
    pendingSection = null;
  });

  // Change user form
  document
    .getElementById("change-user-form")
    ?.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("change-name").value.trim();
      const emailUser = document
        .getElementById("change-email-username")
        .value.trim();
      const emailDomain = document
        .getElementById("change-email-domain")
        .value.trim();
      const email = `${emailUser}@${emailDomain}`;
      if (!isValidName(name) || !email.includes("@")) {
        alert("Please enter a valid name and email.");
        return;
      }
      const user = { name, email };
      saveUser(user);
      hideChangeUserModal();
    });

  // User name click to change user
  document.getElementById("user-name")?.addEventListener("click", () => {
    showChangeUserModal();
  });

  // Help form
  document.getElementById("help-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = document.getElementById("help-text").value.trim();
    if (!text) return;
    logActivity("HELP", text.substring(0, 100));
    alert("Thank you! We will respond soon.");
    hideHelpModal();
  });

  // Help cancel
  document.getElementById("help-cancel")?.addEventListener("click", () => {
    hideHelpModal();
  });

  // Time modal buttons
  document.getElementById("time-home-btn")?.addEventListener("click", () => {
    hideTimeModal();
    window.location.hash = "/";
  });
  document.getElementById("time-preview-btn")?.addEventListener("click", () => {
    hideTimeModal();
    goToPreview();
  });

  // Back modal buttons
  document.getElementById("back-home-btn")?.addEventListener("click", () => {
    document.getElementById("back-modal").classList.add("hidden");
    window.location.hash = "/";
  });
  document.getElementById("back-prev-btn")?.addEventListener("click", () => {
    document.getElementById("back-modal").classList.add("hidden");
    navigateToPrevGroup();
  });
  document.getElementById("back-cancel")?.addEventListener("click", () => {
    document.getElementById("back-modal").classList.add("hidden");
  });

  // Results buttons
  document.getElementById("results-home-btn")?.addEventListener("click", () => {
    window.location.hash = "/";
  });
  document.getElementById("email-btn")?.addEventListener("click", () => {
    const subject = "MET Quiz Results";
    const body = `Results: ${document.getElementById("score-display")?.textContent || ""}`;
    window.location.href = `mailto:${currentUser?.email || ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}
