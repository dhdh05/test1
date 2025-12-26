import { callAPI, submitGameResult } from '../../js/utils.js';

function loadStyles() {
  if (!document.querySelector('link[data-panel="ghep-so"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './panels/ghep-so/style.css';
    link.setAttribute('data-panel', 'ghep-so');
    document.head.appendChild(link);
  }
}

export async function mount(container) {
  if (!container) return;
  loadStyles();

  container.innerHTML = '<div class="loading">⏳ Đang tải bài tập ghép số...</div>';

  // 1. Gọi API lấy danh sách bài
  const res = await callAPI('/games/levels/ghep-so');
  
  if (!res || !res.success) {
      container.innerHTML = '<div class="panel-error">❌ Lỗi tải dữ liệu. Bạn đã chạy lệnh SQL chưa?</div>';
      return;
  }

  renderLevelList(container, res.data);
}

function renderLevelList(container, levels) {
    let html = `
        <div class="ghepso-game">
            <div class="game-container" style="display:block; text-align:center; padding-top:40px;">
                <h1 style="color:#4a6bff; margin-bottom:10px;"><i class="fas fa-puzzle-piece"></i> Bé Ghép Số</h1>
                <p style="margin-bottom:30px; color:#666;">Kéo số vào ô hình ảnh có số lượng tương ứng</p>
                <div style="display:grid; gap:15px; padding:0 20px;">
    `;

    levels.forEach(level => {
        // level.config = { min, max, pairs, time }
        html += `
            <div class="level-card" id="btn-play-${level.level_id}" 
                 style="background:white; padding:20px; border-radius:12px; box-shadow:0 4px 10px rgba(0,0,0,0.05); cursor:pointer; display:flex; justify-content:space-between; align-items:center; border:2px solid #eef2ff;">
                <div style="text-align:left;">
                    <strong style="font-size:18px; color:#333;">Level ${level.level_number}: ${level.title}</strong>
                    <div style="font-size:14px; color:#888;">${level.description}</div>
                </div>
                <button style="background:#4a6bff; color:white; border:none; padding:10px 20px; border-radius:20px; cursor:pointer;">Bắt đầu</button>
            </div>
        `;
    });

    html += '</div></div></div>';
    container.innerHTML = html;

    levels.forEach(l => {
        document.getElementById(`btn-play-${l.level_id}`).addEventListener('click', () => startGame(container, l));
    });
}

// --- LOGIC GAME CHÍNH ---
function startGame(container, level) {
    // Config từ DB
    const CONFIG = {
        min: level.config.min || 1,
        max: level.config.max || 10,
        pairs: level.config.pairs || 4,
        time: level.config.time || 60
    };

    container.innerHTML = `
    <div class="ghepso-game">
      <div class="game-container">
        <div class="game-header">
          <div class="game-title">
             <button id="btn-back-menu" style="background:none; border:none; font-size:18px; color:#4a6bff; cursor:pointer; margin-right:10px;"><i class="fas fa-arrow-left"></i></button>
             <span class="subtitle">Level ${level.level_number}</span>
          </div>

          <div class="game-stats">
            <div class="stat-box">
              <div class="stat-icon"><i class="fas fa-clock"></i></div>
              <div class="stat-content"><div class=\"stat-label\">Thời gian</div><div class="stat-value" id="ghep-timer">${CONFIG.time}</div></div>
            </div>
            <div class="stat-box">
              <div class="stat-icon"><i class="fas fa-star"></i></div>
              <div class="stat-content"><div class="stat-label\">Điểm</div><div class="stat-value" id="ghep-score">0</div></div>
            </div>
          </div>
        </div>

        <div class="game-play-area">
          <div class="drop-zones" id="drop-zones"></div>
          <div class="drag-items" id="drag-items"></div>
        </div>
      </div>

      <div id="ghep-levelCompleteModal" class="modal hidden">
        <div class="modal-content">
          <div class="modal-icon success"><i class="fas fa-trophy"></i></div>
          <h3>Tuyệt vời!</h3>
          <p>Bé đã hoàn thành bài học!</p>
          <div class="stars" id="level-stars">⭐⭐⭐</div>
          <div class="modal-actions">
            <button class="modal-btn next-btn" id="btn-next-level">Về Danh Sách</button>
            <button class="modal-btn retry-btn" id="btn-retry-win">Chơi Lại</button>
          </div>
        </div>
      </div>

      <div id="ghep-gameOverModal" class="modal hidden">
        <div class="modal-content">
          <div class="modal-icon failure"><i class="fas fa-times"></i></div>
          <h3>Hết giờ!</h3>
          <p>Cố gắng lần sau nhé!</p>
          <div class="modal-actions">
            <button class="modal-btn retry-btn" id="btn-retry-lose">Thử Lại</button>
            <button class="modal-btn next-btn" id="btn-quit-lose">Thoát</button>
          </div>
        </div>
      </div>
    </div>
    `;

    // --- Variables ---
    let score = 0;
    let timer = CONFIG.time;
    let timerInterval;
    let matchedCount = 0;
    let targetPairs = CONFIG.pairs;
    let currentAudio = null;

    // Elements
    const timerEl = container.querySelector('#ghep-timer');
    const scoreEl = container.querySelector('#ghep-score');
    const dropZonesContainer = container.querySelector('#drop-zones');
    const dragItemsContainer = container.querySelector('#drag-items');
    
    // Modals
    const levelCompleteModal = container.querySelector('#ghep-levelCompleteModal');
    const gameOverModal = container.querySelector('#ghep-gameOverModal');

    // Setup Event Listeners cho nút
    container.querySelector('#btn-back-menu').onclick = () => { clearInterval(timerInterval); mount(container); };
    container.querySelector('#btn-next-level').onclick = () => mount(container); // Về menu
    container.querySelector('#btn-quit-lose').onclick = () => mount(container);
    
    const replayHandler = () => {
        clearInterval(timerInterval);
        startGame(container, level);
    };
    container.querySelector('#btn-retry-win').onclick = replayHandler;
    container.querySelector('#btn-retry-lose').onclick = replayHandler;


    // --- Game Logic ---
    function initGame() {
        score = 0;
        matchedCount = 0;
        timer = CONFIG.time;
        
        scoreEl.textContent = '0';
        timerEl.textContent = timer;
        
        levelCompleteModal.classList.add('hidden');
        gameOverModal.classList.add('hidden');
        
        generateBoard();
        startTimer();
    }

    function generateBoard() {
        dropZonesContainer.innerHTML = '';
        dragItemsContainer.innerHTML = '';

        // Tạo danh sách số ngẫu nhiên không trùng lặp trong khoảng min-max
        let numbers = [];
        while (numbers.length < targetPairs) {
            let num = Math.floor(Math.random() * (CONFIG.max - CONFIG.min + 1)) + CONFIG.min;
            if (!numbers.includes(num)) numbers.push(num);
        }

        // Tạo Drop Zones (Hình ảnh)
        const icons = ['apple-alt', 'car', 'fish', 'dog', 'cat', 'ice-cream', 'star', 'heart'];
        
        // Shuffle numbers để vị trí drop zone ngẫu nhiên
        const shuffledDrop = [...numbers].sort(() => Math.random() - 0.5);
        
        shuffledDrop.forEach(num => {
            const zone = document.createElement('div');
            zone.className = 'drop-zone';
            zone.dataset.value = num;

            // Tạo icon bên trong
            const iconName = icons[Math.floor(Math.random() * icons.length)];
            const color = `hsl(${Math.random() * 360}, 70%, 60%)`;
            
            // Grid icon (nếu số nhỏ thì icon to, số lớn thì icon nhỏ)
            const iconContainer = document.createElement('div');
            iconContainer.className = 'icon-grid';
            // CSS grid style inline để đẹp
            if (num <= 4) iconContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
            else iconContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
            
            for(let i=0; i<num; i++) {
                const iTag = document.createElement('i');
                iTag.className = `fas fa-${iconName}`;
                iTag.style.color = color;
                iconContainer.appendChild(iTag);
            }
            
            zone.appendChild(iconContainer);
            
            // Events Drop
            zone.addEventListener('dragover', handleDragOver);
            zone.addEventListener('dragleave', handleDragLeave);
            zone.addEventListener('drop', handleDrop);
            
            dropZonesContainer.appendChild(zone);
        });

        // Tạo Drag Items (Số)
        const shuffledDrag = [...numbers].sort(() => Math.random() - 0.5);
        shuffledDrag.forEach(num => {
            const item = document.createElement('div');
            item.className = 'drag-item';
            item.draggable = true;
            item.textContent = num;
            item.dataset.value = num;
            
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragend', handleDragEnd);
            // Touch events support
            item.addEventListener('touchstart', handleTouchStart, {passive: false});
            item.addEventListener('touchmove', handleTouchMove, {passive: false});
            item.addEventListener('touchend', handleTouchEnd);

            dragItemsContainer.appendChild(item);
        });
    }

    function startTimer() {
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timer--;
            timerEl.textContent = timer;
            if (timer <= 0) {
                clearInterval(timerInterval);
                gameOver();
            }
        }, 1000);
    }

    // --- Drag & Drop Handlers ---
    let draggedItem = null;

    function handleDragStart(e) {
        draggedItem = this;
        setTimeout(() => this.classList.add('dragging'), 0);
        playSound('drag');
    }

    function handleDragEnd(e) {
        this.classList.remove('dragging');
        draggedItem = null;
    }

    function handleDragOver(e) {
        e.preventDefault();
        if (!this.classList.contains('matched')) {
            this.classList.add('drag-over');
        }
    }

    function handleDragLeave(e) {
        this.classList.remove('drag-over');
    }

    function handleDrop(e) {
        e.preventDefault();
        this.classList.remove('drag-over');
        if (this.classList.contains('matched')) return;

        const droppedValue = parseInt(draggedItem.dataset.value);
        const zoneValue = parseInt(this.dataset.value);

        checkMatch(droppedValue, zoneValue, this, draggedItem);
    }

    function checkMatch(val1, val2, zoneEl, itemEl) {
        if (val1 === val2) {
            // Match!
            zoneEl.classList.add('matched');
            zoneEl.innerHTML = `<div class="matched-overlay"><i class="fas fa-check"></i></div>`;
            
            itemEl.style.visibility = 'hidden'; // Ẩn số đi
            
            score += 100;
            scoreEl.textContent = score;
            matchedCount++;
            playSound('correct');

            if (matchedCount === targetPairs) {
                setTimeout(levelComplete, 500);
            }
        } else {
            // Wrong
            score = Math.max(0, score - 20);
            scoreEl.textContent = score;
            
            zoneEl.classList.add('wrong');
            playSound('wrong');
            setTimeout(() => zoneEl.classList.remove('wrong'), 500);
        }
    }

    // --- Touch Support Logic (Cơ bản) ---
    // (Giữ nguyên logic touch nếu bạn muốn, hoặc dùng thư viện. Ở đây viết đơn giản)
    let touchClone = null;
    function handleTouchStart(e) {
        e.preventDefault();
        draggedItem = this;
        const touch = e.touches[0];
        
        touchClone = this.cloneNode(true);
        touchClone.style.position = 'fixed';
        touchClone.style.zIndex = '1000';
        touchClone.style.opacity = '0.8';
        touchClone.style.pointerEvents = 'none';
        document.body.appendChild(touchClone);
        
        moveClone(touch);
        playSound('drag');
    }

    function handleTouchMove(e) {
        e.preventDefault();
        if (touchClone) moveClone(e.touches[0]);
    }

    function handleTouchEnd(e) {
        e.preventDefault();
        if (touchClone) {
            touchClone.remove();
            touchClone = null;
            
            // Detect drop target
            const touch = e.changedTouches[0];
            const target = document.elementFromPoint(touch.clientX, touch.clientY);
            const zone = target ? target.closest('.drop-zone') : null;
            
            if (zone && !zone.classList.contains('matched')) {
                const val1 = parseInt(draggedItem.dataset.value);
                const val2 = parseInt(zone.dataset.value);
                checkMatch(val1, val2, zone, draggedItem);
            }
        }
    }

    function moveClone(touch) {
        if(touchClone) {
            touchClone.style.left = (touch.clientX - 25) + 'px';
            touchClone.style.top = (touch.clientY - 25) + 'px';
        }
    }

    // --- Game Over / Win ---
    async function levelComplete() {
        clearInterval(timerInterval);
        
        // Tính sao
        let stars = 1;
        if (score >= targetPairs * 100) stars = 3;
        else if (score >= targetPairs * 80) stars = 2;

        await submitGameResult(level.level_id, 'ghep-so', score, stars, true);
        
        document.getElementById('level-stars').textContent = '⭐'.repeat(stars);
        levelCompleteModal.classList.remove('hidden');
        playSound('win');
    }

    function gameOver() {
        clearInterval(timerInterval);
        submitGameResult(level.level_id, 'ghep-so', score, 0, false);
        gameOverModal.classList.remove('hidden');
        playSound('lose');
    }

    // --- Audio ---
    function playSound(type) {
        const sounds = {
            drag: './assets/sound/sound_drag.mp3', // Đảm bảo bạn có file này hoặc bỏ qua
            correct: './assets/sound/sound_correct.mp3',
            wrong: './assets/sound/sound_wrong.mp3',
            win: './assets/sound/sound_win.mp3', // Nếu có
            lose: './assets/sound/sound_lose.mp3' // Nếu có
        };
        // Fallback file nếu chưa có
        if (!sounds[type]) return; 
        
        const audio = new Audio(sounds[type]);
        audio.volume = 0.5;
        audio.play().catch(() => {});
    }

    // Start
    initGame();
}

