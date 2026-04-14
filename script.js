const quizData = {
  GRAMMAR: [],
  READING: [],
  LISTENING: [],
  WRITING: [],
  SPEAKING: []
};

let allQuestions = [];
let currentQuestionIndex = 0;
let selectedOptionIndex = null;
let score = { GRAMMAR: 0, READING: 0, LISTENING: 0, WRITING: 0, SPEAKING: 0 };
let answeredQuestions = new Set();
let shuffledQuestions = [];
let currentCategory = null;
let currentExerciseIndex = 0;

const letters = ['A', 'B', 'C', 'D'];

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
    currentCategory: currentCategory,
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

function updateProgressBar() {
  const total = allQuestions.length;
  const current = currentQuestionIndex + 1;
  const percentage = (current / total) * 100;
  getElement('progress-bar').style.width = percentage + '%';
  getElement('progress-text').textContent = `Pregunta ${current} de ${total}`;
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
    const [grammar, reading, listening, writing, speaking] = await Promise.all([
      fetch('data/grammar.json').then(r => r.json()).catch(() => []),
      fetch('data/reading.json').then(r => r.json()).catch(() => []),
      fetch('data/listening.json').then(r => r.json()).catch(() => []),
      fetch('data/writing.json').then(r => r.json()).catch(() => []),
      fetch('data/speaking.json').then(r => r.json()).catch(() => [])
    ]);

    quizData.GRAMMAR = grammar;
    quizData.READING = reading;
    quizData.LISTENING = listening;
    quizData.WRITING = writing;
    quizData.SPEAKING = speaking;

    return true;
  } catch (error) {
    console.error('Error loading data:', error);
    return false;
  }
}

function renderCategorySelect() {
  getElement('quiz-container').classList.add('hidden');
  getElement('controls').classList.add('hidden');
  getElement('results-container').classList.add('hidden');
  getElement('category-select').classList.remove('hidden');
  getElement('progress-container').style.display = 'none';
  getElement('progress-text').style.display = 'none';
  getElement('category-badge').style.display = 'none';
  getElement('audio-container').style.display = 'none';
  getElement('reading-text').style.display = 'none';

  const container = getElement('category-buttons');
  container.innerHTML = '';

  const categories = [
    { key: 'GRAMMAR', name: 'Gramática' },
    { key: 'READING', name: 'Comprensión Lectora' },
    { key: 'LISTENING', name: 'Comprensión Auditiva' },
    { key: 'WRITING', name: 'Escritura' },
    { key: 'SPEAKING', name: 'Expresión Oral' }
  ];

  categories.forEach(cat => {
    const data = quizData[cat.key];
    const count = cat.key === 'GRAMMAR' ? data.length : flattenQuestions(cat.key, data).length;

    if (count > 0) {
      const btn = document.createElement('button');
      btn.className = 'category-btn';
      btn.innerHTML = `<strong>${cat.key}</strong><span>${cat.name} - ${count} preguntas</span>`;
      btn.addEventListener('click', () => startFromCategory(cat.key));
      container.appendChild(btn);
    }
  });

  const savedProgress = loadProgress();
  getElement('continue-btn').classList.toggle('hidden', !savedProgress);
}

function startFromCategory(category) {
  currentCategory = category;
  currentExerciseIndex = 0;

  let sourceData;
  if (category === 'GRAMMAR') {
    sourceData = quizData.GRAMMAR;
    allQuestions = shuffleArray([...sourceData]).map((q, i) => ({
      ...q,
      category: category,
      exerciseIndex: i,
      questionIndex: 0,
      isGuide: false
    }));
  } else if (category === 'WRITING' || category === 'SPEAKING') {
    sourceData = quizData[category];
    allQuestions = sourceData.map((q, i) => ({
      ...q,
      category: category,
      exerciseIndex: i,
      questionIndex: 0,
      isGuide: true
    }));
  } else {
    sourceData = quizData[category];
    const flattened = flattenQuestions(category, sourceData);
    allQuestions = shuffleArray(flattened).map(q => ({ ...q, isGuide: false }));
  }

  shuffledQuestions = allQuestions.map((q, i) => {
    if (q.isGuide) {
      return { ...q, shuffledOptions: [], correctShuffledIndex: -1 };
    }
    return {
      ...shuffleOptions(q),
      exerciseIndex: q.exerciseIndex,
      questionIndex: q.questionIndex,
      isGuide: false
    };
  });

  currentQuestionIndex = 0;
  selectedOptionIndex = null;
  score = { GRAMMAR: 0, READING: 0, LISTENING: 0, WRITING: 0, SPEAKING: 0 };
  answeredQuestions.clear();

  getElement('category-select').classList.add('hidden');
  getElement('progress-container').style.display = 'block';
  getElement('progress-text').style.display = 'block';
  getElement('category-badge').style.display = 'block';
  getElement('quiz-container').classList.remove('hidden');
  getElement('controls').classList.remove('hidden');

  loadQuestion();
  saveProgress();
}

