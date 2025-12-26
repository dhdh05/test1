import { callAPI, submitGameResult } from '../../js/utils.js';

// Load CSS
function loadStyles() {
  if (!document.querySelector('link[data-panel="xep-so"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './panels/xep-so/style.css';
    link.setAttribute('data-panel','xep-so');
    document.head.appendChild(link);
  }
}

// 1. MOUNT: Lấy danh sách Level
export async function mount(container) {
  if (!container) return;
  loadStyles();

  container.innerHTML = '<div class="loading">⏳ Đang tải bài tập xếp số...</div>';

  // Gọi API lấy level
  const res = await callAPI('/games/levels/xep-so');

  // Safe Mode: Dùng dữ liệu giả nếu lỗi
  let levels = (res && res.success) ? res.data : [
      { level_id: 999, title: "Luyện tập (Offline)", description: "Phạm vi 20", config: { min: 1, max: 20, questions: 5 } }
  ];

  renderLevelList(container, levels);
}

// 2. Vẽ danh sách chọn Level
function renderLevelList(container, levels) {
    let html = `
        <div class="xepso-container" style="display:block; overflow-y:auto;">
            <div style="max-width:600px; margin:0 auto; text-align:center; padding-top:20px;">
                <h1 style="color:#2575fc; font-family:'Fredoka One', cursive; margin-bottom:10px; font-size: 2rem; justify-content:center;">🔢 Bé Tập Sắp Xếp</h1>
                <p style="color:#666; margin-bottom:30px;">Kéo các số vào đúng vị trí từ bé đến lớn nhé!</p>
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
    const MIN_VAL = (level.config && level.config.min) || 1;
    const MAX_VAL = (level.config && level.config.max) || 20;
    const TARGET_QUESTIONS = (level.config && level.config.questions) || 5;

    container.innerHTML = `
    <div class="xepso-container">
      <div class="game-container">
        <div class="game-header">
            <button id="btn-back" style="position:absolute; left:15px; top:15px; background:none; border:none; font-size:1.5rem; color:#2575fc; cursor:pointer;"><i class="fas fa-arrow-left"></i></button>
            <h1><i class="fas fa-sort-numeric-up"></i> Sắp Xếp Số (Phạm vi ${MAX_VAL})</h1>
        </div>

        <div class="game-stats">
            <div class="stat">
                <div class="stat-label">Câu</div>
                <div class="stat-value"><span id="xepso-questionNumber">1</span>/${TARGET_QUESTIONS}</div>
            </div>
            <div class="stat">
                <div class="stat-label">Đúng</div>
                <div class="stat-value correct" id="xepso-correctCount">0</div>
            </div>
            <div class="stat">
                <div class="stat-label">Sai</div>
                <div class="stat-value wrong" id="xepso-wrongCount">0</div>
            </div>
        </div>

        <div class="sequence-section">
            <h3>Kéo số vào vị trí đúng:</h3>
            <div class="number-sequence" id="xepso-numberSequence"></div>
        </div>

        <div class="answers-section">
            <h3>Chọn số để kéo:</h3>
            <div class="draggable-numbers" id="xepso-draggableNumbers"></div>
        </div>
      </div>

      <div id="result-modal" class="modal hidden" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:none; justify-content:center; align-items:center; z-index:1000;">
        <div style="background:white; padding:30px; border-radius:20px; text-align:center; width:90%; max-width:400px; box-shadow:0 10px 25px rgba(0,0,0,0.2);">
            <h2 style="color:#2575fc; margin-bottom:10px;">Hoàn Thành!</h2>
            <div style="font-size:3rem; margin:10px;">🏆</div>
            <p style="font-size:1.2rem; color:#666;">Bé trả lời đúng: <b id="final-correct">0</b>/${TARGET_QUESTIONS}</p>
            <div id="star-rating" style="font-size:2rem; color:#FFD700; margin:15px 0;">⭐⭐⭐</div>
            <button id="btn-finish-back" style="background:#2575fc; color:white; padding:12px 30px; border:none; border-radius:25px; font-size:1.1rem; cursor:pointer;">Về Danh Sách</button>
        </div>
      </div>
    </div>
    `;

    // ---------- Game state (scoped) ----------
    let questionNumber = 1;
    let correctCount = 0;
    let wrongCount = 0;
    let currentSequence = [];
    let hiddenPositions = [];
    let hiddenNumbers = [];
    let draggableNumbers = [];
    let draggedNumber = null;
    let correctSlotsCount = 0;
    let autoNextTimeout = null;
    let startTime = Date.now();

    // dom (scoped)
    const questionNumberElement = container.querySelector('#xepso-questionNumber');
    const correctCountElement = container.querySelector('#xepso-correctCount');
    const wrongCountElement = container.querySelector('#xepso-wrongCount');
    const numberSequence = container.querySelector('#xepso-numberSequence');
    const draggableNumbersContainer = container.querySelector('#xepso-draggableNumbers');
    const modal = container.querySelector('#result-modal');

    // audio helper
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
        questionNumber = 1; correctCount = 0; wrongCount = 0; correctSlotsCount = 0;
        startTime = Date.now();
        if (autoNextTimeout) { clearTimeout(autoNextTimeout); autoNextTimeout = null; }
        updateStats();
        generateNewQuestion();
    }

    function generateNewQuestion() {
        if (questionNumber > TARGET_QUESTIONS) {
            finishGame();
            return;
        }

        currentSequence = []; hiddenPositions = []; hiddenNumbers = []; draggableNumbers = []; draggedNumber = null; correctSlotsCount = 0;
        if (autoNextTimeout) { clearTimeout(autoNextTimeout); autoNextTimeout = null; }
        questionNumberElement.textContent = questionNumber;

        // create 6 unique numbers within range, sorted ascending
        const numbers = new Set();
        // Ensure range is large enough for 6 unique numbers
        const rangeSize = MAX_VAL - MIN_VAL + 1;
        const count = Math.min(6, rangeSize);

        while (numbers.size < count) numbers.add(getRandomNumber(MIN_VAL, MAX_VAL));
        currentSequence = Array.from(numbers).sort((a,b)=>a-b);

        // choose 2-4 random hidden positions
        const numberOfHidden = getRandomNumber(2, Math.min(4, count));
        const positions = Array.from({length: count}, (_, i) => i);
        for (let i=0;i<numberOfHidden;i++){
        const idx = Math.floor(Math.random()*positions.length);
        hiddenPositions.push(positions[idx]);
        positions.splice(idx,1);
        }
        hiddenPositions.sort((a,b)=>a-b);
        hiddenNumbers = hiddenPositions.map(p => currentSequence[p]);
        draggableNumbers = [...hiddenNumbers];

        displaySequence();
        displayDraggableNumbers();
    }

    function displaySequence() {
        numberSequence.innerHTML = '';
        currentSequence.forEach((number,index)=>{
        const slot = document.createElement('div');
        slot.className = 'number-slot';
        slot.dataset.position = index;
        slot.dataset.correctValue = number;

        if (hiddenPositions.includes(index)) {
            slot.classList.add('empty');
            slot.dataset.filled = 'false';
            slot.dataset.currentValue = '';
            slot.addEventListener('dragover', handleDragOver);
            slot.addEventListener('dragenter', handleDragEnter);
            slot.addEventListener('dragleave', handleDragLeave);
            slot.addEventListener('drop', handleDrop);
        } else {
            slot.classList.add('filled');
            slot.textContent = number;
            slot.dataset.filled = 'true';
            slot.dataset.currentValue = number;
            correctSlotsCount++;
        }

        numberSequence.appendChild(slot);
        });
    }

    function displayDraggableNumbers() {
        draggableNumbersContainer.innerHTML = '';
        const shuffledNumbers = [...draggableNumbers].sort(()=>Math.random()-0.5);
        shuffledNumbers.forEach((number, index)=>{
        const el = document.createElement('div');
        el.className = 'draggable-number';
        el.textContent = number;
        el.dataset.number = number;
        el.dataset.id = `xep-drag-${index}`;
        el.draggable = true;
        el.addEventListener('dragstart', handleDragStart);
        el.addEventListener('dragend', handleDragEnd);
        draggableNumbersContainer.appendChild(el);
        });
    }

    // drag handlers (scoped)
    function handleDragStart(e) {
        draggedNumber = { element: e.target, number: parseInt(e.target.dataset.number), id: e.target.dataset.id };
        e.target.classList.add('dragging');
        try { e.dataTransfer.setData('text/plain', e.target.dataset.number); e.dataTransfer.effectAllowed = 'move'; } catch(e) {}
    }

    function handleDragOver(e) { if (!draggedNumber) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }
    function handleDragEnter(e) { if (!draggedNumber) return; const slot = e.target.closest('.number-slot.empty'); if (!slot) return; slot.classList.add('drag-over'); }
    function handleDragLeave(e) { const slot = e.target.closest('.number-slot.empty'); if (!slot) return; slot.classList.remove('drag-over'); }

    function handleDrop(e) {
        e.preventDefault();
        if (!draggedNumber) return;
        const slot = e.target.closest('.number-slot.empty'); if (!slot) return;
        slot.classList.remove('drag-over');
        const correctValue = parseInt(slot.dataset.correctValue);
        const isCorrect = draggedNumber.number === correctValue;
        if (isCorrect) {
        slot.textContent = draggedNumber.number;
        slot.classList.remove('empty'); slot.classList.add('correct'); slot.dataset.filled = 'true'; slot.dataset.currentValue = draggedNumber.number;
        draggedNumber.element.classList.add('used'); draggedNumber.element.draggable = false;
        const numberIndex = draggableNumbers.indexOf(draggedNumber.number);
        if (numberIndex > -1) draggableNumbers.splice(numberIndex,1);
        correctSlotsCount++;
        // play bit-correct sound
        playSoundFile('sound_correct_answer_bit.mp3').then(() => checkIfCompleted());
        } else {
        slot.classList.add('incorrect-drop');
        setTimeout(()=>{ slot.classList.remove('incorrect-drop'); draggedNumber.element.classList.remove('dragging'); draggedNumber.element.style.transform = ''; }, 500);
        wrongCount++; updateStats();
        // play bit-wrong sound then continue
        playSoundFile('sound_wrong_answer_bit.mp3');
        }
        draggedNumber = null;
    }

    function handleDragEnd() { if (draggedNumber && draggedNumber.element) draggedNumber.element.classList.remove('dragging'); document.querySelectorAll('.number-slot.drag-over').forEach(s=>s.classList.remove('drag-over')); draggedNumber = null; }

    function checkIfCompleted() {
        const totalSlots = currentSequence.length;
        if (correctSlotsCount === totalSlots) {
        correctCount++; updateStats();
        document.querySelectorAll('.number-slot').forEach(slot=>slot.classList.add('all-correct'));
        // play long success then next
        playSoundFile('sound_correct_answer_long.mp3').then(() => {
            autoNextTimeout = setTimeout(() => {
                questionNumber++;
                generateNewQuestion();
            }, 1000);
        });
        }
    }

    async function finishGame() {
        const endTime = Date.now();
        const timeSpent = Math.floor((endTime - startTime) / 1000);

        // Tính sao
        let stars = 1;
        // Đúng >= 80% là 3 sao
        if (correctCount >= TARGET_QUESTIONS * 0.8) stars = 3;
        else if (correctCount >= TARGET_QUESTIONS * 0.5) stars = 2;

        const isPassed = correctCount >= TARGET_QUESTIONS * 0.5;
        const score = correctCount * 10;

        // Gửi kết quả
        await submitGameResult(level.level_id, 'xep-so', score, stars, isPassed, timeSpent);

        // Hiện popup
        document.getElementById('final-correct').textContent = correctCount;
        document.getElementById('star-rating').textContent = '⭐'.repeat(stars);
        modal.style.display = 'flex';
    }

    function updateStats() { correctCountElement.textContent = correctCount; wrongCountElement.textContent = wrongCount; }

    function getRandomNumber(min,max) { return Math.floor(Math.random()*(max-min+1))+min; }

    // document-level dragover to allow drops (scoped cleanup later)
    function docDragOver(e) { e.preventDefault(); }
    document.addEventListener('dragover', docDragOver);

    // events
    container.querySelector('#btn-back').onclick = () => {
        if(autoNextTimeout) clearTimeout(autoNextTimeout);
        mount(container);
    };
    document.getElementById('btn-finish-back').onclick = () => mount(container);

    // init
    initGame();

    // cleanup
    container._xepSoCleanup = () => {
        document.removeEventListener('dragover', docDragOver);
        if (autoNextTimeout) { clearTimeout(autoNextTimeout); autoNextTimeout = null; }
        try { if (currentAudio) { currentAudio.pause(); currentAudio.currentTime = 0; currentAudio = null; } } catch(e) {}
        delete container._xepSoCleanup;
    };
}

export function unmount(container) { if (!container) return; if (container._xepSoCleanup) container._xepSoCleanup(); }