export function unmount(container) {
    // Cleanup items
}



// export function mount(container) {
//   if (!container) return;
//   // ensure css is loaded
//   if (!document.querySelector('link[data-panel="ghep-so"]')) {
//     const link = document.createElement('link');
//     link.rel = 'stylesheet';
//     link.href = './panels/ghep-so/style.css';
//     link.setAttribute('data-panel','ghep-so');
//     document.head.appendChild(link);
//   }

//   container.innerHTML = `
//     <div class="ghepso-game">
//       <div class="game-container">
//         <div class="game-header">
//           <div class="game-title">
//             <p class="subtitle">Kéo số vào nhóm icon tương ứng</p>
//           </div>

//           <div class="game-stats">
//             <div class="stat-box">
//               <div class="stat-icon"><i class="fas fa-layer-group"></i></div>
//               <div class="stat-content"><div class="stat-label">Level</div><div class="stat-value" id="ghep-level">1</div></div>
//             </div>
//             <div class="stat-box">
//               <div class="stat-icon"><i class="fas fa-clock"></i></div>
//               <div class="stat-content"><div class="stat-label">Thời gian</div><div class="stat-value" id="ghep-timer">60</div></div>
//             </div>
//             <div class="stat-box">
//               <div class="stat-icon"><i class="fas fa-star"></i></div>
//               <div class="stat-content"><div class="stat-label">Điểm</div><div class="stat-value" id="ghep-score">0</div></div>
//             </div>
//           </div>
//         </div>