function renderGuide(guide) {
  let html = '';

  if (guide.title) {
    html += `<h2 class="guide-title">${guide.title}</h2>`;
  }

  if (guide.sections) {
    guide.sections.forEach(section => {
      html += `<div class="guide-section">`;
      
      if (section.title) {
        html += `<h3 class="guide-section-title">${section.title}</h3>`;
      }

      if (section.content) {
        html += `<p class="guide-content">${section.content}</p>`;
      }

      if (section.examples) {
        section.examples.forEach(example => {
          html += `
            <div class="guide-example">
              <div class="guide-example-label">${example.label}</div>
              <p class="guide-example-text">${example.text}</p>
            </div>
          `;
        });
      }

      if (section.items) {
        html += `<ul class="guide-list">`;
        section.items.forEach(item => {
          if (typeof item === 'string') {
            html += `<li class="guide-list-item">${item}</li>`;
          } else {
            html += `
              <li class="guide-list-item">
                <strong>${item.name}</strong>
                <p>${item.description}</p>
              </li>
            `;
          }
        });
        html += `</ul>`;
      }

      html += `</div>`;
    });
  }

  html += `
    <div class="guide-navigation">
      <button class="btn btn-primary" onclick="nextGuide()">
        ${currentQuestionIndex < shuffledQuestions.length - 1 ? 'Siguiente' : 'Volver al inicio'}
      </button>
    </div>
  `;

  getElement('question-text').innerHTML = '';
  getElement('options-container').innerHTML = html;
  getElement('feedback-container').style.display = 'none';
  
  updateProgressBar();
}

window.nextGuide = function() {
  currentQuestionIndex++;
  if (currentQuestionIndex >= shuffledQuestions.length) {
    restartTest();
  } else {
    loadQuestion();
  }
};

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

  getElement('audio-container').innerHTML = '';
  getElement('audio-container').style.display = 'none';
  getElement('transcription-toggle').innerHTML = '';
  getElement('transcription-toggle').style.display = 'none';
  getElement('transcription-text').classList.add('hidden');
  getElement('reading-text').style.display = 'none';

  if (question.isGuide) {
    renderGuide(question);
    getElement('controls').style.display = 'none';
    return;
  }

  getElement('controls').style.display = 'flex';

  if (question.audio) {
    getElement('audio-container').innerHTML = `<audio controls src="${question.audio}"></audio>`;
    getElement('audio-container').style.display = 'block';
  }

  if (question.transcription) {
    getElement('transcription-toggle').innerHTML = `<button id="transcription-btn" data-tooltip="Transcription">T</button>`;
    getElement('transcription-toggle').style.display = 'block';
    getElement('transcription-btn').addEventListener('click', toggleTranscription);
    
    let transcriptionContent = question.transcription;
    if (question.instruction) {
      transcriptionContent = `<em>(${question.instruction})</em><br><br>"${question.transcription}"`;
    }
    getElement('transcription-text').innerHTML = transcriptionContent;
    getElement('transcription-text').classList.add('hidden');
    document.getElementById('transcription-btn').classList.remove('active');
  }

  if (question.lectureText) {
    getElement('reading-text').innerHTML = `<strong>Lecture:</strong><br><br>${question.lectureText}`;
    getElement('reading-text').style.display = 'block';
  } else if (question.text) {
    getElement('reading-text').textContent = question.text;
    getElement('reading-text').style.display = 'block';
  }

  getElement('question-text').textContent = question.transcription || question.question;

  const optionsContainer = getElement('options-container');
  optionsContainer.innerHTML = '';

  question.shuffledOptions.forEach((opt, i) => {
    const optionDiv = document.createElement('div');
    optionDiv.className = 'option';
    optionDiv.innerHTML = `<span class="option-letter">${letters[i]}</span><span>${opt}</span>`;
    optionDiv.addEventListener('click', () => selectOption(i, optionDiv));
    optionsContainer.appendChild(optionDiv);
  });

  getElement('feedback-container').style.display = 'none';
  getElement('check-btn').style.display = 'inline-block';
  getElement('next-btn').classList.add('hidden');
  getElement('restart-btn').classList.add('hidden');

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
  answeredQuestions.add(currentQuestionIndex);

  getElement('check-btn').style.display = 'none';
  getElement('next-btn').classList.remove('hidden');
  getElement('restart-btn').classList.remove('hidden');

  saveProgress();
}

