// Enhanced main.js with all new features
const API_BASE = window.location.origin;

// State management
let currentQuizData = null;
let currentQuizAnswers = [];
let quickfireTimer = null;
let quickfireTimeLeft = 60;
let isLoading = false; // Prevent duplicate requests

// DOM Elements - cached for performance
const contentInput = document.getElementById('contentInput');
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const loading = document.getElementById('loading');

// Tab buttons
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Summary elements
const summarizeBtn = document.getElementById('summarizeBtn');
const summaryLength = document.getElementById('summaryLength');
const summaryFormat = document.getElementById('summaryFormat');
const summarySection = document.getElementById('summarySection');
const summaryDisplay = document.getElementById('summaryDisplay');
const regenerateSummary = document.getElementById('regenerateSummary');
const copySummary = document.getElementById('copySummary');
const exportSummaryPDF = document.getElementById('exportSummaryPDF');

// Quiz elements
const quizBtn = document.getElementById('quizBtn');
const quizDifficulty = document.getElementById('quizDifficulty');
const questionCount = document.getElementById('questionCount');
const quizTypeMCQ = document.getElementById('quizTypeMCQ');
const quizTypeFillBlank = document.getElementById('quizTypeFillBlank');
const quizTypeTrueFalse = document.getElementById('quizTypeTrueFalse');
const quizSection = document.getElementById('quizSection');
const quizContainer = document.getElementById('quizContainer');
const quizProgress = document.getElementById('quizProgress');
const quizActions = document.getElementById('quizActions');
const submitQuiz = document.getElementById('submitQuiz');
const quizResultSection = document.getElementById('quizResultSection');
const quizResult = document.getElementById('quizResult');
const quizExplanations = document.getElementById('quizExplanations');
const retryQuiz = document.getElementById('retryQuiz');
const exportQuizPDF = document.getElementById('exportQuizPDF');

// Quickfire elements
const quickfireBtn = document.getElementById('quickfireBtn');
const quickfireSection = document.getElementById('quickfireSection');
const quickfireContainer = document.getElementById('quickfireContainer');
const timerDisplay = document.getElementById('timerDisplay');
const quickfireActions = document.getElementById('quickfireActions');
const submitQuickfire = document.getElementById('submitQuickfire');
const quickfireResultSection = document.getElementById('quickfireResultSection');
const quickfireResult = document.getElementById('quickfireResult');
const retryQuickfire = document.getElementById('retryQuickfire');

// Theme toggle
const themeToggle = document.getElementById('themeToggle');

// Utility Functions
function showLoading(show = true) {
  if (show && isLoading) return; // Prevent duplicate requests
  isLoading = show;
  loading?.classList.toggle('hidden', !show);
}

function showElement(el, show = true) {
  el?.classList.toggle('hidden', !show);
}

async function postJSON(url, data, timeout = 120000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: controller.signal
    });
    
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Server error (${res.status}): ${text}`);
    }
    return res.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms - please try again, the server may be experiencing high load`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, s => 
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s])
  );
}

// Tab Navigation
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const targetTab = btn.dataset.tab;
    
    // Update active states
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    tabContents.forEach(content => {
      content.classList.remove('active');
      if (content.id === `${targetTab}Tab`) {
        content.classList.add('active');
      }
    });
    
    // Hide result sections when switching tabs
    showElement(summarySection, false);
    showElement(quizSection, false);
    showElement(quizResultSection, false);
    showElement(quickfireSection, false);
    showElement(quickfireResultSection, false);
  });
});

// File Upload
uploadBtn?.addEventListener('click', () => fileInput?.click());

fileInput?.addEventListener('change', async (ev) => {
  const file = ev.target.files?.[0];
  if (!file) return;
  
  if (file.type === 'text/plain' || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
    const text = await file.text();
    contentInput.value = text;
  } else {
    alert('Please upload a .txt or .md file');
  }
});

// ==================== SUMMARY FUNCTIONS ====================

summarizeBtn?.addEventListener('click', async () => {
  const content = contentInput?.value?.trim();
  if (!content) {
    alert('Please paste or upload some content first.');
    return;
  }

  const length = summaryLength?.value || 'medium';
  const format = summaryFormat?.value || 'paragraph';

  showElement(summarySection, false);
  showLoading(true);

  try {
    const response = await postJSON(`${API_BASE}/api/summarize`, { 
      content, 
      length,
      format 
    });
    
    displaySummary(response.summary, format);
    showElement(summarySection, true);
  } catch (err) {
    alert('Error generating summary: ' + err.message);
  } finally {
    showLoading(false);
  }
});