//         <div class="game-main">
//           <div class="numbers-section">
//             <h2><i class="fas fa-sort-numeric-up"></i> Kéo số từ đây</h2>
//             <div class="numbers-container ghep-numbers-container"></div>
//           </div>

//           <div class="icons-section">
//             <h2><i class="fas fa-icons"></i> Kéo sang đây với số lượng tương ứng</h2>
//             <div class="icons-container ghep-icons-container"></div>
//           </div>
//         </div>

//         <div class="game-footer">
//           <button id="ghep-restartBtn" class="restart-btn"><i class="fas fa-redo"></i> Chơi lại level</button>
//           <div class="hint"><i class="fas fa-lightbulb"></i> Di chuyển số gần tâm icon để xem viền xanh/đỏ</div>
//         </div>
//       </div>

//       <div class="modal-overlay" id="ghep-gameOverModal">
//         <div class="modal-content">
//           <h3>Hết thời gian!</h3>
//           <p>Bạn đã không hoàn thành Level <span id="ghep-modalLevel">1</span> kịp thời gian.</p>
//           <div style="margin-top:12px;"><button id="ghep-retryLevelBtn" class="modal-btn retry-btn">Chơi lại Level này</button></div>
//         </div>
//       </div>

//       <div class="modal-overlay" id="ghep-levelCompleteModal">
//         <div class="modal-content">
//           <h3>Chúc mừng!</h3>
//           <p>Bạn đã hoàn thành Level <span id="ghep-modalCompletedLevel">1</span>!</p>