function nextQuestion() {
  currentQuestionIndex++;

  if (currentQuestionIndex >= shuffledQuestions.length) {
    showResults();
  } else {
    loadQuestion();
  }
}

function restartQuestion() {
  loadQuestion();
}

function showResults() {
  getElement('quiz-container').classList.add('hidden');
  getElement('controls').classList.add('hidden');
  getElement('progress-container').style.display = 'none';
  getElement('progress-text').style.display = 'none';
  getElement('category-badge').style.display = 'none';
  getElement('audio-container').style.display = 'none';
  getElement('reading-text').style.display = 'none';
  getElement('transcription-toggle').style.display = 'none';
  getElement('transcription-text').classList.add('hidden');
  getElement('results-container').classList.remove('hidden');

  const totalScore = Object.values(score).reduce((a, b) => a + b, 0);
  const totalQuestions = shuffledQuestions.length;
  const percentage = Math.round((totalScore / totalQuestions) * 100);

  getElement('score-display').textContent = `${percentage}% (${totalScore}/${totalQuestions})`;

  const breakdown = getElement('results-breakdown');
  breakdown.innerHTML = '';

  const categories = ['GRAMMAR', 'READING', 'LISTENING', 'WRITING', 'SPEAKING'];
  categories.forEach(cat => {
    if (quizData[cat].length > 0 || score[cat] > 0) {
      const count = cat === 'GRAMMAR' ? quizData[cat].length : flattenQuestions(cat, quizData[cat]).length;
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
- WRITING: ${score.WRITING}/${flattenQuestions('WRITING', quizData.WRITING).length}
- SPEAKING: ${score.SPEAKING}/${flattenQuestions('SPEAKING', quizData.SPEAKING).length}

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
  currentCategory = null;
  currentExerciseIndex = 0;

  getElement('results-container').classList.add('hidden');
  renderCategorySelect();
}

async function continueFromSaved() {
  const saved = loadProgress();
  if (saved) {
    currentCategory = saved.currentCategory;
    currentQuestionIndex = saved.currentIndex;
    score = saved.score;
    answeredQuestions = new Set(saved.answeredQuestions);

    if (currentCategory) {
      let sourceData;
      if (currentCategory === 'GRAMMAR') {
        sourceData = quizData.GRAMMAR;
        allQuestions = [...sourceData].map((q, i) => ({
          ...q,
          category: currentCategory,
          exerciseIndex: i,
          questionIndex: 0
        }));
      } else {
        sourceData = quizData[currentCategory];
        const flattened = flattenQuestions(currentCategory, sourceData);
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
      getElement('progress-container').style.display = 'block';
      getElement('progress-text').style.display = 'block';
      getElement('category-badge').style.display = 'block';
      getElement('quiz-container').classList.remove('hidden');
      getElement('controls').classList.remove('hidden');

      loadQuestion();
    }
  }
}

function initEventListeners() {
  getElement('check-btn').addEventListener('click', checkAnswer);
  getElement('next-btn').addEventListener('click', nextQuestion);
  getElement('restart-btn').addEventListener('click', restartQuestion);
  getElement('email-btn').addEventListener('click', sendEmail);
  getElement('restart-test-btn').addEventListener('click', restartTest);
  getElement('continue-btn').addEventListener('click', continueFromSaved);
}

async function init() {
  initEventListeners();

  const loaded = await loadAllData();

  if (loaded) {
    const savedProgress = loadProgress();
    if (savedProgress && savedProgress.currentCategory) {
      renderCategorySelect();
    } else {
      renderCategorySelect();
    }
  } else {
    getElement('category-select').innerHTML = '<p>Error al cargar los datos. Por favor, recargue la página.</p>';
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { quizData, loadQuestion, checkAnswer, loadAllData };
}
