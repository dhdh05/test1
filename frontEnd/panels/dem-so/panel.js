import { callAPI, submitGameResult } from '../../js/utils.js';

function loadStyles() {
  if (!document.querySelector('link[data-panel="dem-so"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './panels/dem-so/style.css';
    link.setAttribute('data-panel', 'dem-so');
    document.head.appendChild(link);
  }
}

export async function mount(container) {
  if (!container) return;
  loadStyles();

  container.innerHTML = '<div class="loading">⏳ Đang tải bài tập đếm...</div>';

  // 1. Gọi API lấy level
  const res = await callAPI('/games/levels/dem-so');
  
  if (!res || !res.success) {
      container.innerHTML = '<div class="panel-error">❌ Lỗi tải dữ liệu. Bạn đã chạy lệnh SQL chưa?</div>';
      return;
  }

  renderLevelList(container, res.data);
}

function renderLevelList(container, levels) {
    let html = `
        <div class="demso-container">
            <div class="game-container" style="display:block; text-align:center; min-height:400px; padding-top:40px;">
                <h1 style="color:#667eea; margin-bottom:10px;"><i class="fas fa-calculator"></i> Bé Tập Đếm</h1>
                <p style="margin-bottom:30px; color:#666;">Chọn bài học phù hợp với bé nhé!</p>
                <div style="display:grid; gap:15px; padding:0 10px;">
    `;

    levels.forEach(level => {
        // level.config = { min: 1, max: 5 }
        html += `
            <div class="level-btn" id="btn-level-${level.level_id}" 
                 style="background:white; padding:15px; border-radius:12px; box-shadow:0 4px 6px rgba(0,0,0,0.05); cursor:pointer; display:flex; align-items:center; justify-content:space-between; border:2px solid #eef2ff;">
                <div style="text-align:left;">
                    <strong style="display:block; font-size:16px; color:#333;">Bài ${level.level_number}: ${level.title}</strong>
                    <span style="font-size:13px; color:#888;">${level.description}</span>
                </div>
                <button style="background:#667eea; color:white; border:none; padding:8px 16px; border-radius:20px; cursor:pointer;">Vào học</button>
            </div>
        `;
    });

    html += '</div></div></div>';
    container.innerHTML = html;

    levels.forEach(l => {
        document.getElementById(`btn-level-${l.level_id}`).addEventListener('click', () => startGame(container, l));
    });
}

// --- LOGIC GAME CHÍNH ---
function startGame(container, level) {
    // Config từ DB
    const MIN_VAL = level.config.min || 1;
    const MAX_VAL = level.config.max || 10;
    const TOTAL_QUESTIONS = 10; // Chơi 10 câu rồi tính điểm

    container.innerHTML = `
    <div class="demso-container">
      <div class="game-container">
        <div class="game-header">
            <button id="btn-back-menu" style="float:left; border:none; background:none; font-size:20px; cursor:pointer;"><i class="fas fa-arrow-left"></i></button>
            <h1><i class="fas fa-calculator"></i> Đếm Icon</h1>
        </div>

        <div class="game-stats">
            <div class="stat">
                <div class="stat-label">Câu</div>
                <div class="stat-value" id="qNum">1/${TOTAL_QUESTIONS}</div>
            </div>
            <div class="stat">
                <div class="stat-label">Đúng</div>
                <div class="stat-value correct" id="correctCount">0</div>
            </div>
            <div class="stat">
                <div class="stat-label">Sai</div>
                <div class="stat-value wrong" id="wrongCount">0</div>
            </div>
        </div>

        <div class="question-box">
            <h2>Đếm số hình dưới đây:</h2>
        </div>

        <div class="icons-display" id="iconsDisplay"></div>

        <div class="result-message" id="resultMessage"></div>

        <div class="answers-grid" id="answersGrid"></div>
      </div>
    </div>
    `;

    // Biến game
    let questionCount = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let currentCorrectAnswer = 0;
    let isProcessing = false;

    // Elements
    const iconsDisplay = container.querySelector('#iconsDisplay');
    const answersGrid = container.querySelector('#answersGrid');
    const resultMsg = container.querySelector('#resultMessage');
    const qNumEl = container.querySelector('#qNum');
    const correctEl = container.querySelector('#correctCount');
    const wrongEl = container.querySelector('#wrongCount');

    // Nút Back
    container.querySelector('#btn-back-menu').addEventListener('click', () => {
        if(confirm("Bé muốn dừng bài học này?")) mount(container);
    });

    // Hàm sinh câu hỏi mới
    function nextQuestion() {
        if (questionCount >= TOTAL_QUESTIONS) {
            finishGame();
            return;
        }

        questionCount++;
        qNumEl.textContent = `${questionCount}/${TOTAL_QUESTIONS}`;
        resultMsg.className = 'result-message';
        resultMsg.textContent = '';
        isProcessing = false;

        generateBoard();
    }

    function generateBoard() {
        iconsDisplay.innerHTML = '';
        answersGrid.innerHTML = '';

        // 1. Random số lượng icon (Đáp án đúng)
        currentCorrectAnswer = Math.floor(Math.random() * (MAX_VAL - MIN_VAL + 1)) + MIN_VAL;

        // 2. Chọn loại icon ngẫu nhiên
        const icons = ['fa-apple-alt', 'fa-car', 'fa-cat', 'fa-dog', 'fa-fish', 'fa-ice-cream', 'fa-star', 'fa-heart'];
        const randomIcon = icons[Math.floor(Math.random() * icons.length)];
        const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#ff9f43', '#54a0ff'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        // 3. Vẽ icon
        for (let i = 0; i < currentCorrectAnswer; i++) {
            const iconDiv = document.createElement('div');
            iconDiv.className = 'icon-item';
            iconDiv.innerHTML = `<i class="fas ${randomIcon}" style="color:${randomColor}"></i>`;
            // Animation xuất hiện
            iconDiv.style.animation = `popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${i * 0.05}s forwards`;
            iconDiv.style.opacity = '0';
            iconsDisplay.appendChild(iconDiv);
        }

        // 4. Tạo 4 đáp án (1 đúng + 3 sai)
        let options = [currentCorrectAnswer];
        while (options.length < 4) {
            let num = Math.floor(Math.random() * (MAX_VAL + 5 - 1)) + 1; // Random rộng ra chút
            if (!options.includes(num) && num > 0) {
                options.push(num);
            }
        }
        options.sort(() => Math.random() - 0.5);

        // 5. Vẽ nút đáp án
        options.forEach(num => {
            const btn = document.createElement('button');
            btn.className = 'answer-btn';
            btn.textContent = num;
            btn.onclick = () => checkAnswer(num, btn);
            answersGrid.appendChild(btn);
        });
    }

    function checkAnswer(selectedNum, btnElement) {
        if (isProcessing) return;
        isProcessing = true;

        if (selectedNum === currentCorrectAnswer) {
            // ĐÚNG
            correctCount++;
            correctEl.textContent = correctCount;
            btnElement.classList.add('correct');
            resultMsg.textContent = 'Chính xác! 🎉';
            resultMsg.classList.add('correct', 'show');
            playSound('correct');
        } else {
            // SAI
            wrongCount++;
            wrongEl.textContent = wrongCount;
            btnElement.classList.add('wrong');
            resultMsg.textContent = `Sai rồi! Có ${currentCorrectAnswer} hình cơ!`;
            resultMsg.classList.add('incorrect', 'show');
            playSound('wrong');
            
            // Highlight đáp án đúng
            const allBtns = answersGrid.querySelectorAll('.answer-btn');
            allBtns.forEach(b => {
                if (parseInt(b.textContent) === currentCorrectAnswer) b.classList.add('correct');
            });
        }

        // Chuyển câu sau 1.5s
        setTimeout(nextQuestion, 1500);
    }

    async function finishGame() {
        container.innerHTML = '<div class="loading">Đang tính điểm...</div>';
        
        // Tính điểm: Mỗi câu đúng 10 điểm
        const score = correctCount * 10;
        let stars = 1;
        if (score >= 80) stars = 3;
        else if (score >= 50) stars = 2;

        const isPassed = score >= 50;

        // Gửi kết quả lên Server
        await submitGameResult(level.level_id, 'dem-so', score, stars, isPassed);

        // Hiện bảng kết quả
        container.innerHTML = `
            <div class="demso-container">
                <div class="game-container" style="text-align:center; padding-top:50px;">
                    <div style="font-size:60px; margin-bottom:20px;">${score >= 50 ? '🏆' : '😅'}</div>
                    <h2 style="color:#333; margin-bottom:10px;">Hoàn thành bài tập!</h2>
                    <p style="font-size:18px; color:#666;">Bé trả lời đúng <strong>${correctCount}/10</strong> câu</p>
                    <div style="font-size:40px; margin:20px 0; letter-spacing:5px;">${'⭐'.repeat(stars)}</div>
                    <div style="font-size:24px; color:#667eea; font-weight:bold; margin-bottom:30px;">+${score} Điểm</div>
                    
                    <button id="btn-replay" style="background:#4ecdc4; color:white; border:none; padding:12px 30px; border-radius:25px; font-size:16px; cursor:pointer; margin-right:10px;">Chơi Lại</button>
                    <button id="btn-back" style="background:#ff6b6b; color:white; border:none; padding:12px 30px; border-radius:25px; font-size:16px; cursor:pointer;">Chọn Bài Khác</button>
                </div>
            </div>
        `;

        document.getElementById('btn-replay').onclick = () => startGame(container, level);
        document.getElementById('btn-back').onclick = () => mount(container);
    }

    function playSound(type) {
        const sounds = {
            correct: './assets/sound/sound_correct.mp3',
            wrong: './assets/sound/sound_wrong.mp3'
        };
        const audio = new Audio(sounds[type]);
        audio.volume = 0.5;
        audio.play().catch(() => {});
    }

    // Bắt đầu game
    nextQuestion();
}

export function unmount(container) {
    // Cleanup nếu cần
}

/*
export function mount(container) {
  if (!container) return;
  // ensure css is loaded
  if (!document.querySelector('link[data-panel="dem-so"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './panels/dem-so/style.css';
    link.setAttribute('data-panel','dem-so');
    document.head.appendChild(link);
  }

  // root markup (scoped to panel container)
  container.innerHTML = `
    <div class="demso-container">
      <div class="game-container">
        <!-- Header nhỏ gọn -->
        <div class="game-header">
            <h1><i class="fas fa-calculator"></i> Đếm Icon</h1>
        </div>

        <!-- Stats nhỏ gọn -->
        <div class="game-stats">
            <div class="stat">
                <div class="stat-label">Câu</div>
                <div class="stat-value" id="questionNumber">1</div>
            </div>
            <div class="stat">
                <div class="stat-label">Đúng</div>
                <div class="stat-value correct" id="correctCount">0</div>
            </div>
            <div class="stat">
                <div class="stat-label">Sai</div>
                <div class="stat-value wrong" id="wrongCount">0</div>
            </div>
        </div>

        <!-- Câu hỏi -->
        <div class="question-box">
            <h2>Đếm số hình dưới đây:</h2>
        </div>

        <!-- Hiển thị icon - CHIẾM NHIỀU KHÔNG GIAN -->
        <div class="icons-display" id="iconsContainer">
            <!-- Icon sẽ được tạo bằng JavaScript -->
        </div>

        <!-- 4 ĐÁP ÁN TRẮC NGHIỆM - CHIẾM NHIỀU KHÔNG GIAN -->
        <div class="answers-section">
            <h3>Chọn số lượng đúng:</h3>
            <div class="answers-grid" id="answersContainer">
                <!-- Các đáp án sẽ được tạo bằng JavaScript -->
            </div>
        </div>

        <!-- Điều khiển -->
        <div class="controls">
            <div class="result-message" id="resultMessage"></div>
            <button id="nextBtn" class="control-btn next-btn">
                <i class="fas fa-forward"></i> Tiếp theo
            </button>
            <button id="restartBtn" class="control-btn restart-btn">
                <i class="fas fa-redo"></i> Làm lại
            </button>
        </div>
      </div>
    </div>
  `;

  // ================================
  // GAME LOGIC (scoped to container)
  // ================================
  const iconTypes = [
    { icon: "fas fa-apple-alt", color: "#ff6b6b" },
    { icon: "fas fa-lemon", color: "#FF9800" },
    { icon: "fas fa-star", color: "#FFC107" },
    { icon: "fas fa-heart", color: "#f44336" },
    { icon: "fas fa-cloud", color: "#2196F3" },
    { icon: "fas fa-sun", color: "#FFC107" },
    { icon: "fas fa-moon", color: "#607D8B" },
    { icon: "fas fa-tree", color: "#4CAF50" },
    { icon: "fas fa-gem", color: "#9C27B0" },
    { icon: "fas fa-snowflake", color: "#03A9F4" }
  ];

  // state
  let questionNumber = 1;
  let correctCount = 0;
  let wrongCount = 0;
  let isAnswered = false;
  let currentCorrectAnswer = 0;
  let currentIconsData = [];
  let currentIconType = null;
  let autoNextTimeout = null;

  // dom (scoped)
  const questionNumberElement = container.querySelector('#questionNumber');
  const correctCountElement = container.querySelector('#correctCount');
  const wrongCountElement = container.querySelector('#wrongCount');
  const iconsContainer = container.querySelector('#iconsContainer');
  const answersContainer = container.querySelector('#answersContainer');
  const nextBtn = container.querySelector('#nextBtn');
  const restartBtn = container.querySelector('#restartBtn');
  const resultMessageElement = container.querySelector('#resultMessage');

  // audio helper (tracks current audio so it can be stopped on cleanup)
  let currentAudio = null;
  function playSoundFile(filename) {
    return new Promise(resolve => {
      try {
        if (currentAudio) { try { currentAudio.pause(); currentAudio.currentTime = 0; } catch(e){} currentAudio = null; }
        const audio = new Audio(`assets/sound/${filename}`);
        currentAudio = audio;
        const finish = () => { if (currentAudio === audio) currentAudio = null; resolve(); };
        audio.addEventListener('ended', finish);
        audio.addEventListener('error', finish);
        const p = audio.play(); if (p && typeof p.then === 'function') p.catch(() => finish());
      } catch (e) { currentAudio = null; resolve(); }
    });
  }

  function initGame() {
    questionNumber = 1;
    correctCount = 0;
    wrongCount = 0;
    isAnswered = false;
    if (autoNextTimeout) { clearTimeout(autoNextTimeout); autoNextTimeout = null; }
    updateStats();
    generateNewQuestion();
    resultMessageElement.textContent = '';
    resultMessageElement.className = 'result-message';
    resultMessageElement.classList.remove('show');
  }

  function generateNewQuestion() {
    isAnswered = false;
    resultMessageElement.textContent = '';
    resultMessageElement.className = 'result-message';
    resultMessageElement.classList.remove('show');
    questionNumberElement.textContent = questionNumber;
    currentIconType = iconTypes[getRandomNumber(0, iconTypes.length - 1)];
    currentCorrectAnswer = getRandomNumber(1, 20);
    currentIconsData = [];
    for (let i = 0; i < currentCorrectAnswer; i++) {
      currentIconsData.push({ icon: currentIconType.icon, color: currentIconType.color, index: i });
    }
    displayIcons();
    generateAnswers();
  }

  function displayIcons() {
    iconsContainer.innerHTML = '';
    currentIconsData.forEach((iconData, index) => {
      const elem = document.createElement('div');
      elem.className = 'icon-item';
      elem.style.setProperty('--i', index);
      const iEl = document.createElement('i');
      iEl.className = iconData.icon;
      iEl.style.color = iconData.color;
      elem.appendChild(iEl);
      iconsContainer.appendChild(elem);
    });
  }

  function generateAnswers() {
    answersContainer.innerHTML = '';
    const answers = [currentCorrectAnswer];
    while (answers.length < 4) {
      let wrongAnswer;
      const offset = getRandomNumber(1, 3);
      const shouldAdd = Math.random() > 0.5;
      wrongAnswer = shouldAdd ? currentCorrectAnswer + offset : currentCorrectAnswer - offset;
      if (wrongAnswer >= 1 && wrongAnswer <= 20 && !answers.includes(wrongAnswer)) answers.push(wrongAnswer);
    }
    const shuffled = shuffleArray([...answers]);
    shuffled.forEach(ans => {
      const btn = document.createElement('button');
      btn.className = 'answer-btn';
      btn.textContent = ans;
      btn.dataset.answer = ans;
      btn.dataset.correct = ans === currentCorrectAnswer ? 'true' : 'false';
      const handleClick = () => handleAnswerClick(btn);
      btn.addEventListener('click', handleClick);
      answersContainer.appendChild(btn);
    });
  }

  function handleAnswerClick(clickedButton) {
    if (isAnswered) return;
    isAnswered = true;
    const isCorrect = clickedButton.dataset.correct === 'true';
    const allBtns = container.querySelectorAll('.answer-btn');
    allBtns.forEach(button => {
      button.classList.add('answered');
      if (button.dataset.correct === 'true') button.classList.add('correct');
      else if (button === clickedButton && !isCorrect) button.classList.add('incorrect');
      button.disabled = true;
    });
    if (isCorrect) {
      correctCount++;
      resultMessageElement.textContent = '🎉 Chính xác!';
      resultMessageElement.classList.add('correct');
      // play long correct sound then next
      playSoundFile('sound_correct_answer_long.mp3').then(() => nextQuestion());
    } else {
      wrongCount++;
      resultMessageElement.textContent = '❌ Sai rồi!';
      resultMessageElement.classList.add('incorrect');
      // play wrong long sound then next
      playSoundFile('sound_wrong_answer_long.mp3').then(() => nextQuestion());
    }
    resultMessageElement.classList.add('show');
    updateStats();
  }

  function updateStats() {
    correctCountElement.textContent = correctCount;
    wrongCountElement.textContent = wrongCount;
  }

  function nextQuestion() {
    if (autoNextTimeout) { clearTimeout(autoNextTimeout); autoNextTimeout = null; }
    questionNumber++;
    generateNewQuestion();
  }

  function getRandomNumber(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function shuffleArray(array) { const s = [...array]; for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [s[i], s[j]] = [s[j], s[i]]; } return s; }

  // events
  nextBtn.addEventListener('click', nextQuestion);
  restartBtn.addEventListener('click', initGame);

  // start
  initGame();

  // cleanup
  container._demSoCleanup = () => {
    nextBtn.removeEventListener('click', nextQuestion);
    restartBtn.removeEventListener('click', initGame);
    if (autoNextTimeout) { clearTimeout(autoNextTimeout); autoNextTimeout = null; }
    try { if (currentAudio) { currentAudio.pause(); currentAudio.currentTime = 0; currentAudio = null; } } catch(e) {}
    delete container._demSoCleanup;
  };
}

export function unmount(container) { if (!container) return; if (container._demSoCleanup) container._demSoCleanup(); }
*/