//           <div class="modal-stats" style="display:flex;gap:18px;justify-content:center;margin-top:12px;">
//             <div><div class="modal-stat-label">Level tiếp theo</div><div class="modal-stat-value" id="ghep-modalNextLevel">2</div></div>
//             <div><div class="modal-stat-label">Điểm</div><div class="modal-stat-value" id="ghep-modalLevelScore">0</div></div>
//           </div>

//           <div style="margin-top:14px;"><button id="ghep-nextLevelBtn" class="modal-btn next-btn">Chơi Level tiếp theo</button></div>
//         </div>
//       </div>
//     </div>
//   `;

//   // Game data (copied from main.js)
//   const levelQuestions = {
//     1: [
//       { iconType: "Táo", icon: "fas fa-apple-alt", answer: 3, count: 3 },
//       { iconType: "Chanh", icon: "fas fa-lemon", answer: 4, count: 4 },
//       { iconType: "Cà rốt", icon: "fas fa-carrot", answer: 2, count: 2 },
//       { iconType: "Kem", icon: "fas fa-ice-cream", answer: 5, count: 5 },
//       { iconType: "Lá", icon: "fas fa-leaf", answer: 1, count: 1 },
//       { iconType: "Trái tim", icon: "fas fa-heart", answer: 6, count: 6 }
//     ],
//     2: [
//       { iconType: "Ngôi sao", icon: "fas fa-star", answer: 2, count: 2 },
//       { iconType: "Táo", icon: "fas fa-apple-alt", answer: 4, count: 4 },
//       { iconType: "Cà rốt", icon: "fas fa-carrot", answer: 3, count: 3 },
//       { iconType: "Hình vuông", icon: "fas fa-square", answer: 5, count: 5 },
//       { iconType: "Trái tim", icon: "fas fa-heart", answer: 1, count: 1 },
//       { iconType: "Chanh", icon: "fas fa-lemon", answer: 6, count: 6 }
//     ],
//     3: [
//       { iconType: "Cà rốt", icon: "fas fa-carrot", answer: 5, count: 5 },
//       { iconType: "Kem", icon: "fas fa-ice-cream", answer: 2, count: 2 },
//       { iconType: "Lá", icon: "fas fa-leaf", answer: 4, count: 4 },
//       { iconType: "Trái tim", icon: "fas fa-heart", answer: 3, count: 3 },
//       { iconType: "Ngôi sao", icon: "fas fa-star", answer: 6, count: 6 },
//       { iconType: "Táo", icon: "fas fa-apple-alt", answer: 1, count: 1 }
//     ],
//     4: [
//       { iconType: "Hình vuông", icon: "fas fa-square", answer: 4, count: 4 },
//       { iconType: "Trái tim", icon: "fas fa-heart", answer: 2, count: 2 },
//       { iconType: "Táo", icon: "fas fa-apple-alt", answer: 5, count: 5 },
//       { iconType: "Chanh", icon: "fas fa-lemon", answer: 3, count: 3 },
//       { iconType: "Cà rốt", icon: "fas fa-carrot", answer: 1, count: 1 },
//       { iconType: "Kem", icon: "fas fa-ice-cream", answer: 6, count: 6 }
//     ],
//     5: [
//       { iconType: "Lá", icon: "fas fa-leaf", answer: 3, count: 3 },
//       { iconType: "Trái tim", icon: "fas fa-heart", answer: 5, count: 5 },
//       { iconType: "Ngôi sao", icon: "fas fa-star", answer: 2, count: 2 },
//       { iconType: "Táo", icon: "fas fa-apple-alt", answer: 4, count: 4 },
//       { iconType: "Hình vuông", icon: "fas fa-square", answer: 6, count: 6 },
//       { iconType: "Chanh", icon: "fas fa-lemon", answer: 1, count: 1 }
//     ],
//     6: [
//       { iconType: "Táo", icon: "fas fa-apple-alt", answer: 4, count: 4 },
//       { iconType: "Chanh", icon: "fas fa-lemon", answer: 6, count: 6 },
//       { iconType: "Cà rốt", icon: "fas fa-carrot", answer: 2, count: 2 },
//       { iconType: "Kem", icon: "fas fa-ice-cream", answer: 5, count: 5 },
//       { iconType: "Lá", icon: "fas fa-leaf", answer: 3, count: 3 },
//       { iconType: "Trái tim", icon: "fas fa-heart", answer: 1, count: 1 }
//     ],
//     7: [
//       { iconType: "Ngôi sao", icon: "fas fa-star", answer: 3, count: 3 },
//       { iconType: "Táo", icon: "fas fa-apple-alt", answer: 5, count: 5 },
//       { iconType: "Hình vuông", icon: "fas fa-square", answer: 2, count: 2 },
//       { iconType: "Trái tim", icon: "fas fa-heart", answer: 6, count: 6 },
//       { iconType: "Cà rốt", icon: "fas fa-carrot", answer: 4, count: 4 },
//       { iconType: "Chanh", icon: "fas fa-lemon", answer: 1, count: 1 }
//     ],
//     8: [
//       { iconType: "Cà rốt", icon: "fas fa-carrot", answer: 6, count: 6 },
//       { iconType: "Kem", icon: "fas fa-ice-cream", answer: 3, count: 3 },
//       { iconType: "Lá", icon: "fas fa-leaf", answer: 5, count: 5 },
//       { iconType: "Trái tim", icon: "fas fa-heart", answer: 2, count: 2 },
//       { iconType: "Ngôi sao", icon: "fas fa-star", answer: 4, count: 4 },
//       { iconType: "Táo", icon: "fas fa-apple-alt", answer: 1, count: 1 }
//     ],
//     9: [
//       { iconType: "Hình vuông", icon: "fas fa-square", answer: 5, count: 5 },
//       { iconType: "Trái tim", icon: "fas fa-heart", answer: 2, count: 2 },
//       { iconType: "Táo", icon: "fas fa-apple-alt", answer: 6, count: 6 },
//       { iconType: "Chanh", icon: "fas fa-lemon", answer: 3, count: 3 },
//       { iconType: "Cà rốt", icon: "fas fa-carrot", answer: 4, count: 4 },
//       { iconType: "Kem", icon: "fas fa-ice-cream", answer: 1, count: 1 }
//     ],
//     10: [
//       { iconType: "Lá", icon: "fas fa-leaf", answer: 8, count: 8 },
//       { iconType: "Trái tim", icon: "fas fa-heart", answer: 7, count: 7 },
//       { iconType: "Ngôi sao", icon: "fas fa-star", answer: 9, count: 9 },
//       { iconType: "Táo", icon: "fas fa-apple-alt", answer: 6, count: 6 },
//       { iconType: "Hình vuông", icon: "fas fa-square", answer: 10, count: 10 },
//       { iconType: "Chanh", icon: "fas fa-lemon", answer: 5, count: 5 }
//     ]
//   };

