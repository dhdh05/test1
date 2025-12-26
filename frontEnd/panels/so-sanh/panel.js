import { callAPI, submitGameResult } from '../../js/utils.js';

// Load CSS
function loadStyles() {
  if (!document.querySelector('link[data-panel="so-sanh"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './panels/so-sanh/style.css';
    link.setAttribute('data-panel','so-sanh');
    document.head.appendChild(link);
  }
}

// 1. MOUNT: Lấy danh sách Level
export async function mount(container) {
  if (!container) return;
  loadStyles();

  container.innerHTML = '<div class="loading">⏳ Đang tải bài tập so sánh...</div>';

  // Gọi API lấy level
  const res = await callAPI('/games/levels/so-sanh');
  
  // Safe Mode: Nếu không có DB thì dùng dữ liệu giả
  let levels = (res && res.success) ? res.data : [
      { level_id: 999, title: "Luyện tập (Offline)", description: "Phạm vi 10", config: { max: 10 } }
  ];

  renderLevelList(container, levels);
}

// 2. Vẽ danh sách chọn Level
function renderLevelList(container, levels) {
    let html = `
        <div class="sosanh-container" style="display:block; overflow-y:auto;">
            <div style="max-width:600px; margin:0 auto; text-align:center; padding-top:20px;">
                <h1 style="color:#2575fc; font-family:'Fredoka One', cursive; margin-bottom:10px; font-size: 2rem;">⚖️ Bé Tập So Sánh</h1>
                <p style="color:#666; margin-bottom:30px;">Chọn bài học phù hợp với bé nhé!</p>
                <div style="display:grid; gap:15px; padding:0 20px;">
    `;

    levels.forEach(level => {
        html += `
            <div class="level-card" id="btn-start-${level.level_id}"
                 style="background:white; padding:20px; border-radius:15px; box-shadow:0 8px 20px rgba(37, 117, 252, 0.15); cursor:pointer; text-align:left; transition:transform 0.2s; border:2px solid #eef1ff; display:flex; align-items:center; justify-content:space-between;">
                <div>
                    <strong style="font-size:18px; color:#2575fc; display:block;">${level.title}</strong>
                    <div style="font-size:14px; color:#888;">${level.description}</div>
                </div>
                <button style="background:#2575fc; color:white; border:none; padding:10px 20px; border-radius:25px; cursor:pointer; font-weight:bold; box-shadow:0 4px 10px rgba(37, 117, 252, 0.3);">Bắt đầu</button>
            </div>
        `;
    });

    html += '</div></div></div>';
    container.innerHTML = html;

    levels.forEach(l => {
        document.getElementById(`btn-start-${l.level_id}`).addEventListener('click', () => startGame(container, l));
    });
}

// 3. LOGIC GAME
function startGame(container, level) {
    // Config
    const MAX_VAL = (level.config && level.config.max) || 10;
    const TOTAL_QUESTIONS = 10; // Mỗi màn chơi 10 câu

    container.innerHTML = `
    <div class="sosanh-container">
      <div class="game-container">
        <div class="game-header">
            <button id="btn-back" style="position:absolute; left:15px; top:15px; background:none; border:none; font-size:1.5rem; color:#2575fc; cursor:pointer;"><i class="fas fa-arrow-left"></i></button>
            <h1>So Sánh Số (Phạm vi ${MAX_VAL})</h1>
        </div>

        <div class="game-stats">
            <div class="stat">
                <div class="stat-label">Câu</div>
                <div class="stat-value"><span id="sosanh-questionNumber">1</span>/${TOTAL_QUESTIONS}</div>
            </div>
            <div class="stat">
                <div class="stat-label">Đúng</div>
                <div class="stat-value correct" id="sosanh-correctCount">0</div>
            </div>
            <div class="stat">
                <div class="stat-label">Sai</div>
                <div class="stat-value wrong" id="sosanh-wrongCount">0</div>
            </div>
        </div>

        <div class="numbers-display">
            <div class="number-box left-box" id="sosanh-leftNumber">
                <div class="number-value">0</div>
            </div>
            
            <div class="comparison-box" id="sosanh-comparisonBox">
                <div class="question-mark">?</div>
                <div class="answer-symbol" id="sosanh-answerSymbol"></div>
            </div>
            
            <div class="number-box right-box" id="sosanh-rightNumber">
                <div class="number-value">0</div>
            </div>
        </div>

        <div class="question-box">
            <h2>Số bên trái <span class="highlight">?</span> số bên phải</h2>
        </div>

        <div class="answers-section">
            <h3>Chọn đáp án đúng:</h3>
            <div class="answers-container">
                <button class="answer-btn larger-btn" id="sosanh-largerBtn">
                    <i class="fas fa-greater-than"></i> Lớn hơn
                </button>
                <button class="answer-btn equal-btn" id="sosanh-equalBtn" style="background:#ffd54f; color:#333;">
                    <i class="fas fa-equals"></i> Bằng
                </button>
                <button class="answer-btn smaller-btn" id="sosanh-smallerBtn">
                    <i class="fas fa-less-than"></i> Bé hơn
                </button>
            </div>
        </div>
      </div>
      
      <div id="result-modal" class="modal hidden" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:none; justify-content:center; align-items:center; z-index:1000;">
        <div style="background:white; padding:30px; border-radius:20px; text-align:center; width:90%; max-width:400px; box-shadow:0 10px 25px rgba(0,0,0,0.2);">
            <h2 style="color:#2575fc; margin-bottom:10px;">Hoàn Thành!</h2>
            <div style="font-size:3rem; margin:10px;">🏆</div>
            <p style="font-size:1.2rem; color:#666;">Bé trả lời đúng: <b id="final-correct">0</b>/10</p>
            <div id="star-rating" style="font-size:2rem; color:#FFD700; margin:15px 0;">⭐⭐⭐</div>
            <button id="btn-finish-back" style="background:#2575fc; color:white; padding:12px 30px; border:none; border-radius:25px; font-size:1.1rem; cursor:pointer;">Về Danh Sách</button>
        </div>
      </div>
    </div>
    `;

    // --- VARIABLES ---
    let questionNumber = 1;
    let correctCount = 0;
    let wrongCount = 0;
    let isAnswered = false;
    let leftNumber = 0;
    let rightNumber = 0;
    let correctAnswer = ''; // 'larger', 'smaller', 'equal'
    let autoNextTimeout = null;
    let startTime = Date.now();

    const questionNumberElement = container.querySelector('#sosanh-questionNumber');
    const correctCountElement = container.querySelector('#sosanh-correctCount');
    const wrongCountElement = container.querySelector('#sosanh-wrongCount');
    const leftNumberElement = container.querySelector('#sosanh-leftNumber').querySelector('.number-value');
    const rightNumberElement = container.querySelector('#sosanh-rightNumber').querySelector('.number-value');
    const comparisonBox = container.querySelector('#sosanh-comparisonBox');
    const answerSymbol = container.querySelector('#sosanh-answerSymbol');
    
    const largerBtn = container.querySelector('#sosanh-largerBtn');
    const smallerBtn = container.querySelector('#sosanh-smallerBtn');
    const equalBtn = container.querySelector('#sosanh-equalBtn'); // Thêm nút bằng
    const modal = container.querySelector('#result-modal');

    // --- AUDIO HELPER ---
    let currentAudio = null;
    function playSoundFile(filename) {
        return new Promise(resolve => {
        try {
            if (currentAudio) { try { currentAudio.pause(); currentAudio.currentTime = 0; } catch(e){} currentAudio = null; }
            const audio = new Audio(`assets/sound/${filename}`);
            currentAudio = audio;
            audio.play().catch(() => {});
        } catch (e) { }
        });
    }

    function initGame() {
        questionNumber = 1; correctCount = 0; wrongCount = 0; isAnswered = false;
        startTime = Date.now();
        generateNewQuestion();
    }

    function generateNewQuestion() {
        if (questionNumber > TOTAL_QUESTIONS) {
            finishGame();
            return;
        }

        isAnswered = false;
        questionNumberElement.textContent = questionNumber;
        
        // Random số
        leftNumber = Math.floor(Math.random() * (MAX_VAL + 1));
        rightNumber = Math.floor(Math.random() * (MAX_VAL + 1));

        // Logic xác định đáp án
        if (leftNumber > rightNumber) correctAnswer = 'larger';
        else if (leftNumber < rightNumber) correctAnswer = 'smaller';
        else correctAnswer = 'equal';

        updateNumbersDisplay();
        resetUI();
    }

    function updateNumbersDisplay() {
        leftNumberElement.textContent = leftNumber;
        rightNumberElement.textContent = rightNumber;
        
        // Hiệu ứng nảy số
        leftNumberElement.style.animation = 'none';
        rightNumberElement.style.animation = 'none';
        setTimeout(() => {
            leftNumberElement.style.animation = 'bounceIn 0.5s';
            rightNumberElement.style.animation = 'bounceIn 0.5s';
        }, 10);
    }

    function resetUI() {
        comparisonBox.classList.remove('show-answer');
        answerSymbol.textContent = '';
        
        [largerBtn, smallerBtn, equalBtn].forEach(btn => {
            btn.classList.remove('correct', 'incorrect');
            btn.disabled = false;
            btn.style.opacity = '1';
        });
    }

    function handleAnswer(userAnswer) {
        if (isAnswered) return;
        isAnswered = true;
        const isCorrect = userAnswer === correctAnswer;

        // Disable buttons
        [largerBtn, smallerBtn, equalBtn].forEach(btn => btn.disabled = true);

        // Show symbol
        if (correctAnswer === 'larger') answerSymbol.textContent = '>';
        else if (correctAnswer === 'smaller') answerSymbol.textContent = '<';
        else answerSymbol.textContent = '=';
        
        comparisonBox.classList.add('show-answer');

        if (isCorrect) {
            correctCount++;
            playSoundFile('sound_correct.mp3');
            // Highlight nút đúng
            if (userAnswer === 'larger') largerBtn.classList.add('correct');
            else if (userAnswer === 'smaller') smallerBtn.classList.add('correct');
            else equalBtn.classList.add('correct');
        } else {
            wrongCount++;
            playSoundFile('sound_wrong.mp3');
            // Highlight nút sai
            if (userAnswer === 'larger') largerBtn.classList.add('incorrect');
            else if (userAnswer === 'smaller') smallerBtn.classList.add('incorrect');
            else equalBtn.classList.add('incorrect');

            // Chỉ nút đúng
            if (correctAnswer === 'larger') largerBtn.classList.add('correct');
            else if (correctAnswer === 'smaller') smallerBtn.classList.add('correct');
            else equalBtn.classList.add('correct');
        }

        updateStats();
        
        // Tự động qua câu sau 1.5s
        autoNextTimeout = setTimeout(() => {
            questionNumber++;
            generateNewQuestion();
        }, 1500);
    }

    async function finishGame() {
        const endTime = Date.now();
        const timeSpent = Math.floor((endTime - startTime) / 1000);

        // Tính sao
        let stars = 1;
        if (correctCount >= 9) stars = 3;
        else if (correctCount >= 5) stars = 2;

        const isPassed = correctCount >= 5;
        const score = correctCount * 10; // 10 điểm 1 câu

        // Gửi kết quả
        await submitGameResult(level.level_id, 'so-sanh', score, stars, isPassed, timeSpent);

        // Hiện popup
        document.getElementById('final-correct').textContent = correctCount;
        document.getElementById('star-rating').textContent = '⭐'.repeat(stars);
        modal.style.display = 'flex';
    }

    function updateStats() { 
        correctCountElement.textContent = correctCount; 
        wrongCountElement.textContent = wrongCount; 
    }

    // Events
    largerBtn.onclick = () => handleAnswer('larger');
    smallerBtn.onclick = () => handleAnswer('smaller');
    equalBtn.onclick = () => handleAnswer('equal');
    
    container.querySelector('#btn-back').onclick = () => {
        if(autoNextTimeout) clearTimeout(autoNextTimeout);
        mount(container);
    };
    
    document.getElementById('btn-finish-back').onclick = () => mount(container);

    // Init
    initGame();

    // Cleanup
    container._soSanhCleanup = () => {
        if (autoNextTimeout) clearTimeout(autoNextTimeout);
    };
}

export function unmount(container) { 
    if (container && container._soSanhCleanup) container._soSanhCleanup(); 
}