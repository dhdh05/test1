import { callAPI, submitGameResult } from '../../js/utils.js';

// Load CSS
function loadStyles() {
    if (!document.querySelector('link[data-panel="practice-nhan-ngon"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = './panels/practice-nhan-ngon/style.css';
        link.setAttribute('data-panel', 'practice-nhan-ngon');
        document.head.appendChild(link);
    }
}

// 1. MOUNT: Lấy danh sách bài học
export async function mount(container) {
    if (!container) return;
    loadStyles();

    container.innerHTML = '<div class="loading">⏳ Đang tải bài tập AI...</div>';

    // Gọi API lấy level 'nhan-ngon'
    const res = await callAPI('/games/levels/nhan-ngon');
    
    // Fallback nếu lỗi hoặc chưa có DB
    let levels = (res && res.success) ? res.data : [
        { level_id: 991, title: "Làm quen (Offline)", description: "Phạm vi 5 (Chế độ thử nghiệm)", config: { max: 5, questions: 5 } }
    ];

    renderLevelList(container, levels);
}

function renderLevelList(container, levels) {
    let html = `
        <div class="practice-nhan-panel" style="display:block;">
            <div style="max-width:800px; margin:0 auto; text-align:center; padding-top:20px;">
                <h1 style="color:#00ffcc; font-family:'Segoe UI',sans-serif; margin-bottom:10px; text-shadow:0 0 10px rgba(0,255,204,0.5);">✋ AI Đếm Ngón Tay</h1>
                <p style="color:#ccc; margin-bottom:30px;">Camera sẽ nhận diện ngón tay của bé để trả lời!</p>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:20px; padding:0 20px;">
    `;

    levels.forEach(level => {
        html += `
            <div class="level-card" id="btn-start-${level.level_id}"
                 style="background:linear-gradient(145deg, #1a1a1a, #2a2a2a); padding:20px; border-radius:15px; border:1px solid #333; cursor:pointer; text-align:left; transition:all 0.3s; position:relative; overflow:hidden;">
                <div style="position:relative; z-index:2;">
                    <strong style="font-size:18px; color:#00ffcc; display:block; margin-bottom:5px;">${level.title}</strong>
                    <div style="font-size:14px; color:#888;">${level.description}</div>
                </div>
                <button style="margin-top:15px; background:transparent; border:1px solid #00ffcc; color:#00ffcc; padding:8px 16px; border-radius:20px; cursor:pointer; font-weight:bold; width:100%;">Vào Học ▶</button>
            </div>
        `;
    });

    html += '</div></div></div>';
    container.innerHTML = html;

    levels.forEach(l => {
        document.getElementById(`btn-start-${l.level_id}`).addEventListener('click', () => startGame(container, l));
    });
}

// 2. GAME LOGIC
function startGame(container, level) {
    // Config
    const MAX_NUM = (level.config && level.config.max) || 10;
    const TARGET_QUESTIONS = (level.config && level.config.questions) || 5;

    // Render UI Game
    container.innerHTML = `
        <div class="practice-nhan-panel">
            <div class="ai-container">
                <button id="btn-back" style="position:absolute; top:14px; left:14px; z-index:100; background:rgba(255,255,255,0.2); border:none; color:white; padding:5px 10px; border-radius:5px; cursor:pointer;">⬅ Thoát</button>
                
                <div id="loading">
                    <div class="loader"></div>
                    <p id="loading-text">Đang tải mô hình AI...</p>
                </div>

                <div class="hud" style="left:80px;"> <div class="score">Câu: <span id="q-count">1</span>/${TARGET_QUESTIONS}</div>
                    <div class="status">AI thấy: <span id="detected-fingers" style="color:#00ffcc; font-size:1.3em; font-weight:bold;">0</span> ngón</div>
                </div>

                <div class="question-box">
                    <span id="question">...</span>
                </div>

                <div class="progress-bar"><div id="progress-fill"></div></div>

                <video id="input_video" playsinline style="display:none"></video>
                <canvas id="output_canvas"></canvas>
            </div>
        </div>
    `;

    // --- VARIABLES ---
    const qs = sel => container.querySelector(sel);
    const videoElement = qs('#input_video');
    const canvasElement = qs('#output_canvas');
    const canvasCtx = canvasElement.getContext('2d');
    const fingerEl = qs('#detected-fingers');
    const questionEl = qs('#question');
    const loadingEl = qs('#loading');
    const loadingText = qs('#loading-text');
    const progressEl = qs('.progress-bar');
    const progressFill = qs('#progress-fill');
    const qCountEl = qs('#q-count');

    let currentScore = 0;
    let questionIndex = 0;
    let currentTarget = 0;
    let holdTimer = 0;
    const HOLD_THRESHOLD = 30; // Giữ ngón tay trong ~1 giây để chốt đáp án
    let isModelLoaded = false;
    let isGameRunning = true;
    let startTime = Date.now();

    // MediaPipe objects
    let hands = null;
    let camera = null;

    // Load Script Function
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) return resolve();
            const s = document.createElement('script');
            s.src = src; s.async = true;
            s.onload = () => resolve();
            s.onerror = () => reject(new Error('Lỗi tải: ' + src));
            document.head.appendChild(s);
        });
    }

    const mpScripts = [
        'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js'
    ];

    // --- LOGIC CÂU HỎI ---
    function newQuestion() {
        if (questionIndex >= TARGET_QUESTIONS) {
            finishGame();
            return;
        }

        questionIndex++;
        qCountEl.innerText = questionIndex;

        // Sinh phép tính ngẫu nhiên <= MAX_NUM
        // a + b = ?
        let a = Math.floor(Math.random() * (MAX_NUM + 1));
        let b = Math.floor(Math.random() * (MAX_NUM - a + 1));
        
        // Đôi khi đảo thành phép trừ cho vui (nếu level > 1)
        if (Math.random() > 0.6 && level.level_number > 1) {
             let sum = a + b;
             currentTarget = a;
             questionEl.innerText = `${sum} - ${b} = ?`;
        } else {
             currentTarget = a + b;
             questionEl.innerText = `${a} + ${b} = ?`;
        }
        
        holdTimer = 0;
        progressEl.style.display = 'none';
        progressFill.style.width = '0%';
    }

    // --- LOGIC ĐẾM NGÓN TAY ---
    function countFingers(landmarks) {
        let count = 0;
        // 4 ngón dài (Trỏ, Giữa, Nhẫn, Út) - So sánh đầu ngón với khớp nối
        const fingerTips = [8, 12, 16, 20];
        const fingerPips = [6, 10, 14, 18];
        for (let i = 0; i < 4; i++) {
            if (landmarks[fingerTips[i]].y < landmarks[fingerPips[i]].y) count++;
        }
        // Ngón cái (So sánh trục X)
        const thumbTip = landmarks[4];
        const thumbIp = landmarks[3];
        const pinkyMcp = landmarks[17];
        // Logic ngón cái hơi phức tạp: Nếu đầu ngón cái xa ngón út hơn khớp ngón cái -> Đang duỗi
        if (Math.abs(thumbTip.x - pinkyMcp.x) > Math.abs(thumbIp.x - pinkyMcp.x)) count++;
        return count;
    }

    function onResults(results) {
        if (!isGameRunning) return;

        if (!isModelLoaded) {
            isModelLoaded = true;
            loadingEl.style.display = 'none';
            newQuestion();
        }

        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        // Vẽ video lật ngược (để giống gương)
        canvasCtx.translate(canvasElement.width, 0);
        canvasCtx.scale(-1, 1);
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

        let totalFingers = 0;
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            for (const landmarks of results.multiHandLandmarks) {
                // Vẽ khung xương
                if (window.drawConnectors) drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 5});
                if (window.drawLandmarks) drawLandmarks(canvasCtx, landmarks, {color: '#FF0000', lineWidth: 2});
                totalFingers += countFingers(landmarks);
            }
        }
        canvasCtx.restore();

        // Update UI
        fingerEl.innerText = totalFingers;
        checkAnswer(totalFingers);
    }

    function checkAnswer(detectedNumber) {
        if (detectedNumber === currentTarget) {
            // Nếu đúng số -> Hiện thanh progress
            progressEl.style.display = 'block';
            holdTimer++;
            let percentage = (holdTimer / HOLD_THRESHOLD) * 100;
            progressFill.style.width = `${percentage}%`;
            
            // Giữ đủ lâu -> Chốt đáp án
            if (holdTimer >= HOLD_THRESHOLD) {
                currentScore += 10; // Mỗi câu 10 điểm
                // Hiệu ứng Visual
                canvasElement.style.filter = 'sepia(1) hue-rotate(90deg) saturate(5)'; // Nháy xanh
                setTimeout(() => { canvasElement.style.filter = 'none'; }, 300);
                
                // Âm thanh
                const audio = new Audio('./assets/sound/sound_correct.mp3'); 
                audio.play().catch(()=>{});

                newQuestion();
            }
        } else {
            // Sai số -> Reset timer
            holdTimer = 0;
            progressFill.style.width = '0%';
            progressEl.style.display = 'none';
        }
    }

    // --- KẾT THÚC GAME ---
    async function finishGame() {
        isGameRunning = false;
        cleanup(); // Tắt camera ngay

        container.innerHTML = '<div class="loading">🎉 Đang lưu kết quả...</div>';

        // Tính kết quả
        const endTime = Date.now();
        const timeSpent = Math.floor((endTime - startTime) / 1000);
        const passed = currentScore >= (TARGET_QUESTIONS * 10) * 0.5; // Đúng 50% là qua
        const stars = currentScore >= (TARGET_QUESTIONS * 10) ? 3 : 2;

        // Gửi về Server
        await submitGameResult(level.level_id, 'nhan-ngon', currentScore, stars, passed, timeSpent);

        // Hiện bảng thành tích
        container.innerHTML = `
            <div class="practice-nhan-panel">
                <div style="color:white; text-align:center; margin-top:50px;">
                    <h1 style="font-size:3rem; margin-bottom:10px;">Hoàn Thành!</h1>
                    <p style="font-size:1.5rem;">Điểm số: ${currentScore}</p>
                    <div style="font-size:2rem; margin:20px;">${'⭐'.repeat(stars)}</div>
                    <button id="btn-menu" style="background:#00ffcc; color:black; padding:10px 30px; border:none; border-radius:30px; font-size:1.2rem; cursor:pointer; font-weight:bold;">Về Menu</button>
                </div>
            </div>
        `;
        document.getElementById('btn-menu').onclick = () => mount(container);
    }

    function cleanup() {
        isGameRunning = false;
        if (camera) { camera.stop(); camera = null; }
        if (hands) { hands.close(); hands = null; }
    }
    
    // Nút thoát giữa chừng
    qs('#btn-back').onclick = () => {
        cleanup();
        mount(container);
    };
    container._practiceNhanCleanup = cleanup; // Gắn cleanup cho main.js gọi nếu user chuyển tab

    // --- KHỞI TẠO ---
    Promise.all(mpScripts.map(loadScript)).then(() => {
        try {
            canvasElement.width = 1280;
            canvasElement.height = 720;

            // Khởi tạo MediaPipe Hands từ window (do script đã load)
            hands = new window.Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
            hands.setOptions({
                maxNumHands: 2,
                modelComplexity: 1,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });
            hands.onResults(onResults);

            // Khởi tạo Camera
            camera = new window.Camera(videoElement, {
                onFrame: async () => { if (isGameRunning) await hands.send({image: videoElement}); },
                width: 1280,
                height: 720
            });
            camera.start();

        } catch (err) {
            console.error('Lỗi khởi tạo AI:', err);
            loadingText.innerText = 'Lỗi khởi tạo Camera hoặc AI. Hãy thử tải lại trang (F5).';
        }
    }).catch(err => {
        console.error('Lỗi tải script:', err);
        loadingText.innerText = 'Không thể tải thư viện AI. Kiểm tra kết nối mạng!';
    });
}

export function unmount(container) {
    if (!container) return;
    if (container._practiceNhanCleanup) container._practiceNhanCleanup();
}