//   const levelConfig = {
//     1: { timePerMove: 60, timeDecrement: 0, scoreMultiplier: 1 },
//     2: { timePerMove: 55, timeDecrement: 5, scoreMultiplier: 2 },
//     3: { timePerMove: 50, timeDecrement: 5, scoreMultiplier: 3 },
//     4: { timePerMove: 45, timeDecrement: 5, scoreMultiplier: 4 },
//     5: { timePerMove: 40, timeDecrement: 5, scoreMultiplier: 5 },
//     6: { timePerMove: 35, timeDecrement: 5, scoreMultiplier: 6 },
//     7: { timePerMove: 30, timeDecrement: 5, scoreMultiplier: 7 },
//     8: { timePerMove: 25, timeDecrement: 5, scoreMultiplier: 8 },
//     9: { timePerMove: 20, timeDecrement: 5, scoreMultiplier: 9 },
//     10: { timePerMove: 15, timeDecrement: 5, scoreMultiplier: 10 }
//   };

//   // state
//   let score = 0; let level = 1; let timeLeft = 60; let timerInterval = null; let isGameActive = true; let draggedNumber = null; let currentIconHighlighted = null; let dragMoveHandler = null; let currentGameData = []; let autoAdvanceTimeoutId = null;

//   // dom
//   const scoreEl = container.querySelector('#ghep-score');
//   const timerEl = container.querySelector('#ghep-timer');
//   const levelEl = container.querySelector('#ghep-level');
//   const restartBtn = container.querySelector('#ghep-restartBtn');
//   const numbersContainer = container.querySelector('.ghep-numbers-container');
//   const iconsContainer = container.querySelector('.ghep-icons-container');
//   const gameOverModal = container.querySelector('#ghep-gameOverModal');
//   const levelCompleteModal = container.querySelector('#ghep-levelCompleteModal');
//   const retryLevelBtn = container.querySelector('#ghep-retryLevelBtn');
//   const nextLevelBtn = container.querySelector('#ghep-nextLevelBtn');
//   const modalLevel = container.querySelector('#ghep-modalLevel');
//   const modalCompletedLevel = container.querySelector('#ghep-modalCompletedLevel');
//   const modalNextLevel = container.querySelector('#ghep-modalNextLevel');
//   const modalLevelScore = container.querySelector('#ghep-modalLevelScore');