function displaySummary(summary, format) {
  if (!summaryDisplay) return;
  
  let formattedSummary = summary
    .replace(/^Here's a summary.*?:\s*/i, '')
    .replace(/^Summary:\s*/i, '')
    .trim();

  // Format based on type
  if (format === 'points') {
    formattedSummary = formattedSummary
      .split(/\n|\.(?=\s+[A-Z])/)
      .filter(s => s.trim())
      .map(s => `• ${s.trim()}`)
      .join('<br>');
  } else if (format === 'headings') {
    formattedSummary = formattedSummary
      .replace(/\n/g, '<br>')
      .replace(/^([A-Z][^.!?]*:)/gm, '<strong>$1</strong>');
  } else {
    formattedSummary = formattedSummary.replace(/\n/g, '<br>');
  }

  summaryDisplay.innerHTML = `<div class="result-content">${formattedSummary}</div>`;
}

regenerateSummary?.addEventListener('click', () => summarizeBtn?.click());

copySummary?.addEventListener('click', async () => {
  const text = summaryDisplay?.textContent?.trim();
  if (!text) return;
  
  try {
    await navigator.clipboard.writeText(text);
    alert('Summary copied to clipboard!');
  } catch (e) {
    alert('Copy failed: ' + e.message);
  }
});

exportSummaryPDF?.addEventListener('click', () => {
  const text = summaryDisplay?.textContent?.trim();
  if (!text) return;
  
  generatePDF('AI Study Tutor - Summary', [
    { type: 'title', text: 'Study Material Summary' },
    { type: 'text', text: text }
  ]);
});

// ==================== QUIZ FUNCTIONS ====================

quizBtn?.addEventListener('click', async () => {
  const content = contentInput?.value?.trim();
  if (!content) {
    alert('Please paste or upload some content first.');
    return;
  }

  const difficulty = quizDifficulty?.value || 'medium';
  const count = parseInt(questionCount?.value) || 10;
  
  const types = [];
  if (quizTypeMCQ?.checked) types.push('mcq');
  if (quizTypeFillBlank?.checked) types.push('fillblank');
  if (quizTypeTrueFalse?.checked) types.push('truefalse');
  
  if (types.length === 0) {
    alert('Please select at least one question type.');
    return;
  }

  showElement(quizSection, false);
  showElement(quizResultSection, false);
  showLoading(true);

  try {
    const response = await postJSON(`${API_BASE}/api/generateQuiz`, {
      content,
      difficulty,
      count,
      types: types.join(',')
    });
    
    currentQuizData = response.questions || [];
    currentQuizAnswers = new Array(currentQuizData.length).fill(null);
    
    renderQuiz(currentQuizData);
    showElement(quizSection, true);
    showElement(quizActions, true);
  } catch (err) {
    alert('Error generating quiz: ' + err.message);
  } finally {
    showLoading(false);
  }
});

function renderQuiz(questions) {
  if (!quizContainer || !questions.length) return;
  
  quizContainer.innerHTML = '';
  quizProgress.textContent = `0 / ${questions.length} answered`;
  
  questions.forEach((q, idx) => {
    const qDiv = document.createElement('div');
    qDiv.className = 'quiz-question';
    qDiv.dataset.index = idx;
    
    const type = q.type || 'mcq';
    const typeBadge = {
      'mcq': 'Multiple Choice',
      'fillblank': 'Fill in the Blank',
      'truefalse': 'True/False'
    }[type] || 'Multiple Choice';
    
    qDiv.innerHTML = `
      <div class="quiz-question-header">
        <div class="question-text">
          <strong>Q${idx + 1}.</strong> ${escapeHtml(q.question)}
        </div>
        <span class="question-type-badge">${typeBadge}</span>
      </div>
    `;
    
    // Render based on question type
    if (type === 'fillblank') {
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'quiz-input';
      input.placeholder = 'Type your answer here...';
      input.addEventListener('input', (e) => {
        currentQuizAnswers[idx] = e.target.value.trim();
        updateProgress();
      });
      qDiv.appendChild(input);
    } else {
      const optionsDiv = document.createElement('div');
      optionsDiv.className = 'quiz-options';
      
      (q.options || []).forEach((opt, optIdx) => {
        const optDiv = document.createElement('div');
        optDiv.className = 'quiz-option';
        optDiv.textContent = opt;
        optDiv.addEventListener('click', () => {
          // Remove selection from siblings
          optionsDiv.querySelectorAll('.quiz-option').forEach(o => 
            o.classList.remove('selected')
          );
          optDiv.classList.add('selected');
          currentQuizAnswers[idx] = optIdx;
          updateProgress();
        });
        optionsDiv.appendChild(optDiv);
      });
      
      qDiv.appendChild(optionsDiv);
    }
    
    // Add hint section
    const hintDiv = document.createElement('div');
    hintDiv.className = 'hint-section';
    const hintBtn = document.createElement('button');
    hintBtn.className = 'neumo-btn secondary hint-btn';
    hintBtn.textContent = '💡 Show Hint';
    hintBtn.addEventListener('click', () => {
      const hintContent = hintDiv.querySelector('.hint-content');
      if (hintContent) {
        hintContent.remove();
      } else {
        const hint = document.createElement('div');
        hint.className = 'hint-content';
        hint.textContent = q.hint || 'Think carefully about the key concepts.';
        hintDiv.appendChild(hint);
      }
    });
    hintDiv.appendChild(hintBtn);
    qDiv.appendChild(hintDiv);
    
    quizContainer.appendChild(qDiv);
  });
}

function updateProgress() {
  const answered = currentQuizAnswers.filter(a => a !== null && a !== '').length;
  if (quizProgress) {
    quizProgress.textContent = `${answered} / ${currentQuizData.length} answered`;
  }
}

submitQuiz?.addEventListener('click', () => {
  if (currentQuizAnswers.some(a => a === null || a === '')) {
    if (!confirm('Some questions are unanswered. Submit anyway?')) return;
  }
  
  gradeQuiz();
});

// Helper function for fuzzy string matching (for fill-in-the-blank)
function fuzzyMatch(answer, userAnswer, threshold = 0.7) {
  const a = String(answer).toLowerCase().trim();
  const b = String(userAnswer).toLowerCase().trim();
  
  // Exact match
  if (a === b) return true;
  
  // One contains the other
  if (a.includes(b) || b.includes(a)) return true;
  
  // Partial match (at least 70% of the shorter string matches)
  const shorter = a.length < b.length ? a : b;
  const longer = a.length < b.length ? b : a;
  
  let matches = 0;
  for (let char of shorter) {
    if (longer.includes(char)) matches++;
  }
  
  return matches / shorter.length >= threshold;
}

function gradeQuiz() {
  let correctCount = 0;
  const results = [];
  
  currentQuizData.forEach((q, idx) => {
    const userAnswer = currentQuizAnswers[idx];
    const qDiv = quizContainer.querySelector(`[data-index="${idx}"]`);
    
    let isCorrect = false;
    
    if (q.type === 'fillblank') {
      const correctAnswer = String(q.correctAnswer || '').toLowerCase().trim();
      const userAns = String(userAnswer || '').toLowerCase().trim();
      isCorrect = fuzzyMatch(correctAnswer, userAns, 0.75);
      
      const input = qDiv.querySelector('.quiz-input');
      if (input) {
        input.disabled = true;
        input.style.borderColor = isCorrect ? 'var(--success)' : 'var(--danger)';
      }
    } else {
      isCorrect = userAnswer === q.correctIndex;
      
      const options = qDiv.querySelectorAll('.quiz-option');
      options.forEach((opt, optIdx) => {
        opt.style.pointerEvents = 'none';
        if (optIdx === q.correctIndex) {
          opt.classList.add('correct');
        }
        if (optIdx === userAnswer && !isCorrect) {
          opt.classList.add('incorrect');
        }
      });
    }
    
    if (isCorrect) correctCount++;
    
    // Add explanation
    const expDiv = document.createElement('div');
    expDiv.className = 'explanation';
    expDiv.innerHTML = `
      <strong>${isCorrect ? '✅ Correct!' : '❌ Incorrect'}</strong><br>
      ${q.explanation || 'Review the material for better understanding.'}
      ${q.type === 'fillblank' ? `<br><em>Correct answer: ${q.correctAnswer}</em>` : ''}
    `;
    qDiv.appendChild(expDiv);
    
    results.push({
      question: q.question,
      userAnswer: q.type === 'fillblank' ? userAnswer : q.options[userAnswer],
      correctAnswer: q.type === 'fillblank' ? q.correctAnswer : q.options[q.correctIndex],
      isCorrect,
      explanation: q.explanation
    });
  });
  
  // Hide quiz actions
  showElement(quizActions, false);
  
  // Show results
  const percentage = Math.round((correctCount / currentQuizData.length) * 100);
  quizResult.innerHTML = `
    <div class="quiz-score">
      <h2>${correctCount} / ${currentQuizData.length}</h2>
      <p>${percentage}% Score</p>
    </div>
  `;
  
  showElement(quizResultSection, true);
  
  // Store results for PDF export
  window.lastQuizResults = results;
}

retryQuiz?.addEventListener('click', () => {
  // Reset all answers
  currentQuizAnswers = new Array(currentQuizData.length).fill(null);
  renderQuiz(currentQuizData);
  showElement(quizResultSection, false);
  showElement(quizActions, true);
  updateProgress();
});

exportQuizPDF?.addEventListener('click', () => {
  if (!window.lastQuizResults) return;
  
  const pdfContent = [
    { type: 'title', text: 'Quiz Results' },
    { type: 'text', text: `Score: ${window.lastQuizResults.filter(r => r.isCorrect).length} / ${window.lastQuizResults.length}` },
    { type: 'text', text: '' }
  ];
  
  window.lastQuizResults.forEach((r, idx) => {
    pdfContent.push(
      { type: 'subtitle', text: `Q${idx + 1}. ${r.question}` },
      { type: 'text', text: `Your Answer: ${r.userAnswer || 'No answer'}` },
      { type: 'text', text: `Correct Answer: ${r.correctAnswer}` },
      { type: 'text', text: `Status: ${r.isCorrect ? '✓ Correct' : '✗ Incorrect'}` },
      { type: 'text', text: `Explanation: ${r.explanation}` },
      { type: 'text', text: '' }
    );
  });
  
  generatePDF('AI Study Tutor - Quiz Results', pdfContent);
});

// ==================== QUICKFIRE FUNCTIONS ====================

quickfireBtn?.addEventListener('click', async () => {
  const content = contentInput?.value?.trim();
  if (!content) {
    alert('Please paste or upload some content first.');
    return;
  }

  // Clean up any existing timer
  if (quickfireTimer) {
    clearInterval(quickfireTimer);
    quickfireTimer = null;
  }

  showElement(quickfireSection, false);
  showElement(quickfireResultSection, false);
  showLoading(true);

  try {
    const response = await postJSON(`${API_BASE}/api/generateQuiz`, {
      content,
      difficulty: 'medium',
      count: 5,
      types: 'mcq,truefalse'
    });
    
    currentQuizData = response.questions || [];
    currentQuizAnswers = new Array(5).fill(null);
    
    renderQuickfire(currentQuizData.slice(0, 5));
    showElement(quickfireSection, true);
    showElement(quickfireActions, true);
    startQuickfireTimer();
  } catch (err) {
    alert('Error starting quick fire: ' + err.message);
  } finally {
    showLoading(false);
  }
});

function renderQuickfire(questions) {
  if (!quickfireContainer) return;
  
  quickfireContainer.innerHTML = '';
  
  questions.forEach((q, idx) => {
    const qDiv = document.createElement('div');
    qDiv.className = 'quiz-question';
    qDiv.dataset.index = idx;
    
    qDiv.innerHTML = `
      <div class="question-text">
        <strong>Q${idx + 1}.</strong> ${escapeHtml(q.question)}
      </div>
    `;
    
    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'quiz-options';
    
    (q.options || []).forEach((opt, optIdx) => {
      const optDiv = document.createElement('div');
      optDiv.className = 'quiz-option';
      optDiv.textContent = opt;
      optDiv.addEventListener('click', () => {
        optionsDiv.querySelectorAll('.quiz-option').forEach(o => 
          o.classList.remove('selected')
        );
        optDiv.classList.add('selected');
        currentQuizAnswers[idx] = optIdx;
      });
      optionsDiv.appendChild(optDiv);
    });
    
    qDiv.appendChild(optionsDiv);
    quickfireContainer.appendChild(qDiv);
  });
}

function startQuickfireTimer() {
  // Clear any existing timer first
  if (quickfireTimer) {
    clearInterval(quickfireTimer);
  }
  
  quickfireTimeLeft = 60;
  updateTimerDisplay();
  
  // Remove warning class from previous runs
  timerDisplay?.classList.remove('warning');
  
  quickfireTimer = setInterval(() => {
    quickfireTimeLeft--;
    updateTimerDisplay();
    
    if (quickfireTimeLeft <= 10) {
      timerDisplay?.classList.add('warning');
    }
    
    if (quickfireTimeLeft <= 0) {
      clearInterval(quickfireTimer);
      quickfireTimer = null;
      // Use setTimeout to ensure the UI updates before submission
      setTimeout(() => {
        submitQuickfire?.click();
      }, 100);
    }
  }, 1000);
}

function updateTimerDisplay() {
  if (!timerDisplay) return;
  const mins = Math.floor(quickfireTimeLeft / 60);
  const secs = quickfireTimeLeft % 60;
  timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

submitQuickfire?.addEventListener('click', () => {
  if (quickfireTimer) {
    clearInterval(quickfireTimer);
    quickfireTimer = null;
  }
  gradeQuickfire();
});

function gradeQuickfire() {
  let correctCount = 0;
  
  currentQuizData.slice(0, 5).forEach((q, idx) => {
    const userAnswer = currentQuizAnswers[idx];
    const qDiv = quickfireContainer.querySelector(`[data-index="${idx}"]`);
    
    const isCorrect = userAnswer === q.correctIndex;
    if (isCorrect) correctCount++;
    
    const options = qDiv.querySelectorAll('.quiz-option');
    options.forEach((opt, optIdx) => {
      opt.style.pointerEvents = 'none';
      if (optIdx === q.correctIndex) {
        opt.classList.add('correct');
      }
      if (optIdx === userAnswer && !isCorrect) {
        opt.classList.add('incorrect');
      }
    });
  });
  
  showElement(quickfireActions, false);
  
  const timeUsed = 60 - quickfireTimeLeft;
  quickfireResult.innerHTML = `
    <div class="quiz-score">
      <h2>${correctCount} / 5</h2>
      <p>Time: ${timeUsed}s</p>
      <p>${correctCount >= 4 ? '🎉 Excellent!' : correctCount >= 3 ? '👍 Good job!' : '💪 Keep practicing!'}</p>
    </div>
  `;
  
  showElement(quickfireResultSection, true);
}

retryQuickfire?.addEventListener('click', () => {
  // Clean up timer before retrying
  if (quickfireTimer) {
    clearInterval(quickfireTimer);
    quickfireTimer = null;
  }
  quickfireBtn?.click();
});

// ==================== PDF GENERATION ====================

function generatePDF(filename, content) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  let yPos = 20;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const maxWidth = 170;
  
  content.forEach(item => {
    if (yPos > pageHeight - 30) {
      doc.addPage();
      yPos = 20;
    }
    
    if (item.type === 'title') {
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text(item.text, margin, yPos);
      yPos += 15;
    } else if (item.type === 'subtitle') {
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      const lines = doc.splitTextToSize(item.text, maxWidth);
      doc.text(lines, margin, yPos);
      yPos += lines.length * 7 + 5;
    } else if (item.type === 'text') {
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const lines = doc.splitTextToSize(item.text, maxWidth);
      doc.text(lines, margin, yPos);
      yPos += lines.length * 6 + 3;
    }
  });
  
  doc.save(`${filename}.pdf`);
}

// ==================== CONCEPT MAP FUNCTIONS ====================

const conceptMapBtn = document.getElementById('conceptMapBtn');
const conceptMapSection = document.getElementById('conceptMapSection');
const conceptMapDisplay = document.getElementById('conceptMapDisplay');
const exportMapPDF = document.getElementById('exportMapPDF');

conceptMapBtn?.addEventListener('click', async () => {
  const content = contentInput?.value?.trim();
  if (!content) {
    alert('Please paste or upload some content first.');
    return;
  }

  showElement(conceptMapSection, false);
  showLoading(true);

  try {
    const response = await postJSON(`${API_BASE}/api/conceptMap`, { content });
    const { conceptMap } = response;
    
    displayConceptMap(conceptMap);
    showElement(conceptMapSection, true);
  } catch (err) {
    alert('Error generating concept map: ' + err.message);
  } finally {
    showLoading(false);
  }
});

function displayConceptMap(mapData) {
  if (!conceptMapDisplay || !mapData) return;

  let html = '<div class="concept-map">';
  
  // Display concepts
  if (mapData.concepts && mapData.concepts.length > 0) {
    html += '<h4>📚 Key Concepts:</h4><ul>';
    mapData.concepts.forEach(concept => {
      html += `<li><strong>${escapeHtml(concept.name)}</strong>: ${escapeHtml(concept.description)}</li>`;
    });
    html += '</ul>';
  }

  // Display dependencies as text
  if (mapData.dependencies && mapData.dependencies.length > 0) {
    html += '<h4>🔗 Dependencies:</h4><ul>';
    mapData.dependencies.forEach(dep => {
      const fromConcept = mapData.concepts?.find(c => c.id === dep.from)?.name || dep.from;
      const toConcept = mapData.concepts?.find(c => c.id === dep.to)?.name || dep.to;
      html += `<li><strong>${escapeHtml(fromConcept)}</strong> → ${escapeHtml(toConcept)} (${escapeHtml(dep.relationship)})</li>`;
    });
    html += '</ul>';
  }

  html += '</div>';
  conceptMapDisplay.innerHTML = html;
}

exportMapPDF?.addEventListener('click', () => {
  alert('📊 Concept map PDF export coming soon!');
});

// ==================== PERFORMANCE PREDICTOR FUNCTIONS ====================

const predictBtn = document.getElementById('predictBtn');
const predictorSection = document.getElementById('predictorSection');
const predictorDisplay = document.getElementById('predictorDisplay');
const cieInput = document.getElementById('cieInput');
const desiredGradeInput = document.getElementById('desiredGradeInput');

predictBtn?.addEventListener('click', async () => {
  const cieMarks = parseFloat(cieInput?.value) || 0;
  const desiredGrade = desiredGradeInput?.value || 'S';
  const subjectType = 'Theory';

  // Validation
  if (cieMarks < 0 || cieMarks > 40) {
    alert('CIE marks must be between 0-40');
    return;
  }

  showElement(predictorSection, false);
  showLoading(true);

  try {
    const response = await postJSON(`${API_BASE}/api/predictPerformance`, {
      cieMarks,
      desiredGrade,
      subjectType
    });

    displayPrediction(response);
    showElement(predictorSection, true);
  } catch (err) {
    alert('Error calculating SEE requirement: ' + err.message);
  } finally {
    showLoading(false);
  }
});

function displayPrediction(data) {
  if (!predictorDisplay) return;

  const gradeNames = {
    'S': 'Excellent',
    'A': 'Very Good',
    'B': 'Good',
    'C': 'Average',
    'D': 'Below Average',
    'E': 'Pass'
  };

  const gradeEmojis = {
    'S': '🌟',
    'A': '⭐',
    'B': '👍',
    'C': '➖',
    'D': '⚠️',
    'E': '✅'
  };

  // Prominent SEE requirement display
  const seeHighlightColor = data.achievable ? '#4caf50' : '#f44336';
  const seeStatusEmoji = data.achievable ? '✅' : '⚠️';

  let html = `
    <div class="prediction-result">
      <!-- PROMINENT SEE REQUIREMENT SECTION -->
      <div class="see-requirement-highlight" style="border-color: ${seeHighlightColor};">
        <div style="text-align: center;">
          <p style="font-size: 0.9rem; opacity: 0.8; margin: 0; margin-bottom: 8px;">Minimum SEE Marks Required</p>
          <div style="display: flex; align-items: baseline; justify-content: center; gap: 8px;">
            <span style="font-size: 2.5rem; font-weight: 800; color: ${seeHighlightColor};">${data.seeRequired}</span>
            <span style="font-size: 1.5rem; color: var(--text-light); opacity: 0.7;">/60</span>
          </div>
          <p style="font-size: 0.95rem; margin: 12px 0 0 0; color: var(--text-light);">
            to achieve <strong>Grade ${data.desiredGrade}</strong> (${gradeNames[data.desiredGrade]})
          </p>
          <p style="font-size: 0.85rem; margin: 6px 0 0 0; opacity: 0.7;">
            ${seeStatusEmoji} ${data.achievable ? 'Achievable' : 'Not Achievable with SEE ≤ 60'}
          </p>
        </div>
      </div>

      <!-- Grade badge section -->
      <div class="risk-gauge" style="border-color: ${seeHighlightColor};">
        <h2 style="color: ${seeHighlightColor}; margin-bottom: 8px;">
          ${gradeEmojis[data.desiredGrade]} Grade ${data.desiredGrade} (${gradeNames[data.desiredGrade]})
        </h2>
        <p class="score-display">
          <strong>${data.message}</strong>
        </p>
      </div>

      <!-- CHARTS SECTION -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-lg); margin: var(--spacing-xl) 0;">
        <!-- SEE Progress Radial Chart -->
        <div id="seeProgressChart" style="background: var(--bg-light-elevated); padding: var(--spacing-lg); border-radius: var(--radius-md); box-shadow: inset 3px 3px 6px var(--shadow-inset-1);"></div>
        
        <!-- Current Performance Gauge -->
        <div id="performanceGaugeChart" style="background: var(--bg-light-elevated); padding: var(--spacing-lg); border-radius: var(--radius-md); box-shadow: inset 3px 3px 6px var(--shadow-inset-1);"></div>
      </div>

      <!-- Grade Comparison Bar Chart -->
      <div id="gradeComparisonChart" style="background: var(--bg-light-elevated); padding: var(--spacing-lg); margin: var(--spacing-lg) 0; border-radius: var(--radius-md); box-shadow: inset 3px 3px 6px var(--shadow-inset-1);"></div>

      <div class="metrics-display">
        <h4>📋 Your Current Status:</h4>
        <div class="metric-item">CIE Marks: <strong>${data.cieMarks}/40</strong></div>
        <div class="metric-item">Minimum SEE Passing: <strong>${data.minSEEPassing}/60 (40%)</strong></div>
        <div class="metric-item">Total Marks Required: <strong>${data.totalMarksRequired}/100</strong></div>
      </div>

      <div class="suggestions-display">
        <h4>📊 All Grades & SEE Requirements:</h4>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background: var(--bg-light); font-weight: 600;">
            <td style="padding: 10px; border: 1px solid var(--shadow-light-1);">Grade</td>
            <td style="padding: 10px; border: 1px solid var(--shadow-light-1);">Total Marks Needed</td>
            <td style="padding: 10px; border: 1px solid var(--shadow-light-1);">SEE Required</td>
            <td style="padding: 10px; border: 1px solid var(--shadow-light-1);">Status</td>
          </tr>
  `;

  // Display all grades
  const gradeOrder = ['S', 'A', 'B', 'C', 'D', 'E'];
  for (const grade of gradeOrder) {
    if (data.allGrades[grade]) {
      const gradeData = data.allGrades[grade];
      const statusText = gradeData.achievable ? '✅ Achievable' : '❌ Not Achievable';
      const statusColor = gradeData.achievable ? '#4caf50' : '#f44336';
      
      html += `
        <tr style="${grade === data.desiredGrade ? 'background: rgba(102, 126, 234, 0.2);' : ''}">
          <td style="padding: 10px; border: 1px solid var(--shadow-light-1); font-weight: 600;">${grade}</td>
          <td style="padding: 10px; border: 1px solid var(--shadow-light-1);">${gradeData.totalMarks}/100</td>
          <td style="padding: 10px; border: 1px solid var(--shadow-light-1);">${gradeData.seeRequired}/60</td>
          <td style="padding: 10px; border: 1px solid var(--shadow-light-1); color: ${statusColor}; font-weight: 600;">${statusText}</td>
        </tr>
      `;
    }
  }

  html += `
        </table>
      </div>
    </div>
  `;

  predictorDisplay.innerHTML = html;

  // ===== RENDER APEXCHARTS =====
  
  // 1. SEE Progress Chart (Radial)
  const seeProgressOptions = {
    series: [Math.round((data.seeRequired / 60) * 100)],
    chart: {
      type: 'radialBar',
      height: 250,
      sparkline: { enabled: false }
    },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        track: {
          background: 'var(--shadow-light-1)',
          strokeWidth: '97%',
          margin: 5,
          dropShadow: { enabled: false }
        },
        dataLabels: {
          name: { fontSize: '16px', color: 'var(--text-light)' },
          value: { fontSize: '24px', color: 'var(--primary)', fontWeight: 700 },
          total: { show: false }
        },
        hollow: { size: '60%' }
      }
    },
    colors: [data.achievable ? '#4caf50' : '#f44336'],
    labels: ['SEE Required'],
    states: { hover: { filter: { type: 'none' } } }
  };

  new ApexCharts(document.querySelector('#seeProgressChart'), seeProgressOptions).render();

  // 2. Performance Gauge (Current Total Marks)
  const currentTotal = data.cieMarks + data.minSEEPassing;
  const performancePercentage = Math.round((currentTotal / 100) * 100);
  
  const performanceGaugeOptions = {
    series: [performancePercentage],
    chart: {
      type: 'radialBar',
      height: 250,
      sparkline: { enabled: false }
    },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        track: {
          background: 'var(--shadow-light-1)',
          strokeWidth: '97%',
          margin: 5
        },
        dataLabels: {
          name: { fontSize: '14px', color: 'var(--text-light)' },
          value: { fontSize: '24px', color: 'var(--secondary)', fontWeight: 700 }
        },
        hollow: { size: '60%' }
      }
    },
    colors: ['#667eea'],
    labels: ['Current Total'],
    states: { hover: { filter: { type: 'none' } } }
  };

  new ApexCharts(document.querySelector('#performanceGaugeChart'), performanceGaugeOptions).render();

  // 3. Grade Comparison Bar Chart
  const gradeLabels = [];
  const gradeSeeValues = [];
  const gradeColors = [];

  for (const grade of gradeOrder) {
    if (data.allGrades[grade]) {
      gradeLabels.push(grade);
      gradeSeeValues.push(data.allGrades[grade].seeRequired);
      gradeColors.push(data.allGrades[grade].achievable ? '#4caf50' : '#f44336');
    }
  }

  const gradeComparisonOptions = {
    series: [{
      name: 'SEE Required',
      data: gradeSeeValues
    }],
    chart: {
      type: 'bar',
      height: 300,
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '60%',
        borderRadius: 8,
        dataLabels: { position: 'top' },
        distributed: true
      }
    },
    dataLabels: {
      enabled: true,
      position: 'top',
      style: { fontSize: '12px', fontWeight: 700, colors: ['var(--text-light)'] }
    },
    xaxis: {
      categories: gradeLabels,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: 'var(--text-light)', fontSize: '12px', fontWeight: 600 } }
    },
    yaxis: {
      title: { text: 'SEE Marks Required (out of 60)', style: { color: 'var(--text-light)' } },
      labels: { style: { colors: 'var(--text-light)' } },
      max: 60
    },
    colors: gradeColors,
    grid: { borderColor: 'var(--shadow-light-1)' },
    states: { hover: { filter: { type: 'darken', value: 0.15 } } }
  };

  new ApexCharts(document.querySelector('#gradeComparisonChart'), gradeComparisonOptions).render();
}

