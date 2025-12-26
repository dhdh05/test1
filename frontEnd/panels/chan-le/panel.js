import { callAPI, submitGameResult } from '../../js/utils.js';

// Load CSS một lần duy nhất
function loadStyles() {
    if (!document.querySelector('link[data-panel="chan-le"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = './panels/chan-le/style.css';
        link.setAttribute('data-panel', 'chan-le');
        document.head.appendChild(link);
    }
}

export async function mount(container) {
    if (!container) return;
    loadStyles();

    container.innerHTML = '<div class="loading">⏳ Đang tải các cấp độ...</div>';

    // 1. Gọi API lấy danh sách bài học Chẵn Lẻ
    const res = await callAPI('/games/levels/chan-le');
    
    if (!res || !res.success) {
        container.innerHTML = '<div class="panel-error">❌ Lỗi tải dữ liệu. Bạn đã chạy lệnh SQL chưa?</div>';
        return;
    }

    const levels = res.data;
    renderLevelList(container, levels);
}

function renderLevelList(container, levels) {
    let html = `
        <div class="game-panel" style="padding: 20px;">
            <h2 style="text-align:center; color:#2575fc; margin-bottom:20px;">⚖️ Chọn Cấp Độ Chẵn Lẻ</h2>
            <div class="level-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap:20px;">
    `;

    levels.forEach(level => {
        // level.config = { range: 20, time: 60 }
        html += `
            <div class="level-card" style="background:white; padding:20px; border-radius:15px; box-shadow:0 4px 10px rgba(0,0,0,0.1); text-align:center; cursor:pointer; transition:transform 0.2s;" 
                 onmouseover="this.style.transform='translateY(-5px)'" 
                 onmouseout="this.style.transform='translateY(0)'">
                <div style="font-size:14px; font-weight:bold; color:#ff6b6b; margin-bottom:5px;">LEVEL ${level.level_number}</div>
                <h3 style="margin:10px 0; color:#333;">${level.title}</h3>
                <p style="color:#666; font-size:13px; margin-bottom:15px;">${level.description}</p>
                <button class="btn-play" id="btn-play-${level.level_id}" 
                        style="background:#2575fc; color:white; border:none; padding:10px 20px; border-radius:20px; cursor:pointer;">
                    Chơi Ngay
                </button>
            </div>
        `;
    });

    html += '</div></div>';
    container.innerHTML = html;

    // Gắn sự kiện click vào chơi
    levels.forEach(level => {
        const btn = document.getElementById(`btn-play-${level.level_id}`);
        if(btn) btn.addEventListener('click', () => startGame(container, level));
    });
}

// --- LOGIC GAME CHÍNH (Đã được sửa để dùng Config từ Database) ---
function startGame(container, level) {
    // Lấy cấu hình từ DB (nếu không có thì dùng mặc định)
    const MAX_RANGE = level.config.range || 100;
    const GAME_TIME = level.config.time || 60;

    container.innerHTML = `
    <div class="chanle-game">
      <div class="game-container">
        <div class="game-header">
            <button id="btn-back-menu" style="float:left; background:none; border:none; color:#666; cursor:pointer;"><i class="fas fa-arrow-left"></i> Menu</button>
            <h1><i class="fas fa-sort-numeric-up"></i> Phân Biệt Số Chẵn Lẻ</h1>
            <p class="subtitle">Phạm vi số: ${MAX_RANGE} | Kéo số vào ô tương ứng</p>
        </div>

        <div class="game-stats">
            <div class="stat">
                <div class="stat-icon"><i class="fas fa-clock"></i></div>
                <div class="stat-content">
                    <div class="stat-label">Thời gian</div>
                    <div class="stat-value" id="cl-timer">${GAME_TIME}</div>
                </div>
            </div>
            <div class="stat">
                <div class="stat-icon"><i class="fas fa-star"></i></div>
                <div class="stat-content">
                    <div class="stat-label">Điểm</div>
                    <div class="stat-value" id="cl-score">0</div>
                </div>
            </div>
        </div>

        <div class="game-area">
            <div class="drop-zone even-zone" id="even-zone">
                <div class="zone-label">CHẴN</div>
                <div class="zone-icon"><i class="fas fa-divide"></i></div>
                <div class="zone-desc">Chia hết cho 2</div>
            </div>

            <div class="number-spawner">
                <div class="draggable-number" id="current-number" draggable="true">?</div>
                <div class="spawner-platform"></div>
            </div>

            <div class="drop-zone odd-zone" id="odd-zone">
                <div class="zone-label">LẺ</div>
                <div class="zone-icon"><i class="fas fa-equals"></i></div>
                <div class="zone-desc">Không chia hết cho 2</div>
            </div>
        </div>

        <div class="controls">
            <button class="control-btn even-btn" id="btn-choose-even">Là Số Chẵn</button>
            <button class="control-btn skip-btn" id="btn-next">Bỏ qua</button>
            <button class="control-btn odd-btn" id="btn-choose-odd">Là Số Lẻ</button>
        </div>
      </div>

      <div class="result-modal" id="result-modal" hidden>
        <div class="modal-content">
            <div class="modal-icon">🏆</div>
            <h2>Hết Giờ!</h2>
            <p>Bé đã đạt được <span id="final-score">0</span> điểm</p>
            <div class="stars" id="result-stars">⭐⭐⭐</div>
            <button class="restart-btn" id="btn-restart">Chơi Lại</button>
            <button class="restart-btn" id="btn-back-result" style="background:#666; margin-top:10px;">Về Danh Sách</button>
        </div>
      </div>
    </div>
    `;

    // --- Biến Game ---
    let score = 0;
    let timeLeft = GAME_TIME;
    let timerInterval;
    let currentNumber = 0;
    let isGameActive = true;
    let currentAudio = null;

    // Elements
    const currentNumberElement = container.querySelector('#current-number');
    const scoreElement = container.querySelector('#cl-score');
    const timerElement = container.querySelector('#cl-timer');
    const evenBox = container.querySelector('#even-zone');
    const oddBox = container.querySelector('#odd-zone');
    const modal = container.querySelector('#result-modal');
    const finalScoreEl = container.querySelector('#final-score');
    const nextBtn = container.querySelector('#btn-next');
    const restartBtn = container.querySelector('#btn-restart');
    
    // Nút quay lại
    container.querySelector('#btn-back-menu').addEventListener('click', () => {
        clearInterval(timerInterval);
        mount(container);
    });
    container.querySelector('#btn-back-result').addEventListener('click', () => {
        mount(container);
    });

    // --- Logic Âm thanh ---
    function playSound(type) {
        if (currentAudio) { currentAudio.pause(); currentAudio.currentTime = 0; }
        const sounds = {
            correct: './assets/sound/sound_correct.mp3',
            wrong: './assets/sound/sound_wrong.mp3',
            drag: './assets/sound/sound_drag.mp3'
        };
        if (sounds[type]) {
            currentAudio = new Audio(sounds[type]);
            currentAudio.volume = 0.6;
            currentAudio.play().catch(() => {});
        }
    }

    // --- Logic Game ---
    function initGame() {
        score = 0;
        timeLeft = GAME_TIME;
        isGameActive = true;
        scoreElement.textContent = '0';
        timerElement.textContent = timeLeft;
        timerElement.classList.remove('timer-warning');
        modal.hidden = true;
        generateNumber();
        startTimer();
    }

    function generateNumber() {
        if (!isGameActive) return;
        // Dùng MAX_RANGE từ Database
        currentNumber = Math.floor(Math.random() * MAX_RANGE) + 1;
        
        currentNumberElement.textContent = currentNumber;
        currentNumberElement.classList.remove('dragging', 'correct', 'wrong');
        currentNumberElement.style.opacity = '0';
        currentNumberElement.style.transform = 'scale(0.5)';
        
        setTimeout(() => {
            currentNumberElement.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            currentNumberElement.style.opacity = '1';
            currentNumberElement.style.transform = 'scale(1)';
        }, 50);
    }

    function startTimer() {
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            if (!isGameActive) return;
            timeLeft--;
            timerElement.textContent = timeLeft;

            if (timeLeft <= 5) timerElement.classList.add('timer-warning');

            if (timeLeft <= 0) endGame();
        }, 1000);
    }

    async function endGame() {
        isGameActive = false;
        clearInterval(timerInterval);
        
        // Tính sao
        let stars = 1;
        if (score >= 100) stars = 3;
        else if (score >= 50) stars = 2;

        const isPassed = score >= 30;

        // Lưu kết quả vào DB
        await submitGameResult(level.level_id, 'chan-le', score, stars, isPassed);

        finalScoreEl.textContent = score;
        document.getElementById('result-stars').textContent = '⭐'.repeat(stars);
        modal.hidden = false;
        playSound('correct');
    }

    function checkAnswer(isEvenChoice) {
        if (!isGameActive) return;
        const isEven = currentNumber % 2 === 0;
        const isCorrect = (isEvenChoice && isEven) || (!isEvenChoice && !isEven);

        if (isCorrect) {
            score += 10;
            scoreElement.textContent = score;
            currentNumberElement.classList.add('correct');
            playSound('correct');
            
            // Effect
            const plus = document.createElement('div');
            plus.className = 'floating-score';
            plus.textContent = '+10';
            plus.style.left = currentNumberElement.getBoundingClientRect().left + 'px';
            plus.style.top = currentNumberElement.getBoundingClientRect().top + 'px';
            document.body.appendChild(plus);
            setTimeout(() => plus.remove(), 800);

        } else {
            if (score > 0) score -= 5;
            scoreElement.textContent = score;
            currentNumberElement.classList.add('wrong');
            playSound('wrong');
            
            // Rung màn hình
            container.querySelector('.game-container').classList.add('shake-anim');
            setTimeout(() => container.querySelector('.game-container').classList.remove('shake-anim'), 500);
        }

        setTimeout(generateNumber, 500);
    }

    // --- Drag & Drop Events ---
    function handleDragStart(e) {
        if (!isGameActive) { e.preventDefault(); return; }
        e.dataTransfer.setData('text/plain', currentNumber);
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => currentNumberElement.classList.add('dragging'), 0);
        playSound('drag');
    }

    function handleDragEnd() {
        currentNumberElement.classList.remove('dragging');
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        e.currentTarget.classList.add('drag-over');
    }

    function handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
    }

    function handleDrop(e, isEvenZone) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        checkAnswer(isEvenZone);
    }

    // Event Listeners
    currentNumberElement.addEventListener('dragstart', handleDragStart);
    currentNumberElement.addEventListener('dragend', handleDragEnd);

    evenBox.addEventListener('dragover', handleDragOver);
    evenBox.addEventListener('dragleave', handleDragLeave);
    evenBox.addEventListener('drop', (e) => handleDrop(e, true));

    oddBox.addEventListener('dragover', handleDragOver);
    oddBox.addEventListener('dragleave', handleDragLeave);
    oddBox.addEventListener('drop', (e) => handleDrop(e, false));

    // Nút bấm (Mobile support)
    container.querySelector('#btn-choose-even').addEventListener('click', () => checkAnswer(true));
    container.querySelector('#btn-choose-odd').addEventListener('click', () => checkAnswer(false));
    nextBtn.addEventListener('click', generateNumber);
    restartBtn.addEventListener('click', initGame);

    // --- Cleanup khi thoát ---
    container._chanLeCleanup = () => {
        clearInterval(timerInterval);
        isGameActive = false;
        if (currentAudio) { currentAudio.pause(); }
    };

    // Bắt đầu game ngay
    initGame();
}