//   // audio helper (tracks current audio so it can be stopped on cleanup)
//   let currentAudio = null;
//   const _activeAudios = new Set();
//   function playSoundFile(filename) {
//     return new Promise(resolve => {
//       try {
//         if (currentAudio) {
//           try { currentAudio.pause(); currentAudio.currentTime = 0; } catch(e){}
//           currentAudio = null;
//         }
//         const audio = new Audio(`assets/sound/${filename}`);
//         currentAudio = audio;
//         _activeAudios.add(audio);
//         const onEnd = () => { try { _activeAudios.delete(audio); } catch(e){} if (currentAudio === audio) currentAudio = null; cleanupListeners(); resolve(); };
//         const onError = () => { try { _activeAudios.delete(audio); } catch(e){} if (currentAudio === audio) currentAudio = null; cleanupListeners(); resolve(); };
//         function cleanupListeners(){ try { audio.removeEventListener('ended', onEnd); audio.removeEventListener('error', onError); } catch(e){} }
//         audio.addEventListener('ended', onEnd);
//         audio.addEventListener('error', onError);
//         const p = audio.play(); if (p && typeof p.then === 'function') p.catch(() => onError());
//       } catch (e) { currentAudio = null; resolve(); }
//     });
//   }

//   function shuffleArray(arr) { const shuffled = [...arr]; for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; } return shuffled; }

//   function initGame() {
//     score = 0; timeLeft = levelConfig[level].timePerMove; isGameActive = true; scoreEl.textContent = score; levelEl.textContent = level; timerEl.textContent = timeLeft; currentGameData = [...(levelQuestions[level] || levelQuestions[1])]; shuffleGameData(); createNumbers(); createIcons(); startTimer(); initDragAndDrop(); hideModal(gameOverModal); hideModal(levelCompleteModal);
//   }

//   function shuffleGameData() { for (let i = currentGameData.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [currentGameData[i], currentGameData[j]] = [currentGameData[j], currentGameData[i]]; } }

//   function createNumbers() { numbersContainer.innerHTML = ''; const numbers = currentGameData.map(item => item.answer); const shuffled = shuffleArray(numbers); shuffled.forEach((num, idx) => { const el = document.createElement('div'); el.className = 'number-item'; el.textContent = num; el.draggable = true; el.dataset.number = num; el.dataset.id = `g-num-${idx}`; numbersContainer.appendChild(el); }); }

//   function createIcons() { iconsContainer.innerHTML = ''; currentGameData.forEach((q, idx) => { const iconEl = document.createElement('div'); iconEl.className = 'icon-item'; iconEl.dataset.id = `g-icon-${idx}`; iconEl.dataset.answer = q.answer; let iconsHTML = ''; for (let i = 0; i < q.count; i++) iconsHTML += `<i class="${q.icon}" style="color:${getIconColor(q.iconType)}"></i>`; iconEl.innerHTML = `\n          <div class="icon-name">${q.iconType}</div>\n          <div class="icon-group">${iconsHTML}</div>\n          <div class="icon-answer" id="g-answer-${idx}">?</div>\n        `; iconsContainer.appendChild(iconEl); }); }

//   function getIconColor(type) { const map = { 'Táo':'#ff6b6b','Cam':'#FF9800','Chuối':'#FFC107','Dâu':'#f44336','Nho':'#9C27B0','Dưa hấu':'#4CAF50','Dứa':'#FF9800','Cherry':'#E91E63','Mận':'#9C27B0','Lê':'#8BC34A' }; return map[type] || '#4a6bff'; }
//   function getIconColor(type) { const map = {
//     'Táo':'#ff6b6b',
//     'Chanh':'#FFEB3B',
//     'Cà rốt':'#FF9800',
//     'Kem':'#FFB6C1',
//     'Lá':'#4CAF50',
//     'Trái tim':'#f44336',
//     'Ngôi sao':'#FFD700',
//     'Hình vuông':'#607D8B',
//     'Cam':'#FF9800',
//     'Chuối':'#FFC107',
//     'Nho':'#9C27B0'
//   }; return map[type] || '#4a6bff'; }

//   function initDragAndDrop() { const numberItems = container.querySelectorAll('.number-item:not(.used)'); numberItems.forEach(n => { n.removeEventListener('dragstart', handleDragStart); n.removeEventListener('touchstart', handleTouchStart); n.addEventListener('dragstart', handleDragStart); n.addEventListener('touchstart', handleTouchStart, { passive: false }); }); if (dragMoveHandler) container.removeEventListener('dragover', dragMoveHandler); dragMoveHandler = handleDragMove; container.addEventListener('dragover', dragMoveHandler); container.addEventListener('drop', handleDrop); }

//   function handleDragStart(e) { if (!isGameActive) { e.preventDefault(); return; } draggedNumber = { element: e.target, number: parseInt(e.target.dataset.number), id: e.target.dataset.id }; e.target.classList.add('dragging'); e.dataTransfer.setData('text/plain', e.target.dataset.number); e.dataTransfer.effectAllowed = 'move'; document.addEventListener('dragend', handleDragEnd); }