// ==================== VIVA SIMULATOR FUNCTIONS ====================

const vivaBtn = document.getElementById('vivaBtn');
const vivaSection = document.getElementById('vivaSection');
const vivaContainer = document.getElementById('vivaContainer');
const vivaActions = document.getElementById('vivaActions');
const vivaProgress = document.getElementById('vivaProgress');
const nextVivaBtn = document.getElementById('nextVivaBtn');

let currentVivaQuestions = [];
let currentVivaIndex = 0;

vivaBtn?.addEventListener('click', async () => {
  const content = contentInput?.value?.trim();
  if (!content) {
    alert('Please paste or upload some content first.');
    return;
  }

  const difficulty = document.getElementById('vivaDifficulty')?.value || 'medium';
  const count = parseInt(document.getElementById('vivaCount')?.value) || 5;

  showElement(vivaSection, false);
  showLoading(true);

  try {
    const response = await postJSON(`${API_BASE}/api/vivaSimulator`, {
      content,
      difficulty,
      count
    });

    currentVivaQuestions = response.questions || [];
    currentVivaIndex = 0;
    
    displayVivaQuestion();
    showElement(vivaSection, true);
    showElement(vivaActions, true);
  } catch (err) {
    alert('Error starting viva simulator: ' + err.message);
  } finally {
    showLoading(false);
  }
});

