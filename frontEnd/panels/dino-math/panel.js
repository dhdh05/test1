import { callAPI, submitGameResult } from '../../js/utils.js';

// Load CSS
function loadStyles() {
  if (!document.querySelector('link[data-panel="dino-math"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './panels/dino-math/style.css';
    link.setAttribute('data-panel', 'dino-math');
    document.head.appendChild(link);
  }
}

// Dữ liệu dự phòng (Safe Mode)
const FALLBACK_LEVELS = [
    {
        level_id: 999,
        title: "Dino Tập Đi (Offline)",
        description: "Cộng trừ cơ bản",
        config: { speed: 6, ops: ['+', '-'] }
    },
    {
        level_id: 888,
        title: "Dino Chạy Bộ (Offline)",
        description: "Nhân chia cơ bản",
        config: { speed: 9, ops: ['*', '/'] }
    }
];

export async function mount(container) {
  if (!container) return;
  loadStyles();

  container.innerHTML = '<div class="loading">⏳ Đang tải Khủng Long...</div>';

  try {
      // Gọi API lấy level
      const res = await callAPI('/games/levels/dino'); // Nhớ đổi tên trong DB là 'dino' hoặc 'dino-math' cho khớp
      
      let levels = [];
      if (res && res.success && res.data.length > 0) {
          levels = res.data;
      } else {
          levels = FALLBACK_LEVELS;
      }
      renderLevelList(container, levels);

  } catch (err) {
      console.error("Lỗi:", err);
      renderLevelList(container, FALLBACK_LEVELS);
  }
}

function renderLevelList(container, levels) {
    let html = `
        <div class="dino-panel">
            <div class="game-container" style="display:block; text-align:center; padding-top:40px; height:auto; min-height:400px; border:none; box-shadow:none;">
                <h1 style="color:#4CAF50; font-size: 2rem; margin-bottom:10px;"><i class="fas fa-dragon"></i> Khủng Long Giỏi Toán</h1>
                <p style="margin-bottom:30px; color:#555;">Giúp khủng long vượt chướng ngại vật bằng cách giải toán!</p>
                <div style="display:grid; gap:15px; padding:0 20px; max-width:600px; margin:0 auto;">
    `;

    levels.forEach(level => {
        html += `
            <div class="level-card" id="btn-play-${level.level_id}"
                 style="background:#f1f8e9; padding:20px; border-radius:12px; border:2px solid #81c784; cursor:pointer; transition:all 0.2s; text-align:left; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong style="font-size:18px; color:#2e7d32;">${level.title}</strong>
                    <div style="font-size:14px; color:#558b2f; margin-top:5px;">${level.description}</div>
                </div>
                <button style="background:#4CAF50; color:white; border:none; padding:10px 20px; border-radius:25px; cursor:pointer; font-weight:bold;">Chơi ngay ▶</button>
            </div>
        `;
    });

    html += '</div></div></div>';
    container.innerHTML = html;

    levels.forEach(l => {
        document.getElementById(`btn-play-${l.level_id}`).addEventListener('click', () => startGame(container, l));
    });
}

// --- LOGIC GAME ---
function startGame(container, level) {
    // Config
    const GAME_SPEED = (level.config && level.config.speed) || 6;
    const OPS = (level.config && level.config.ops) || ['+', '-'];

    container.innerHTML = `
    <div class="dino-panel">
      <div class="game-container">
          <div class="hud">
              <button id="btn-back-menu" style="margin-right:15px; background:#fff; border:2px solid #333; cursor:pointer; padding:5px 10px; font-weight:bold;">⬅ Thoát</button>
              <span>Điểm: <span id="score">0</span></span>
              <div id="lives-container" class="lives-wrapper" style="margin-left:15px; color:red;"></div>
          </div>
          <canvas id="gameCanvas" width="800" height="300"></canvas>

          <div id="start-screen" class="overlay">
              <h1 style="color:white; text-shadow:2px 2px #000;">Nhấn SPACE hoặc CLICK để chạy!</h1>
          </div>
          
          <div id="game-over-screen" class="overlay hidden">
              <h1 style="color:#ff5252; background:white; padding:5px 20px; border-radius:10px;">THUA RỒI!</h1>
              <p style="color:white; font-size:20px; margin:10px 0;">Điểm của bé: <span id="final-score">0</span></p>
              <p style="color:#ffd700; font-size:16px;">Thời gian chơi: <span id="time-played">0</span> giây</p>
              <div style="margin-top:20px;">
                  <button id="btn-restart" style="padding:10px 20px; font-size:18px; cursor:pointer; background:#4CAF50; color:white; border:none; border-radius:5px; margin-right:10px;">Chơi lại</button>
                  <button id="btn-quit" style="padding:10px 20px; font-size:18px; cursor:pointer; background:#f44336; color:white; border:none; border-radius:5px;">Chọn cấp độ</button>
              </div>
          </div>
      </div>

      <div id="math-modal" class="modal hidden">
          <div class="modal-content">
              <h2 style="color:#d84315;">🆘 Cứu mạng!</h2>
              <p>Trả lời đúng để tiếp tục chạy:</p>
              <div id="math-question" class="question-text" style="font-size:32px; color:#333; margin:15px 0;">10 + 5 = ?</div>
              <div id="answers-container" class="answers-grid"></div>
              <div class="timer-bar" style="height:5px; background:#ddd; margin-top:10px; width:100%;"><div id="math-timer" style="height:100%; background:red; width:100%;"></div></div>
          </div>
      </div>
    </div>
    `;

    // --- Variables ---
    const canvas = container.querySelector('#gameCanvas');
    const ctx = canvas.getContext('2d');
    
    let gameRunning = false;
    let frameId;
    let score = 0;
    let lives = 2;
    let speed = GAME_SPEED;
    let startTime = 0; // <--- BIẾN TÍNH GIỜ
    
    const dino = { x: 50, y: 200, w: 40, h: 40, dy: 0, jumpForce: 12, ground: 200, gravity: 0.6, isJumping: false };
    let obstacles = [];
    let frameCount = 0;

    // Elements
    const startScreen = container.querySelector('#start-screen');
    const gameOverScreen = container.querySelector('#game-over-screen');
    const modal = container.querySelector('#math-modal');
    const scoreEl = container.querySelector('#score');
    const finalScoreEl = container.querySelector('#final-score');
    const timePlayedEl = container.querySelector('#time-played');
    
    // Controls
    function jump() {
        if (!gameRunning) return;
        if (!dino.isJumping) {
            dino.dy = -dino.jumpForce;
            dino.isJumping = true;
        }
    }

    const keydownHandler = (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            if (!gameRunning && !gameOverScreen.classList.contains('hidden')) return;
            if (!gameRunning && startScreen) startGameLoop();
            else jump();
        }
    };
    const touchHandler = (e) => {
        e.preventDefault();
        if (!gameRunning && startScreen) startGameLoop();
        else jump();
    };

    document.addEventListener('keydown', keydownHandler);
    canvas.addEventListener('touchstart', touchHandler);
    canvas.addEventListener('mousedown', touchHandler);

    container.querySelector('#btn-back-menu').addEventListener('click', () => { cleanup(); mount(container); });
    container.querySelector('#btn-quit').addEventListener('click', () => { cleanup(); mount(container); });
    container.querySelector('#btn-restart').addEventListener('click', resetGame);

    function resetGame() {
        gameOverScreen.classList.add('hidden');
        score = 0;
        lives = 2;
        speed = GAME_SPEED;
        obstacles = [];
        dino.y = dino.ground;
        dino.dy = 0;
        updateLivesUI();
        scoreEl.textContent = '0';
        startGameLoop();
    }

    function startGameLoop() {
        gameRunning = true;
        startTime = Date.now(); // <--- BẮT ĐẦU TÍNH GIỜ
        startScreen.classList.add('hidden');
        loop();
    }

    function spawnObstacle() {
        const minGap = 60 - speed * 2;
        if (frameCount % Math.floor(1000 / speed) === 0 || Math.random() < 0.01) {
            if (obstacles.length > 0) {
                const lastObs = obstacles[obstacles.length - 1];
                if (800 - lastObs.x < 250) return;
            }
            obstacles.push({ x: 800, y: 210, w: 20 + Math.random() * 20, h: 30 + Math.random() * 20, color: '#4CAF50' });
        }
    }

    function loop() {
        if (!gameRunning) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Đất
        ctx.beginPath(); ctx.moveTo(0, 240); ctx.lineTo(800, 240);
        ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.stroke();

        // Dino Logic
        dino.dy += dino.gravity;
        dino.y += dino.dy;
        if (dino.y > dino.ground) { dino.y = dino.ground; dino.isJumping = false; dino.dy = 0; }

        // Vẽ Dino
        ctx.fillStyle = '#ff5722'; ctx.fillRect(dino.x, dino.y, dino.w, dino.h);
        ctx.fillStyle = 'white'; ctx.fillRect(dino.x + 25, dino.y + 5, 10, 10); // Mắt
        ctx.fillStyle = 'black'; ctx.fillRect(dino.x + 30, dino.y + 7, 5, 5);

        spawnObstacle();
        
        for (let i = 0; i < obstacles.length; i++) {
            let obs = obstacles[i];
            obs.x -= speed;
            ctx.fillStyle = obs.color; ctx.fillRect(obs.x, obs.y, obs.w, obs.h);

            // Va chạm
            if (dino.x < obs.x + obs.w && dino.x + dino.w > obs.x && dino.y < obs.y + obs.h && dino.y + dino.h > obs.y) {
                handleCollision(i);
                return;
            }
            // Qua mặt
            if (obs.x + obs.w < 0) {
                obstacles.splice(i, 1); i--;
                score += 10; scoreEl.textContent = score;
                if (score % 100 === 0) speed += 0.5;
            }
        }
        frameCount++;
        frameId = requestAnimationFrame(loop);
    }

    function handleCollision(obsIndex) {
        gameRunning = false;
        generateMathQuestion(() => {
            obstacles.splice(obsIndex, 1);
            modal.classList.add('hidden');
            gameRunning = true;
            loop();
        }, () => {
            lives--; updateLivesUI();
            modal.classList.add('hidden');
            obstacles.splice(obsIndex, 1);
            if (lives <= 0) endGame();
            else { gameRunning = true; loop(); }
        });
    }

    function generateMathQuestion(onCorrect, onWrong) {
        modal.classList.remove('hidden');
        const qContainer = container.querySelector('#math-question');
        const ansContainer = container.querySelector('#answers-container');
        ansContainer.innerHTML = '';

        const op = OPS[Math.floor(Math.random() * OPS.length)];
        const limit = speed > 8 ? 20 : 10;
        const a = Math.floor(Math.random() * limit) + 1;
        const b = Math.floor(Math.random() * limit) + 1;
        let result = 0;

        if (op === '+') result = a + b;
        else if (op === '-') result = a + b; 
        else if (op === '*') result = a * b;
        else if (op === '/') result = a * b;

        let displayQ = '';
        if (op === '-') { displayQ = `${a+b} - ${b} = ?`; result = a; }
        else if (op === '/') { displayQ = `${a*b} : ${b} = ?`; result = a; }
        else displayQ = `${a} ${op} ${b} = ?`;

        qContainer.textContent = displayQ;

        let answers = [result, result + 1, result - 1, result + 2].filter(x => x >= 0);
        answers.sort(() => Math.random() - 0.5);
        answers = [...new Set(answers)].slice(0, 4); 

        answers.forEach(ans => {
            const btn = document.createElement('button');
            btn.className = 'answer-btn';
            btn.textContent = ans;
            btn.onclick = () => { if (ans === result) onCorrect(); else onWrong(); };
            ansContainer.appendChild(btn);
        });
    }

    async function endGame() {
        // --- TÍNH THỜI GIAN ---
        const endTime = Date.now();
        const timeSpent = Math.max(0, Math.floor((endTime - startTime) / 1000));
        // ----------------------

        finalScoreEl.textContent = score;
        timePlayedEl.textContent = timeSpent;
        gameOverScreen.classList.remove('hidden');
        
        let stars = 1;
        if (score >= 500) stars = 3; else if (score >= 200) stars = 2;
        const isPassed = score > 100;

        // Chỉ lưu kết quả nếu là level thật (id < 800)
        if (level.level_id < 800) {
            await submitGameResult(level.level_id, 'dino', score, stars, isPassed, timeSpent);
        }
    }

    function updateLivesUI() {
        const containerL = container.querySelector('#lives-container');
        containerL.innerHTML = '';
        for(let i = 0; i < lives; i++) containerL.innerHTML += '<i class="fas fa-heart"></i> ';
    }
    
    updateLivesUI();

    function cleanup() {
        gameRunning = false;
        cancelAnimationFrame(frameId);
        document.removeEventListener('keydown', keydownHandler);
        canvas.removeEventListener('touchstart', touchHandler);
        canvas.removeEventListener('mousedown', touchHandler);
    }
    container._dinoCleanup = cleanup;
}

export function unmount(container) {
    if (container && container._dinoCleanup) container._dinoCleanup();
}