//   function handleDragMove(e) { if (!draggedNumber || !isGameActive) return; e.preventDefault(); const icons = container.querySelectorAll('.icon-item:not(.completed)'); let closest = null; let minDist = Infinity; icons.forEach(icon => { const r = icon.getBoundingClientRect(); const cx = r.left + r.width/2; const cy = r.top + r.height/2; const d = Math.hypot(e.clientX - cx, e.clientY - cy); if (d < 100 && d < minDist) { minDist = d; closest = icon; } }); if (currentIconHighlighted && currentIconHighlighted !== closest) currentIconHighlighted.classList.remove('highlight-correct','highlight-incorrect'); if (closest) { currentIconHighlighted = closest; const answer = parseInt(closest.dataset.answer); if (draggedNumber.number === answer) { closest.classList.remove('highlight-incorrect'); closest.classList.add('highlight-correct'); } else { closest.classList.remove('highlight-correct'); closest.classList.add('highlight-incorrect'); } } else if (currentIconHighlighted) { currentIconHighlighted.classList.remove('highlight-correct','highlight-incorrect'); currentIconHighlighted = null; } }

//   function handleDragEnd() { if (!draggedNumber) return; if (currentIconHighlighted) { currentIconHighlighted.classList.remove('highlight-correct','highlight-incorrect'); currentIconHighlighted = null; } draggedNumber.element.classList.remove('dragging'); document.removeEventListener('dragend', handleDragEnd); }

//   function handleDrop(e) {
//     if (!isGameActive || !draggedNumber) { e.preventDefault(); return; }
//     e.preventDefault();
//     const icon = e.target.closest('.icon-item');
//     if (!icon || icon.classList.contains('completed')) return;
//     const idx = parseInt(icon.dataset.id.split('-')[2]);
//     const answer = parseInt(icon.dataset.answer);
//       if (draggedNumber.number === answer) {
//         const pts = 10 * (levelConfig[level] ? levelConfig[level].scoreMultiplier : 1);
//         score += pts; scoreEl.textContent = score;
//         icon.classList.add('completed');
//         currentGameData[idx].placedNumber = draggedNumber.number;
//         container.querySelector(`#g-answer-${idx}`).textContent = draggedNumber.number;
//         draggedNumber.element.classList.add('used'); draggedNumber.element.draggable = false;
//         resetTimer();
//         playSoundFile('sound_correct_answer_bit.mp3').then(() => checkLevelCompletion());
//       } else {
//         icon.classList.add('highlight-incorrect');
//         timeLeft -= (levelConfig[level] ? levelConfig[level].timeDecrement : 0);
//         if (timeLeft < 0) timeLeft = 0;
//         timerEl.textContent = timeLeft;
//         if (timeLeft <= 0) endLevel(false);
//         playSoundFile('sound_wrong_answer_bit.mp3');
//         setTimeout(() => icon.classList.remove('highlight-incorrect'), 500);
//     }
//     draggedNumber = null;
//   }


//   function handleTouchStart(e) { if (!isGameActive) { e.preventDefault(); return; } const touch = e.touches[0]; draggedNumber = { element: e.target, number: parseInt(e.target.dataset.number), id: e.target.dataset.id }; draggedNumber.element.classList.add('dragging'); const touchMove = (moveEvent) => { if (!draggedNumber) return; const t = moveEvent.touches[0]; const icons = container.querySelectorAll('.icon-item:not(.completed)'); let closest=null; let minD=Infinity; icons.forEach(icon => { const r = icon.getBoundingClientRect(); const cx=r.left+r.width/2; const cy=r.top+r.height/2; const d=Math.hypot(t.clientX-cx,t.clientY-cy); if (d<120 && d<minD){minD=d;closest=icon;} }); if (currentIconHighlighted && currentIconHighlighted !== closest) currentIconHighlighted.classList.remove('highlight-correct','highlight-incorrect'); if (closest) { currentIconHighlighted=closest; const answer=parseInt(closest.dataset.answer); if (draggedNumber.number===answer) {closest.classList.remove('highlight-incorrect'); closest.classList.add('highlight-correct');} else {closest.classList.remove('highlight-correct'); closest.classList.add('highlight-incorrect');} } else if (currentIconHighlighted) { currentIconHighlighted.classList.remove('highlight-correct','highlight-incorrect'); currentIconHighlighted=null; } }; const touchEnd = (endEvent) => { if (!draggedNumber) return; const t = endEvent.changedTouches[0]; const icons = container.querySelectorAll('.icon-item:not(.completed)'); let closest=null; let minD=Infinity; icons.forEach(icon => { const r = icon.getBoundingClientRect(); const cx=r.left+r.width/2; const cy=r.top+r.height/2; const d=Math.hypot(t.clientX-cx,t.clientY-cy); if (d<120 && d<minD){minD=d;closest=icon;} }); if (closest) { const idx = parseInt(closest.dataset.id.split('-')[2]); const answer = parseInt(closest.dataset.answer); if (draggedNumber.number===answer) { const pts=10*(levelConfig[level] ? levelConfig[level].scoreMultiplier : 1); score+=pts; scoreEl.textContent=score; closest.classList.add('completed'); currentGameData[idx].placedNumber = draggedNumber.number; container.querySelector(`#g-answer-${idx}`).textContent=draggedNumber.number; draggedNumber.element.classList.add('used'); draggedNumber.element.draggable=false; resetTimer(); checkLevelCompletion(); } else { closest.classList.add('highlight-incorrect'); timeLeft -= (levelConfig[level] ? levelConfig[level].timeDecrement : 0); if (timeLeft<0) timeLeft=0; timerEl.textContent=timeLeft; if (timeLeft<=0) endLevel(false); setTimeout(()=>closest.classList.remove('highlight-incorrect'),500); } } if (currentIconHighlighted) { currentIconHighlighted.classList.remove('highlight-correct','highlight-incorrect'); currentIconHighlighted=null; } draggedNumber.element.classList.remove('dragging'); draggedNumber=null; document.removeEventListener('touchmove', touchMove); document.removeEventListener('touchend', touchEnd); }; document.addEventListener('touchmove', touchMove, { passive:false }); document.addEventListener('touchend', touchEnd); e.preventDefault(); }

