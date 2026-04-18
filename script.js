const quizData = {
  WRITING: null,
  LISTENING: [],
  READING_AND_GRAMMAR: [],
  SPEAKING: []
};

let questions = [];
let currentQuestionIndex = 0;
let selectedOptionIndex = null;
let score = { WRITING: 0, LISTENING: 0, READING_AND_GRAMMAR: 0, SPEAKING: 0 };
let answeredQuestions = new Set();
let shuffledQuestions = [];
let currentSection = null;

let currentUser = null;
let pendingSection = null;

let writingGroup = null;
let writingResponses = [];
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

function updateUserDisplay() {
  if (currentUser) {
    getElement('user-info').classList.remove('hidden');
    const displayName = currentUser.name.length > 12 ? currentUser.name.substring(0, 12) + '...' : currentUser.name;
    getElement('user-name').textContent = displayName;
    getElement('quiz-user-name').textContent = displayName;
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
  if (!currentUser || !writingGroup) return;
  
  const data = {
    timestamp: new Date().toISOString(),
    name: currentUser.name,
    email: currentUser.email,
    category: 'WRITING',
    action: 'RESPUESTA',
    detail: JSON.stringify({
      groupId: writingGroup.id,
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
    btn.innerHTML = `<strong>${sec.key.replace('_', ' ')}</strong><span>${label}</span>`;
    
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

  if (section === 'WRITING') {
    writingGroup = shuffleArray([...quizData.WRITING.groups])[0];
    writingResponses = [];
    currentWritingStep = WRITING_STEPS.TASK1_Q1;
    currentPreviewIndex = 0;
    
    getElement('category-select').classList.add('hidden');
    getElement('quiz-view').classList.remove('hidden');
    getElement('results-container').classList.add('hidden');
    
    setupInstructionsPanel();
    logActivity('INICIO', `WRITING - Grupo: ${writingGroup.id}`);
    renderWritingStep();
    updatePrevButtonVisibility();
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
  saveProgress();
}

function setupInstructionsPanel() {
  const contentEl = getElement('instructions-content');
  const contentPara = contentEl.querySelector('p');
  if (contentPara && quizData.WRITING) {
    contentPara.innerHTML = quizData.WRITING.instructions.replace(/\n/g, '<br>');
    getElement('section-instructions-panel').classList.remove('hidden');
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
    case WRITING_STEPS.TASK1_Q2:
    case WRITING_STEPS.TASK1_Q3:
      const qIndex = currentWritingStep - 1;
      html = renderWritingTask1(qIndex);
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

  if (currentWritingStep === WRITING_STEPS.PREVIEW) {
    getElement('controls').classList.remove('hidden');
    getElement('check-btn').classList.add('hidden');
    getElement('next-btn').classList.add('hidden');
    getElement('restart-btn').classList.remove('hidden');
    getElement('restart-btn').textContent = 'Enviar';
    setupCarouselEvents();
  } else {
    getElement('controls').classList.remove('hidden');
    getElement('check-btn').classList.add('hidden');
    getElement('next-btn').classList.remove('hidden');
    getElement('next-btn').textContent = 'Siguiente';
    getElement('restart-btn').classList.add('hidden');
  }
}

function renderWritingTask1(qIndex) {
  const question = writingGroup.task1[qIndex];
  const existingResponse = writingResponses[qIndex] || '';
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
  const task2 = writingGroup.task2;
  const existingResponse = writingResponses[3] || '';
  const charCount = existingResponse.length;
  const showCounter = charCount > TASK2_CHAR_LIMIT * 0.9;
  
  return `
    <div class="writing-question">
      <p class="writing-question-text">${task2.topic}</p>
      <p class="writing-task-prompt">${task2.prompt}</p>
      <textarea 
        id="writing-textarea" 
        class="writing-textarea writing-textarea-large"
        placeholder="Escribe tu ensayo aquí..."
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
  const task1 = writingGroup.task1;
  const task2 = writingGroup.task2;
  
  const slides = [
    {
      title: `Task 1: Pregunta 1 de 3`,
      question: task1[0].text,
      response: writingResponses[0] || 'Sin respuesta'
    },
    {
      title: `Task 1: Pregunta 2 de 3`,
      question: task1[1].text,
      response: writingResponses[1] || 'Sin respuesta'
    },
    {
      title: `Task 1: Pregunta 3 de 3`,
      question: task1[2].text,
      response: writingResponses[2] || 'Sin respuesta'
    },
    {
      title: `Task 2: Ensayo`,
      question: `${task2.topic}\n\n${task2.prompt}`,
      response: writingResponses[3] || 'Sin respuesta'
    }
  ];

  const slide = slides[currentPreviewIndex];
  
  return `
    <div class="carousel-container">
      <h3 class="carousel-title">Revisa tus respuestas</h3>
      <div class="carousel-slide">
        <div class="slide-header">${slide.title}</div>
        <div class="slide-question">${slide.question.replace(/\n/g, '<br>')}</div>
        <div class="slide-response">${slide.response.replace(/\n/g, '<br>')}</div>
      </div>
      <div class="carousel-nav">
        <button id="carousel-prev" class="carousel-btn">◀</button>
        <span class="carousel-indicators">
          ${slides.map((_, i) => `<span class="indicator ${i === currentPreviewIndex ? 'active' : ''}" data-index="${i}"></span>`).join('')}
        </span>
        <button id="carousel-next" class="carousel-btn">▶</button>
      </div>
      <button id="edit-response-btn" class="btn btn-edit">Editar esta respuesta</button>
      <div class="carousel-hint">Usa las flechas ← → o las teclas A/D para navegar</div>
    </div>
  `;
}

function setupCarouselEvents() {
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');
  const editBtn = document.getElementById('edit-response-btn');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => navigateCarousel(-1));
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => navigateCarousel(1));
  }
  if (editBtn) {
    editBtn.addEventListener('click', editCurrentResponse);
  }

  document.addEventListener('keydown', handleCarouselKeydown);
}

function editCurrentResponse() {
  document.removeEventListener('keydown', handleCarouselKeydown);
  
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
}

function updatePrevButtonVisibility() {
  const prevBtn = getElement('prev-btn');
  
  if (currentSection === 'WRITING') {
    prevBtn.classList.toggle('hidden', currentWritingStep === WRITING_STEPS.TASK1_Q1);
  } else {
    prevBtn.classList.toggle('hidden', currentQuestionIndex === 0);
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
  
  const slideContainer = document.querySelector('.carousel-slide');
  const indicators = document.querySelectorAll('.indicator');
  const titleEl = document.querySelector('.carousel-title');
  
  if (slideContainer) {
    const task1 = writingGroup.task1;
    const task2 = writingGroup.task2;
    
    const slides = [
      { title: `Task 1: Pregunta 1 de 3`, question: task1[0].text, response: writingResponses[0] || 'Sin respuesta' },
      { title: `Task 1: Pregunta 2 de 3`, question: task1[1].text, response: writingResponses[1] || 'Sin respuesta' },
      { title: `Task 1: Pregunta 3 de 3`, question: task1[2].text, response: writingResponses[2] || 'Sin respuesta' },
      { title: `Task 2: Ensayo`, question: `${task2.topic}\n\n${task2.prompt}`, response: writingResponses[3] || 'Sin respuesta' }
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

function nextWritingStep() {
  if (currentWritingStep === WRITING_STEPS.INSTRUCTIONS) {
    currentWritingStep = WRITING_STEPS.TASK1_Q1;
    renderWritingStep();
    return;
  }

  if (currentWritingStep >= WRITING_STEPS.TASK1_Q1 && currentWritingStep <= WRITING_STEPS.TASK1_Q3) {
    const textarea = document.getElementById('writing-textarea');
    const responseIndex = currentWritingStep - 1;
    writingResponses[responseIndex] = textarea ? textarea.value : '';
    
    logWritingResponse(responseIndex + 1, 1, writingResponses[responseIndex]);
    
    if (currentWritingStep < WRITING_STEPS.TASK1_Q3) {
      currentWritingStep++;
    } else {
      currentWritingStep = WRITING_STEPS.TASK2;
    }
    renderWritingStep();
    return;
  }

  if (currentWritingStep === WRITING_STEPS.TASK2) {
    const textarea = document.getElementById('writing-textarea');
    writingResponses[3] = textarea ? textarea.value : '';
    logWritingResponse(1, 2, writingResponses[3]);
    currentWritingStep = WRITING_STEPS.PREVIEW;
    renderWritingStep();
    return;
  }
}

async function submitWritingResponses() {
  logActivity('FIN', `WRITING - Grupo: ${writingGroup.id} - Completado`);
  
  for (let i = 0; i < writingResponses.length; i++) {
    await logWritingResponse(i < 3 ? i + 1 : 1, i < 3 ? 1 : 2, writingResponses[i]);
  }

  showWritingResults();
}

function showWritingResults() {
  getElement('quiz-view').classList.add('hidden');
  getElement('results-container').classList.remove('hidden');

  getElement('score-display').textContent = '¡Completado!';
  
  const breakdown = getElement('results-breakdown');
  breakdown.innerHTML = `
    <div class="result-category">
      <span class="result-category-name">WRITING</span>
      <span class="result-category-score">Grupo ${writingGroup.id}</span>
    </div>
    <p style="color: #888; font-size: 0.9rem; margin-top: 15px;">
      Tus respuestas han sido guardadas exitosamente.
    </p>
  `;

  getElement('email-btn').classList.add('hidden');
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

  getElement('check-btn').classList.add('hidden');
  getElement('next-btn').classList.remove('hidden');
  getElement('restart-btn').classList.remove('hidden');

  saveProgress();
}

function nextQuestion() {
  if (currentSection === 'WRITING') {
    nextWritingStep();
    return;
  }

  currentQuestionIndex++;

  if (currentQuestionIndex >= shuffledQuestions.length) {
    showResults();
  } else {
    loadQuestion();
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
    }
    return;
  }

  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    loadQuestion();
  }
}

function restartQuestion() {
  if (currentSection === 'WRITING') {
    if (currentWritingStep === WRITING_STEPS.PREVIEW) {
      submitWritingResponses();
    }
    return;
  }
  loadQuestion();
}

function showResults() {
  getElement('quiz-view').classList.add('hidden');
  getElement('results-container').classList.remove('hidden');

  const totalScore = Object.values(score).reduce((a, b) => a + b, 0);
  const totalQuestions = shuffledQuestions.length;
  const percentage = Math.round((totalScore / totalQuestions) * 100);

  getElement('score-display').textContent = `${percentage}% (${totalScore}/${totalQuestions})`;

  const breakdown = getElement('results-breakdown');
  breakdown.innerHTML = '';

  const categories = ['GRAMMAR', 'READING', 'LISTENING'];
  categories.forEach(cat => {
    if (quizData[cat] && quizData[cat].length > 0) {
      const count = flattenQuestions(cat, quizData[cat]).length;
      if (count > 0) {
        const div = document.createElement('div');
        div.className = 'result-category';
        div.innerHTML = `
          <span class="result-category-name">${cat}</span>
          <span class="result-category-score">${score[cat]}/${count}</span>
        `;
        breakdown.appendChild(div);
      }
    }
  });

  logActivity('FIN', `Resultado: ${percentage}% (${totalScore}/${totalQuestions})`);
  clearProgress();
}

function sendEmail() {
  const totalScore = Object.values(score).reduce((a, b) => a + b, 0);
  const totalQuestions = shuffledQuestions.length;
  const percentage = Math.round((totalScore / totalQuestions) * 100);

  const subject = encodeURIComponent('Resultados MET Quiz - Your English World');
  const body = encodeURIComponent(`
Resultados del Test MET
=======================
Puntuación Total: ${percentage}% (${totalScore}/${totalQuestions})

Desglose por categoría:
- GRAMMAR: ${score.GRAMMAR}/${quizData.GRAMMAR.length}
- READING: ${score.READING}/${flattenQuestions('READING', quizData.READING).length}
- LISTENING: ${score.LISTENING}/${flattenQuestions('LISTENING', quizData.LISTENING).length}

---
Enviado desde Your English World Quiz
  `);

  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

function restartTest() {
  clearProgress();
  currentQuestionIndex = 0;
  selectedOptionIndex = null;
  score = { GRAMMAR: 0, READING: 0, LISTENING: 0, WRITING: 0, SPEAKING: 0 };
  answeredQuestions.clear();
  shuffledQuestions = [];
  currentSection = null;
  currentExerciseIndex = 0;
  currentAudioSrc = null;
  currentAudioElement = null;
  writingGroup = null;
  writingResponses = [];
  currentWritingStep = 0;
  currentPreviewIndex = 0;

  getElement('email-btn').classList.remove('hidden');
  getElement('results-container').classList.add('hidden');
  renderCategorySelect();
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
    }
  }
}

function initEventListeners() {
  getElement('check-btn').addEventListener('click', checkAnswer);
  getElement('next-btn').addEventListener('click', nextQuestion);
  getElement('prev-btn').addEventListener('click', previousQuestion);
  getElement('restart-btn').addEventListener('click', restartQuestion);
  getElement('email-btn').addEventListener('click', sendEmail);
  getElement('restart-test-btn').addEventListener('click', restartTest);
  getElement('continue-btn').addEventListener('click', continueFromSaved);
  getElement('home-btn').addEventListener('click', goHome);

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

  getElement('back-cancel').addEventListener('click', () => {
    getElement('back-modal').classList.add('hidden');
  });

  window.addEventListener('popstate', (e) => {
    if (getElement('quiz-view').classList.contains('hidden') === false) {
      e.preventDefault();
      getElement('back-modal').classList.remove('hidden');
    }
  });

  getElement('registration-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = getElement('reg-name').value.trim();
    const email = getElement('reg-email').value.trim();
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
    const email = getElement('change-email').value.trim();
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
  writingGroup = null;
  writingResponses = [];
  currentWritingStep = 0;
  currentPreviewIndex = 0;

  document.removeEventListener('keydown', handleCarouselKeydown);

  getElement('email-btn').classList.remove('hidden');
  getElement('quiz-view').classList.add('hidden');
  getElement('results-container').classList.add('hidden');
  getElement('section-instructions-panel').classList.add('hidden');
  renderCategorySelect();
}

async function init() {
  loadUser();
  updateUserDisplay();
  initEventListeners();

  const loaded = await loadAllData();

  renderCategorySelect();
  
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
