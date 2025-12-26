import { callAPI, submitGameResult } from '../../js/utils.js';

// Load CSS
function loadStyles() {
  if (!document.querySelector('link[data-panel="hung-tao"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './panels/hung-tao/style.css';
    link.setAttribute('data-panel', 'hung-tao');
    document.head.appendChild(link);
  }
}

// 1. Hàm Mount: Gọi Backend lấy danh sách Level
export async function mount(container) {
  if (!container) return;
  loadStyles();

  container.innerHTML = '<div class="loading">⏳ Đang kết nối máy chủ lấy dữ liệu...</div>';

  // Gọi API lấy cấu hình level
  const res = await callAPI('/games/levels/hung-tao');
  
  if (!res || !res.success) {
      container.innerHTML = `
        <div class="panel-error">
            <h3>❌ Không kết nối được Server!</h3>
            <p>Hãy chắc chắn bạn đã chạy lệnh SQL và bật 'node server.js'</p>
        </div>`;
      return;
  }

  // Có dữ liệu thì vẽ danh sách
  renderLevelList(container, res.data);
}

// 2. Vẽ danh sách Level
function renderLevelList(container, levels) {
    let html = `
        <div class="hungtao-panel">
            <div class="game-wrapper" style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto;">
                <h1 style="text-align:center; color:#e67e22; margin-bottom:10px;"><i class="fas fa-apple-alt"></i> Game Hứng Táo</h1>
                <p style="text-align:center; margin-bottom:30px; color:#666;">Chọn cấp độ để bắt đầu:</p>
                <div style="display:grid; gap:15px;">
    `;

    levels.forEach(level => {
        // level.config chứa: speed, range, ops lấy từ SQL
        html += `
            <div class="level-card" id="btn-play-${level.level_id}"
                 style="background:#fff3e0; padding:15px; border-radius:10px; border:2px solid #ffcc80; cursor:pointer; display:flex; justify-content:space-between; align-items:center; transition:transform 0.2s;">
                <div>
                    <strong style="font-size:18px; color:#d84315;">${level.title}</strong>
                    <div style="font-size:13px; color:#ef6c00;">${level.description}</div>
                </div>
                <button style="background:#ef6c00; color:white; border:none; padding:8px 20px; border-radius:20px; cursor:pointer; font-weight:bold;">Chơi ▶</button>
            </div>
        `;
    });

    html += '</div></div></div>';
    container.innerHTML = html;

    // Gắn sự kiện: Bấm vào nút -> Gọi hàm startGame
    levels.forEach(l => {
        document.getElementById(`btn-play-${l.level_id}`).addEventListener('click', () => startGame(container, l));
    });
}

// 3. Hàm startGame: Logic game chính
function startGame(container, level) {
    // Lấy cấu hình từ Database
    const CONFIG = {
        speed: (level.config && level.config.speed) || 3,
        range: (level.config && level.config.range) || 10,
        ops: (level.config && level.config.ops) || ['+', '-']
    };
    
    // Vẽ giao diện game
    container.innerHTML = `
    <div class="hungtao-panel">
      <div class="game-wrapper">
        <div class="hud">
            <button id="btn-back-menu" style="background:white; border:none; border-radius:50%; width:32px; height:32px; cursor:pointer; margin-right: 10px; font-weight:bold; box-shadow:0 2px 5px rgba(0,0,0,0.2);">⬅</button>
            <div class="score-board">Điểm: <span id="score">0</span></div>
            <div id="lives-container" class="lives-wrapper" style="margin-left:auto;"></div>
        </div>

        <div class="question-board">
            <span id="question-text">Sẵn sàng?</span>
        </div>

        <canvas id="gameCanvas" width="400" height="600"></canvas>

        <div id="start-screen" class="overlay">
            <h1 style="color:white; text-shadow:2px 2px #000; margin-bottom:10px;">HỨNG TÁO</h1>
            <p style="color:white; margin-bottom:20px;">Hứng táo có số đúng với phép tính!</p>
            <button id="btn-start" style="padding:12px 30px; font-size:20px; background:#4CAF50; color:white; border:none; border-radius:50px; cursor:pointer; font-weight:bold; box-shadow:0 4px 0 #2E7D32;">BẮT ĐẦU</button>
        </div>

        <div id="game-over-screen" class="overlay hidden">
            <h1 style="color:#ff5252; background:white; padding:5px 15px; border-radius:10px;">KẾT THÚC!</h1>
            <p style="color:white; font-size:18px; margin:10px 0;">Điểm số: <span id="final-score">0</span></p>
            <p style="color:#ffd700; font-size:16px;">Thời gian chơi: <span id="time-played">0</span> giây</p>
            <div style="margin-top:15px;">
                <button id="btn-restart" style="padding:10px 20px; margin-right:10px; background:#2196F3; color:white; border:none; border-radius:5px; cursor:pointer;">Chơi Lại</button>
                <button id="btn-quit" style="padding:10px 20px; background:#f44336; color:white; border:none; border-radius:5px; cursor:pointer;">Thoát</button>
            </div>
        </div>
      </div>
    </div>
    `;

    // --- BIẾN GAME & SETUP ---
    const canvas = container.querySelector('#gameCanvas');
    const ctx = canvas.getContext('2d');
    const LANE_COUNT = 3;
    const LANE_W = canvas.width / LANE_COUNT;

    let gameRunning = false;
    let animationId;
    let score = 0;
    let lives = 3;
    let startTime = 0; // Để tính thời gian chơi
    
    let basket = { lane: 1, y: canvas.height - 80, width: 60, height: 40 };
    let apples = []; 
    let frameCount = 0;
    let currentResult = 0;

    // Elements DOM
    const scoreEl = container.querySelector('#score');
    const questionEl = container.querySelector('#question-text');
    const livesEl = container.querySelector('#lives-container');
    const startScreen = container.querySelector('#start-screen');
    const gameOverScreen = container.querySelector('#game-over-screen');
    const finalScoreEl = container.querySelector('#final-score');
    const timePlayedEl = container.querySelector('#time-played');

    // --- ĐIỀU KHIỂN ---
    function moveLeft() { if (basket.lane > 0) basket.lane--; }
    function moveRight() { if (basket.lane < LANE_COUNT - 1) basket.lane++; }

    const handleKey = (e) => {
        if (!gameRunning) return;
        if (e.code === 'ArrowLeft') moveLeft();
        if (e.code === 'ArrowRight') moveRight();
    };
    
    const handleTouch = (e) => {
        if (!gameRunning) return;
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const x = clientX - rect.left;
        if (x < rect.width / 2) moveLeft(); else moveRight();
    };

    // --- LOGIC GAME LOOP ---
    function initGame() {
        score = 0;
        lives = 3;
        apples = [];
        frameCount = 0;
        basket.lane = 1;
        startTime = Date.now(); // <--- BẮT ĐẦU TÍNH GIỜ
        
        scoreEl.innerText = '0';
        updateLivesUI();
        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        
        generateQuestion();
        gameRunning = true;
        loop();
    }

    async function endGame() {
        gameRunning = false;
        cancelAnimationFrame(animationId);

        // --- TÍNH TOÁN KẾT QUẢ ---
        const endTime = Date.now();
        const timeSpent = Math.max(0, Math.floor((endTime - startTime) / 1000)); // Tính ra giây

        finalScoreEl.innerText = score;
        timePlayedEl.innerText = timeSpent;
        gameOverScreen.classList.remove('hidden');

        // --- GỬI VỀ BACKEND ---
        const passed = score >= 50;
        const stars = score >= 100 ? 3 : (score >= 50 ? 2 : 1);
        
        // Gọi hàm utils để post lên server
        await submitGameResult(level.level_id, 'hung-tao', score, stars, passed, timeSpent);
    }

    function generateQuestion() {
        const op = CONFIG.ops[Math.floor(Math.random() * CONFIG.ops.length)];
        const limit = CONFIG.range;
        const a = Math.floor(Math.random() * limit) + 1;
        const b = Math.floor(Math.random() * limit) + 1;

        if (op === '+') { currentResult = a + b; questionEl.innerText = `${a} + ${b} = ?`; }
        else if (op === '-') { 
            const max = Math.max(a, b); const min = Math.min(a, b);
            currentResult = max - min; questionEl.innerText = `${max} - ${min} = ?`; 
        }
        else if (op === '*') { currentResult = a * b; questionEl.innerText = `${a} x ${b} = ?`; }
        else if (op === '/') { currentResult = a; questionEl.innerText = `${a * b} : ${b} = ?`; }
    }

    function spawnApples() {
        const correctLane = Math.floor(Math.random() * LANE_COUNT);
        for (let i = 0; i < LANE_COUNT; i++) {
            let val, type = 'wrong';
            if (i === correctLane) { val = currentResult; type = 'correct'; }
            else { do { val = Math.floor(Math.random() * (currentResult + 10)); } while (val === currentResult); }

            apples.push({
                lane: i, y: -60, val: val, type: type,
                speed: CONFIG.speed + Math.random() // Tốc độ rơi theo Config
            });
        }
    }

    function loop() {
        if (!gameRunning) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Vẽ nền
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#87CEEB'); grad.addColorStop(1, '#E0F7FA');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Vẽ cây nền (Trang trí)
        ctx.fillStyle = 'rgba(76, 175, 80, 0.3)';
        ctx.beginPath(); ctx.arc(0, 600, 150, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(400, 600, 150, 0, Math.PI*2); ctx.fill();

        // Vẽ Giỏ
        const bx = basket.lane * LANE_W + (LANE_W - basket.width) / 2;
        ctx.fillStyle = '#795548'; ctx.fillRect(bx, basket.y, basket.width, basket.height);
        // Quai giỏ
        ctx.strokeStyle = '#5D4037'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(bx+30, basket.y, 25, Math.PI, 0); ctx.stroke();
        
        // Sinh táo
        if (frameCount % Math.floor(250 / CONFIG.speed) === 0) spawnApples();

        // Xử lý Táo
        for (let i = 0; i < apples.length; i++) {
            let p = apples[i];
            p.y += p.speed;

            // Vẽ táo
            const px = p.lane * LANE_W + LANE_W / 2;
            ctx.fillStyle = p.type === 'correct' ? '#ff4444' : '#e57373'; 
            ctx.beginPath(); ctx.arc(px, p.y, 18, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'white'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center'; ctx.fillText(p.val, px, p.y+5);

            // Va chạm
            if (p.y >= basket.y && p.y <= basket.y + basket.height && p.lane === basket.lane) {
                if (p.type === 'correct') { score += 10; scoreEl.innerText = score; generateQuestion(); }
                else { lives--; updateLivesUI(); if (lives <= 0) { endGame(); return; } }
                apples.splice(i, 1); i--; continue;
            }
            // Rơi ra ngoài
            if (p.y > canvas.height) {
                if (p.type === 'correct') { lives--; updateLivesUI(); generateQuestion(); if (lives <= 0) { endGame(); return; } }
                apples.splice(i, 1); i--;
            }
        }
        frameCount++;
        animationId = requestAnimationFrame(loop);
    }

    function updateLivesUI() {
        livesEl.innerHTML = '';
        for(let i=0; i<lives; i++) livesEl.innerHTML += '<i class="fas fa-heart" style="color:red; margin:0 2px;"></i>';
    }

    // Cleanup khi thoát
    function cleanup() {
        gameRunning = false;
        cancelAnimationFrame(animationId);
        document.removeEventListener('keydown', handleKey);
        canvas.removeEventListener('mousedown', handleTouch);
        canvas.removeEventListener('touchstart', handleTouch);
    }
    
    // Gắn sự kiện UI
    container.querySelector('#btn-back-menu').onclick = () => { cleanup(); mount(container); };
    container.querySelector('#btn-quit').onclick = () => { cleanup(); mount(container); };
    container.querySelector('#btn-start').onclick = initGame;
    container.querySelector('#btn-restart').onclick = initGame;
    document.addEventListener('keydown', handleKey);
    canvas.addEventListener('mousedown', handleTouch);
    canvas.addEventListener('touchstart', handleTouch);

    container._hungtaoCleanup = cleanup;
}

export function unmount(container) {
    if (container && container._hungtaoCleanup) container._hungtaoCleanup();
}