function displayVivaQuestion() {
  if (!vivaContainer || !currentVivaQuestions.length) return;

  const q = currentVivaQuestions[currentVivaIndex];
  vivaProgress.textContent = `Question ${currentVivaIndex + 1} / ${currentVivaQuestions.length}`;

  let html = `
    <div class="viva-question">
      <div class="question-text">
        <strong>Q${currentVivaIndex + 1}:</strong> ${escapeHtml(q.question)}
      </div>
      <div class="expected-points">
        <h5>📝 Expected Answer Points:</h5>
        <ul>
  `;

  q.expectedPoints.forEach(point => {
    html += `<li>${escapeHtml(point)}</li>`;
  });

  html += `
        </ul>
      </div>
      <div class="tips-section">
        <h5>💡 Answer Tips:</h5>
        <p>${escapeHtml(q.tips)}</p>
      </div>
    </div>
  `;

  vivaContainer.innerHTML = html;

  // Update button states
  showElement(vivaActions, true);

  if (currentVivaIndex === currentVivaQuestions.length - 1) {
    nextVivaBtn.textContent = '✅ Finish';
  } else {
    nextVivaBtn.textContent = '📝 Next Question';
  }
}

nextVivaBtn?.addEventListener('click', () => {
  if (currentVivaIndex < currentVivaQuestions.length - 1) {
    currentVivaIndex++;
    displayVivaQuestion();
  } else {
    alert('✅ Viva practice completed! Great effort!');
    showElement(vivaSection, false);
    showElement(vivaActions, false);
  }
});

// ==================== THEME TOGGLE ====================

document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') {
    document.body.classList.add('dark');
    document.body.classList.remove('light');
    if (themeToggle) themeToggle.textContent = '☀️';
  } else {
    document.body.classList.add('light');
    document.body.classList.remove('dark');
    if (themeToggle) themeToggle.textContent = '🌙';
  }

  themeToggle?.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    if (isDark) {
      document.body.classList.remove('light');
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
      document.body.classList.add('light');
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeToggle.textContent = isDark ? '☀️' : '🌙';
  });
});
