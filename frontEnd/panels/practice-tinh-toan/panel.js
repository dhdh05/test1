import { callAPI, submitGameResult } from '../../js/utils.js';

// Load CSS
function loadStyles() {
  if (!document.querySelector('link[data-panel="practice-tinh-toan"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './panels/practice-tinh-toan/style.css';
    link.setAttribute('data-panel','practice-tinh-toan');
    document.head.appendChild(link);
  }
}

// Dữ liệu dự phòng (Safe Mode)
const FALLBACK_LEVELS = [
    { level_id: 101, config: { mode: 'addition' } },
    { level_id: 102, config: { mode: 'subtraction' } },
    { level_id: 103, config: { mode: 'both' } }
];

export async function mount(container) {
  if (!container) return;
  loadStyles();

  // 1. Tải giao diện
  container.innerHTML = `
    <div class="practice-container">
      <div class="loading" id="practice-loading">⏳ Đang tải dữ liệu...</div>
      <div class="game-container" id="practiceGameContainer" style="display:none;">
        
        <div class="selection-page active" id="practice-selectionPage">
          <div class="selection-header">
            <h1 style="color:#2575fc;"><i class="fas fa-calculator"></i> Luyện Tập Toán</h1>
            <p class="subtitle">Chọn loại phép tính bé muốn luyện tập nhé!</p>
          </div>
          <div class="selection-options">
            <div class="option-card" id="practice-additionOption">
              <div class="option-icon"><i class="fas fa-plus-circle"></i></div>
              <div class="option-content"><h2>Phép Cộng</h2><p>Tính tổng các số từ 2 đến 5 số hạng</p></div>
            </div>
            <div class="option-card" id="practice-subtractionOption">
              <div class="option-icon"><i class="fas fa-minus-circle"></i></div>
              <div class="option-content"><h2>Phép Trừ</h2><p>Tính hiệu các số từ 2 đến 5 số</p></div>
            </div>
            <div class="option-card" id="practice-bothOption">
              <div class="option-icon"><i class="fas fa-random"></i></div>
              <div class="option-content"><h2>Cả Hai</h2><p>Phép cộng và trừ ngẫu nhiên</p></div>
            </div>
          </div>
        </div>

        <div class="game-page" id="practice-gamePage">
          <div class="game-header">
            <button class="back-btn" id="practice-backBtn"><i class="fas fa-arrow-left"></i> Kết thúc & Lưu</button>
            <div class="current-mode" id="practice-currentMode"><i class="fas fa-plus-circle"></i> Phép Cộng</div>
            <div class="game-stats">
              <div class="mini-stat"><div class="mini-label">Đúng</div><div class="mini-value correct" id="practice-gameCorrect">0</div></div>
              <div class="mini-stat"><div class="mini-label">Sai</div><div class="mini-value wrong" id="practice-gameWrong">0</div></div>
              <div class="mini-stat"><div class="mini-label">Tỉ lệ</div><div class="mini-value" id="practice-gameAccuracy">0%</div></div>
            </div>
          </div>

          <div class="question-section">
            <div class="question-box">
              <h2>Tính kết quả:</h2>
              <div class="math-expression" id="practice-mathExpression"></div>
            </div>
          </div>

          <div class="answers-section">
            <h3>Chọn đáp án đúng:</h3>
            <div class="answers-grid" id="practice-answersGrid"></div>
          </div>

          <div class="next-section">
            <button id="practice-nextBtn" class="next-btn" disabled><i class="fas fa-forward"></i> Câu tiếp theo</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // 2. Lấy dữ liệu Level từ DB để mapping ID
  let dbLevels = [];
  try {
      const res = await callAPI('/games/levels/tinh-toan');
      if (res && res.success && res.data.length > 0) {
          dbLevels = res.data;
      } else {
          dbLevels = FALLBACK_LEVELS;
      }
  } catch (e) {
      dbLevels = FALLBACK_LEVELS;
  }

  // Hiển thị game sau khi load xong
  container.querySelector('#practice-loading').style.display = 'none';
  container.querySelector('#practiceGameContainer').style.display = 'flex';

  // ---------- STATE ----------
  let gameCorrect = 0, gameWrong = 0;
  let currentMode = ''; // 'addition'|'subtraction'|'both'
  let currentLevelId = null; // ID lấy từ DB để lưu điểm
  let currentQuestion = null; 
  let isAnswered = false; 
  let currentAnswer = 0; 
  let autoNextTimeout = null;
  let startTime = 0; // Tính giờ

  // ---------- DOM REFS ----------
  const selectionPage = container.querySelector('#practice-selectionPage');
  const gamePage = container.querySelector('#practice-gamePage');
  const gameCorrectElement = container.querySelector('#practice-gameCorrect');
  const gameWrongElement = container.querySelector('#practice-gameWrong');
  const gameAccuracyElement = container.querySelector('#practice-gameAccuracy');
  const currentModeElement = container.querySelector('#practice-currentMode');
  const mathExpression = container.querySelector('#practice-mathExpression');
  const answersGrid = container.querySelector('#practice-answersGrid');
  const nextBtn = container.querySelector('#practice-nextBtn');
  const backBtn = container.querySelector('#practice-backBtn');
  
  const additionBtn = container.querySelector('#practice-additionOption');
  const subtractionBtn = container.querySelector('#practice-subtractionOption');
  const bothBtn = container.querySelector('#practice-bothOption');

  // ---------- NAVIGATION ----------
  function showSelectionPage() { 
      selectionPage.classList.add('active'); 
      gamePage.classList.remove('active'); 
  }

  function showGamePage(mode) {
      currentMode = mode;
      
      // Tìm level_id tương ứng trong DB để sau này lưu điểm
      const levelObj = dbLevels.find(l => l.config && l.config.mode === mode) || dbLevels[0];
      currentLevelId = levelObj.level_id;

      // Reset stats
      gameCorrect = 0; 
      gameWrong = 0; 
      startTime = Date.now(); // Bắt đầu tính giờ
      
      updateGameStats(); 
      updateModeDisplay(); 
      
      selectionPage.classList.remove('active'); 
      gamePage.classList.add('active'); 
      
      generateNewQuestion();
  }

  // Xử lý nút Back -> Lưu kết quả
  async function handleBack() {
      // 1. Tính toán kết quả phiên chơi
      const endTime = Date.now();
      const timeSpent = Math.floor((endTime - startTime) / 1000);
      const totalQ = gameCorrect + gameWrong;
      
      if (totalQ > 0) {
          // Chỉ lưu nếu bé đã làm ít nhất 1 câu
          const score = gameCorrect * 10; // 10 điểm 1 câu
          
          // Logic sao: >80% đúng là 3 sao, >50% là 2 sao
          let stars = 1;
          const ratio = gameCorrect / totalQ;
          if (ratio >= 0.8) stars = 3;
          else if (ratio >= 0.5) stars = 2;

          // Gửi lên Server
          // Lưu ý: isPassed luôn true vì đây là luyện tập
          await submitGameResult(currentLevelId, 'tinh-toan', score, stars, true, timeSpent);
          
          alert(`🏁 Kết thúc bài luyện tập!\n✅ Đúng: ${gameCorrect}\n❌ Sai: ${gameWrong}\n⏱ Thời gian: ${timeSpent} giây`);
      }

      showSelectionPage();
  }

  function updateModeDisplay(){ 
      let modeText=''; let iconClass=''; 
      switch(currentMode){ 
          case 'addition': modeText='Phép Cộng'; iconClass='fas fa-plus-circle'; break; 
          case 'subtraction': modeText='Phép Trừ'; iconClass='fas fa-minus-circle'; break; 
          case 'both': modeText='Cả Hai'; iconClass='fas fa-random'; break; 
      } 
      currentModeElement.innerHTML = `<i class="${iconClass}"></i> ${modeText}`; 
  }

  // ---------- AUDIO ----------
  let currentAudio = null;
  function playSoundFile(filename) {
    return new Promise(resolve => {
      try {
        if (currentAudio) { currentAudio.pause(); currentAudio = null; }
        const audio = new Audio(`assets/sound/${filename}`);
        currentAudio = audio;
        audio.onended = resolve;
        audio.onerror = resolve;
        audio.play().catch(resolve);
      } catch (e) { resolve(); }
    });
  }

  // ---------- LOGIC TOÁN HỌC (Giữ nguyên của bạn) ----------
  function generateNewQuestion(){ 
      isAnswered=false; nextBtn.disabled=true; 
      if (autoNextTimeout){ clearTimeout(autoNextTimeout); autoNextTimeout=null; } 
      
      let operationType = currentMode; 
      if (operationType === 'both'){ 
          operationType = Math.random()>0.5 ? 'addition' : 'subtraction'; 
      } 
      currentQuestion = operationType==='addition' ? generateAdditionQuestion() : generateSubtractionQuestion(); 
      displayQuestion(); 
      generateAnswers(); 
  }

  function generateAdditionQuestion(){ 
      const numberOfTerms = getRandomNumber(2,4); // Giảm max terms xuống 4 cho dễ nhìn
      const numbers=[]; let sum=0; 
      for (let i=0;i<numberOfTerms;i++){ 
          if (i===numberOfTerms-1){ 
              const maxNumber = 20 - sum; 
              numbers.push(maxNumber<=0?0:getRandomNumber(1,maxNumber)); 
              sum += numbers[i]; 
          } else { 
              const maxForThis = Math.min(10, 20 - sum - (numberOfTerms - i - 1)); 
              const number = getRandomNumber(1, Math.max(1, maxForThis)); 
              numbers.push(number); 
              sum += number; 
          } 
      } 
      currentAnswer = sum; 
      return { type:'addition', numbers, answer:sum, expression: numbers.join(' + ') }; 
  }

  function generateSubtractionQuestion(){ 
      const numberOfNumbers = getRandomNumber(2,3); // Giảm xuống 2-3 số cho phép trừ
      const numbers=[]; 
      let firstNumber = getRandomNumber(5,20); 
      numbers.push(firstNumber); 
      let result = firstNumber; 
      for (let i=1;i<numberOfNumbers;i++){ 
          const maxSubtract = result - 1; 
          if (maxSubtract <= 0){ numbers.push(0); } 
          else { 
              const subtractNumber = getRandomNumber(1, maxSubtract); 
              numbers.push(subtractNumber); 
              result -= subtractNumber; 
          } 
      } 
      currentAnswer = result; 
      return { type:'subtraction', numbers, answer:result, expression: numbers.join(' - ') }; 
  }

  function displayQuestion(){ 
      mathExpression.innerHTML=''; 
      const isAddition = currentQuestion.type==='addition'; 
      const numbers = currentQuestion.numbers; 
      const operator = isAddition?'+':'-'; 
      
      numbers.forEach((number,index)=>{ 
          const numberElement = document.createElement('div'); 
          numberElement.className='number'; 
          numberElement.textContent = number; 
          mathExpression.appendChild(numberElement); 
          if (index < numbers.length -1){ 
              const operatorElement = document.createElement('div'); 
              operatorElement.className='operator'; 
              operatorElement.textContent = operator; 
              mathExpression.appendChild(operatorElement); 
          } 
      }); 
      
      const equalElement = document.createElement('div'); 
      equalElement.className='equal'; equalElement.textContent='='; 
      mathExpression.appendChild(equalElement); 
      
      const questionMarkElement = document.createElement('div'); 
      questionMarkElement.className='question-mark'; 
      questionMarkElement.textContent='?'; 
      mathExpression.appendChild(questionMarkElement); 
  }

  function generateAnswers(){ 
      answersGrid.innerHTML=''; 
      const correctAnswer = currentAnswer; 
      const answers=[correctAnswer]; 
      while (answers.length<4){ 
          let wrongAnswer; 
          const offset = getRandomNumber(1,5); 
          const shouldAdd = Math.random()>0.5; 
          wrongAnswer = shouldAdd ? correctAnswer + offset : correctAnswer - offset; 
          if (wrongAnswer>=0 && wrongAnswer<=30 && !answers.includes(wrongAnswer)) answers.push(wrongAnswer); 
      } 
      const shuffled = shuffleArray(answers); 
      
      shuffled.forEach(answer=>{ 
          const btn = document.createElement('button'); 
          btn.className='answer-btn'; 
          btn.textContent = answer; 
          btn.dataset.value = answer; 
          btn.dataset.correct = answer===correctAnswer? 'true':'false'; 
          btn.addEventListener('click', () => handleAnswerClick(btn)); 
          answersGrid.appendChild(btn); 
      }); 
  }

  function handleAnswerClick(clickedButton){
    if (isAnswered) return;
    isAnswered = true;
    const isCorrect = clickedButton.dataset.correct === 'true';
    const allAnswerButtons = container.querySelectorAll('.answer-btn');
    
    allAnswerButtons.forEach(button => {
      button.disabled = true;
      if (button.dataset.correct === 'true') button.classList.add('correct');
      else if (button === clickedButton && !isCorrect) button.classList.add('incorrect');
    });

    if (isCorrect) {
      gameCorrect++; 
      playSoundFile('sound_correct.mp3'); // Đổi tên file cho chuẩn với assets của bạn
    } else {
      gameWrong++; 
      playSoundFile('sound_wrong.mp3');
    }
    
    updateGameStats();
    nextBtn.disabled = false;

    // Tự động chuyển câu sau 2s
    autoNextTimeout = setTimeout(nextQuestion, 2000);
  }


  function nextQuestion(){ 
      if (autoNextTimeout){ clearTimeout(autoNextTimeout); autoNextTimeout=null; } 
      generateNewQuestion(); 
  }

  function updateGameStats(){ 
      gameCorrectElement.textContent = gameCorrect; 
      gameWrongElement.textContent = gameWrong; 
      const total = gameCorrect + gameWrong; 
      let accuracy = 0; 
      if (total>0) accuracy = Math.round((gameCorrect/total)*100); 
      gameAccuracyElement.textContent = `${accuracy}%`; 
  }

  function getRandomNumber(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
  function shuffleArray(arr){ const s=[...arr]; for (let i=s.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [s[i],s[j]]=[s[j],s[i]]; } return s; }

  // EVENTS
  additionBtn.onclick = () => showGamePage('addition');
  subtractionBtn.onclick = () => showGamePage('subtraction');
  bothBtn.onclick = () => showGamePage('both');
  
  backBtn.onclick = handleBack; // Sửa sự kiện Back để lưu điểm
  nextBtn.onclick = nextQuestion;

  // Cleanup
  container._practiceCleanup = () => {
    if (autoNextTimeout) clearTimeout(autoNextTimeout);
    if (currentAudio) currentAudio.pause();
  };
}

export function unmount(container){ 
    if (!container) return; 
    if (container._practiceCleanup) container._practiceCleanup(); 
}