//   function startTimer() { clearInterval(timerInterval); timerInterval = setInterval(()=>{ if (!isGameActive){ clearInterval(timerInterval); return; } timeLeft--; timerEl.textContent=timeLeft; if (timeLeft<=10) timerEl.classList.add('timer-warning'); if (timeLeft<=0) endLevel(false); }, 1000); }
//   function resetTimer(){ timeLeft = levelConfig[level] ? levelConfig[level].timePerMove : 60; timerEl.textContent = timeLeft; timerEl.classList.remove('timer-warning'); }

//   function checkLevelCompletion(){ const allCompleted = currentGameData.every(item => item.placedNumber !== undefined); if (allCompleted) endLevel(true); }

//   function showModal(modal){ modal.classList.add('active'); document.body.style.overflow='hidden'; }
//   function hideModal(modal){ modal.classList.remove('active'); document.body.style.overflow=''; }

//   function endLevel(isWin){
//     isGameActive=false;
//     clearInterval(timerInterval);
//     setTimeout(()=>{
//       if (isWin){
//         modalCompletedLevel.textContent = level;
//         if (modalNextLevel) modalNextLevel.textContent = Math.min(level + 1, 10);
//         if (modalLevelScore) modalLevelScore.textContent = score;
//         showModal(levelCompleteModal);
//         // play long correct sound then advance
//         playSoundFile('sound_correct_answer_long.mp3').then(() => {
//           if (!container || !container.querySelector) return;
//           handleNextLevel();
//         });
//       } else {
//         modalLevel.textContent = level;
//         showModal(gameOverModal);
//       }
//     }, 200);
//   }

//   // named handlers
//   restartBtn.addEventListener('click', initGame);
//   const handleRetry = () => { if (autoAdvanceTimeoutId) { clearTimeout(autoAdvanceTimeoutId); autoAdvanceTimeoutId = null; } hideModal(gameOverModal); initGame(); };
//   const handleNextLevel = () => { if (autoAdvanceTimeoutId) { clearTimeout(autoAdvanceTimeoutId); autoAdvanceTimeoutId = null; } if (level < 10) { level = Math.min(level + 1, 10); hideModal(levelCompleteModal); initGame(); } else { alert('🎉 Bạn đã hoàn thành tất cả level!'); hideModal(levelCompleteModal); } };
//   retryLevelBtn?.addEventListener('click', handleRetry);
//   nextLevelBtn?.addEventListener('click', handleNextLevel);
//   const handleRootClick = (e) => { if (e.target === gameOverModal) hideModal(gameOverModal); if (e.target === levelCompleteModal) hideModal(levelCompleteModal); };
//   container.addEventListener('click', handleRootClick);

//   // start
//   initGame();

//   // cleanup
//   container._ghepCleanup = () => {
//     clearInterval(timerInterval);
//     if (autoAdvanceTimeoutId) { clearTimeout(autoAdvanceTimeoutId); autoAdvanceTimeoutId = null; }
//     document.removeEventListener('dragend', handleDragEnd);
//     container.removeEventListener('dragover', dragMoveHandler);
//     container.removeEventListener('drop', handleDrop);
//     container.removeEventListener('click', handleRootClick);
//     restartBtn.removeEventListener('click', initGame);
//     retryLevelBtn?.removeEventListener('click', handleRetry);
//     nextLevelBtn?.removeEventListener('click', handleNextLevel);
//     try {
//       // stop the last tracked audio
//       if (currentAudio) { try { currentAudio.pause(); currentAudio.currentTime = 0; } catch(e){} currentAudio = null; }
//       // stop any other audios created by this panel
//       if (_activeAudios.size) {
//         _activeAudios.forEach(a => {
//           try { a.pause(); a.currentTime = 0; a.src = ''; } catch(e) {}
//         });
//         _activeAudios.clear();
//       }
//     } catch(e) {}
//     delete container._ghepCleanup;
//   };
// }

// export function unmount(container) {
//   if (!container) return; if (container._ghepCleanup) container._ghepCleanup();
// }