export function unmount(container) {
    if (container && container._chanLeCleanup) {
        container._chanLeCleanup();
    }
}


/*
export function mount(container) {
  if (!container) return;
  // load css once
  if (!document.querySelector('link[data-panel="chan-le"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './panels/chan-le/style.css';
    link.setAttribute('data-panel', 'chan-le');
    document.head.appendChild(link);
  }

  container.innerHTML = `
    <div class="chanle-game">
      <div class="game-container">
        <div class="game-header">
            <h1><i class="fas fa-sort-numeric-up"></i> Phân Biệt Số Chẵn Lẻ</h1>
            <p class="subtitle">Kéo số vào ô tương ứng chẵn hoặc lẻ</p>
        </div>

        <div class="game-stats">
            <div class="stat">
                <div class="stat-icon">
                    <i class="fas fa-clock"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-label">Thời gian</div>
                    <div class="stat-value" id="cl-timer">15</div>
                </div>
            </div>
            <div class="stat">
                <div class="stat-icon">
                    <i class="fas fa-star"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-label">Điểm</div>
                    <div class="stat-value" id="cl-score">0</div>
                </div>
            </div>
            <div class="stat">
                <div class="stat-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-label">Đúng</div>
                    <div class="stat-value" id="cl-correct">0</div>
                </div>
            </div>
            <div class="stat">
                <div class="stat-icon">
                    <i class="fas fa-times-circle"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-label">Sai</div>
                    <div class="stat-value" id="cl-wrong">0</div>
                </div>
            </div>
        </div>

        <div class="game-area">
            <div class="target-box even-box" id="cl-evenBox">
                <div class="target-label">
                    
                    <h2>CHẴN</h2>
                </div>
                <div class="target-instruction">Kéo thả vào đây</div>
                <div class="result-message" id="cl-evenResult"></div>
            </div>

            <div class="number-display">
                <div class="current-number" id="cl-currentNumber">0</div>
                <div class="number-label">Kéo số vào ô tương ứng</div>
            </div>

            <div class="target-box odd-box" id="cl-oddBox">
                <div class="target-label">
                    
                    <h2>LẺ</h2>
                </div>
                <div class="target-instruction">Kéo thả vào đây</div>
                <div class="result-message" id="cl-oddResult"></div>
            </div>
        </div>

        <div class="game-controls">
            <div class="hint">
                <i class="fas fa-lightbulb"></i> Kéo số hình tròn sang trái (chẵn) hoặc phải (lẻ)
            </div>
            <button id="cl-nextBtn" class="next-btn">
                <i class="fas fa-forward"></i> Câu tiếp theo
            </button>
            <button id="cl-restartBtn" class="restart-btn">
                <i class="fas fa-redo"></i> Chơi lại
            </button> 
        </div>
      </div>
    </div>
  `;

  // state
  let score = 0;
  let correctAnswers = 0;
  let wrongAnswers = 0;
  let timeLeft = 15;
  let timerInterval = null;
  let isGameActive = true;
  let currentNumber = 0;
  let currentAnswer = '';
  let isAnswered = false;

  // dom
  const timerElement = container.querySelector('#cl-timer');
  const scoreElement = container.querySelector('#cl-score');
  const correctElement = container.querySelector('#cl-correct');
  const wrongElement = container.querySelector('#cl-wrong');
  const currentNumberElement = container.querySelector('#cl-currentNumber');
  const evenResultElement = container.querySelector('#cl-evenResult');
  const oddResultElement = container.querySelector('#cl-oddResult');
  const evenBox = container.querySelector('#cl-evenBox');
  const oddBox = container.querySelector('#cl-oddBox');
  const nextBtn = container.querySelector('#cl-nextBtn');
  const restartBtn = container.querySelector('#cl-restartBtn');

  // audio helper (tracks current audio so it can be stopped on cleanup)
  let currentAudio = null;
  function playSoundFile(filename) {
    return new Promise(resolve => {
      try {
        // stop any previously playing audio for this panel
        if (currentAudio) {
          try { currentAudio.pause(); currentAudio.currentTime = 0; } catch (e) {}
          currentAudio = null;
        }
        const audio = new Audio(`assets/sound/${filename}`);
        currentAudio = audio;
        const finish = () => { if (currentAudio === audio) currentAudio = null; resolve(); };
        audio.addEventListener('ended', finish);
        audio.addEventListener('error', finish);
        const p = audio.play(); if (p && typeof p.then === 'function') p.catch(() => finish());
      } catch (e) { currentAudio = null; resolve(); }
    });
  }

  // helpers
  function updateStats() {
    scoreElement.textContent = score;
    correctElement.textContent = correctAnswers;
    wrongElement.textContent = wrongAnswers;
    timerElement.textContent = timeLeft;
  }

  function generateNewNumber() {
    currentNumber = Math.floor(Math.random() * 21);
    currentAnswer = currentNumber % 2 === 0 ? 'even' : 'odd';
    currentNumberElement.textContent = currentNumber;
    currentNumberElement.draggable = true;
    // clear any dragging / feedback state
    currentNumberElement.classList.remove('dragging','correct-number','wrong-number');
    isAnswered = false;
    evenBox.classList.remove('drag-over');
    oddBox.classList.remove('drag-over');
    evenResultElement.textContent = '';
    oddResultElement.textContent = '';
    evenResultElement.className = 'result-message';
    oddResultElement.className = 'result-message';
  }

  function startTimer() {
    clearInterval(timerInterval);
    timeLeft = 15;
    timerElement.textContent = timeLeft;
    timerElement.classList.remove('timer-warning');

    timerInterval = setInterval(() => {
      if (!isGameActive) { clearInterval(timerInterval); return; }
      timeLeft--;
      timerElement.textContent = timeLeft;
      if (timeLeft <= 5) timerElement.classList.add('timer-warning');
      if (timeLeft <= 0) handleTimeout();
    }, 1000);
  }

  function handleTimeout() {
    if (isAnswered) return;
    isAnswered = true;
    clearInterval(timerInterval);
    // indicate wrong on the number itself
    currentNumberElement.classList.add('wrong-number');
    currentNumberElement.draggable = false;
    if (currentAnswer === 'even') {
      evenResultElement.textContent = 'Đáp án đúng!';
      evenResultElement.classList.add('correct');
      oddResultElement.textContent = 'Sai';
      oddResultElement.classList.add('wrong');
    } else {
      oddResultElement.textContent = 'Đáp án đúng!';
      oddResultElement.classList.add('correct');
      evenResultElement.textContent = 'Sai';
      evenResultElement.classList.add('wrong');
    }
    wrongAnswers++;
    updateStats();
    // play wrong long sound then next
    playSoundFile('sound_wrong_answer_long.mp3').then(() => nextQuestion());
  }

  function nextQuestion() {
    if (!isGameActive) return;
    startTimer();
    generateNewNumber();
  }

  // drag/drop handlers
  function handleDragStart(e) {
    if (!isGameActive || isAnswered) { e.preventDefault(); return; }
    try { e.dataTransfer.setData('text/plain', currentNumber); } catch (err) {}
    currentNumberElement.classList.add('dragging');
  }

  function handleDragOver(e) {
    if (!isGameActive || isAnswered) { e.preventDefault(); return; }
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (e.target.closest('.even-box')) { evenBox.classList.add('drag-over'); oddBox.classList.remove('drag-over'); }
    else if (e.target.closest('.odd-box')) { oddBox.classList.add('drag-over'); evenBox.classList.remove('drag-over'); }
  }

  function handleDragLeave(e) {
    if (!e.target.closest('.even-box') && !e.target.closest('.odd-box')) { evenBox.classList.remove('drag-over'); oddBox.classList.remove('drag-over'); }
  }

  function handleDrop(e) {
    if (!isGameActive || isAnswered) { e.preventDefault(); return; }
    e.preventDefault();
    let droppedBox = null; let userAnswer = '';
    if (e.target.closest('.even-box')) { droppedBox = evenBox; userAnswer = 'even'; }
    else if (e.target.closest('.odd-box')) { droppedBox = oddBox; userAnswer = 'odd'; }
    if (!droppedBox) return;
    evenBox.classList.remove('drag-over'); oddBox.classList.remove('drag-over');
    checkAnswer(userAnswer, droppedBox);
  }

  function checkAnswer(userAnswer, targetBox) {
    if (isAnswered) return;
    isAnswered = true; clearInterval(timerInterval); currentNumberElement.draggable = false; currentNumberElement.classList.remove('dragging');
    const isCorrect = userAnswer === currentAnswer;
    if (isCorrect) {
      score++; correctAnswers++;
      currentNumberElement.classList.add('correct-number');
      if (targetBox === evenBox) { evenResultElement.textContent = 'Đúng rồi!'; evenResultElement.classList.add('correct'); oddResultElement.textContent = ''; }
      else { oddResultElement.textContent = 'Đúng rồi!'; oddResultElement.classList.add('correct'); evenResultElement.textContent = ''; }
    } else {
      wrongAnswers++;
      currentNumberElement.classList.add('wrong-number');
      if (targetBox === evenBox) {
        evenResultElement.textContent = 'Sai rồi!'; evenResultElement.classList.add('wrong');
        if (currentAnswer === 'odd') { oddResultElement.textContent = 'Đáp án đúng!'; oddResultElement.classList.add('correct'); }
      } else {
        oddResultElement.textContent = 'Sai rồi!'; oddResultElement.classList.add('wrong');
        if (currentAnswer === 'even') { evenResultElement.textContent = 'Đáp án đúng!'; evenResultElement.classList.add('correct'); }
      }
    }
    updateStats();
    const soundFile = isCorrect ? 'sound_correct_answer_long.mp3' : 'sound_wrong_answer_long.mp3';
    playSoundFile(soundFile).then(() => nextQuestion());
  }



  // touch handlers
  function initTouchEvents() {
    let touchStartX = 0; let touchStartY = 0;
    function touchStartHandler(e) {
      if (!isGameActive || isAnswered) return;
      const touch = e.touches[0]; touchStartX = touch.clientX; touchStartY = touch.clientY;
      currentNumberElement.classList.add('dragging'); e.preventDefault();
    }
    function touchEndHandler(e) {
      if (!isGameActive || isAnswered || !currentNumberElement.classList.contains('dragging')) return;
      const touch = e.changedTouches[0]; const touchEndX = touch.clientX; const touchEndY = touch.clientY; const deltaX = touchEndX - touchStartX; const deltaY = touchEndY - touchStartY;
      if (Math.abs(deltaX) > 50 || Math.abs(deltaY) > 50) {
        let userAnswer = ''; let targetBox = null;
        if (deltaX < -50 && Math.abs(deltaX) > Math.abs(deltaY)) { userAnswer = 'even'; targetBox = evenBox; }
        else if (deltaX > 50 && Math.abs(deltaX) > Math.abs(deltaY)) { userAnswer = 'odd'; targetBox = oddBox; }
        if (userAnswer && targetBox) checkAnswer(userAnswer, targetBox);
      }
      currentNumberElement.classList.remove('dragging'); evenBox.classList.remove('drag-over'); oddBox.classList.remove('drag-over'); e.preventDefault();
    }

    currentNumberElement.addEventListener('touchstart', touchStartHandler, { passive: false });
    currentNumberElement.addEventListener('touchend', touchEndHandler, { passive: false });

    function evenTouchStart() { if (!isGameActive || isAnswered) return; evenBox.classList.add('drag-over'); }
    function oddTouchStart() { if (!isGameActive || isAnswered) return; oddBox.classList.add('drag-over'); }
    evenBox.addEventListener('touchstart', evenTouchStart);
    oddBox.addEventListener('touchstart', oddTouchStart);

    function docTouchEnd() { evenBox.classList.remove('drag-over'); oddBox.classList.remove('drag-over'); }
    document.addEventListener('touchend', docTouchEnd);

    // store to remove later
    container._clTouch = { touchStartHandler, touchEndHandler, evenTouchStart, oddTouchStart, docTouchEnd };
  }

  // wire up events
  currentNumberElement.addEventListener('dragstart', handleDragStart);
  evenBox.addEventListener('dragover', handleDragOver);
  evenBox.addEventListener('dragleave', handleDragLeave);
  evenBox.addEventListener('drop', handleDrop);
  oddBox.addEventListener('dragover', handleDragOver);
  oddBox.addEventListener('dragleave', handleDragLeave);
  oddBox.addEventListener('drop', handleDrop);

  nextBtn.addEventListener('click', nextQuestion);
  restartBtn.addEventListener('click', () => { isGameActive = false; clearInterval(timerInterval); setTimeout(() => { initGame(); }, 300); });

  initTouchEvents();

  // start the game
  generateNewNumber();
  startTimer();

  // cleanup
  container._chanLeCleanup = () => {
    clearInterval(timerInterval);
    currentNumberElement.removeEventListener('dragstart', handleDragStart);
    evenBox.removeEventListener('dragover', handleDragOver);
    evenBox.removeEventListener('dragleave', handleDragLeave);
    evenBox.removeEventListener('drop', handleDrop);
    oddBox.removeEventListener('dragover', handleDragOver);
    oddBox.removeEventListener('dragleave', handleDragLeave);
    oddBox.removeEventListener('drop', handleDrop);
    nextBtn.removeEventListener('click', nextQuestion);
    restartBtn.removeEventListener('click', () => { isGameActive = false; clearInterval(timerInterval); setTimeout(() => { initGame(); }, 300); });


    // touch cleanup
    if (container._clTouch) {
      currentNumberElement.removeEventListener('touchstart', container._clTouch.touchStartHandler);
      currentNumberElement.removeEventListener('touchend', container._clTouch.touchEndHandler);
      evenBox.removeEventListener('touchstart', container._clTouch.evenTouchStart);
      oddBox.removeEventListener('touchstart', container._clTouch.oddTouchStart);
      document.removeEventListener('touchend', container._clTouch.docTouchEnd);
      delete container._clTouch;
    }

    try { currentNumberElement.draggable = false; } catch(e) {}
    // stop any playing audio
    try { if (currentAudio) { currentAudio.pause(); currentAudio.currentTime = 0; currentAudio = null; } } catch(e) {}
    delete container._chanLeCleanup;
  };
}

export function unmount(container) { if (!container) return; if (container._chanLeCleanup) container._chanLeCleanup(); }
*/