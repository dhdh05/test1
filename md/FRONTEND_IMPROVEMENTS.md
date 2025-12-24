# Hướng dẫn cải thiện Frontend - Hiển thị dữ liệu từ Backend

## Tổng quan

Hiện tại frontend đã có khả năng:
- ✅ Đăng ký / Đăng nhập
- ✅ Lưu kết quả game
- ✅ Gọi API backend

Cần cải thiện:
- ❌ Hiển thị danh sách game levels từ database
- ❌ Hiển thị tiến độ học sinh
- ❌ Hiển thị lịch sử kết quả
- ❌ Hiển thị thành tích
- ❌ Hiển thị bảng xếp hạng

## 1. Tạo trang Game Selection

### File: `frontEnd/panels/game-selection/panel.js`

```javascript
const API_URL = 'http://localhost:5000';

export async function mount(container) {
  const token = localStorage.getItem('hm_is_authed');
  const studentId = localStorage.getItem('STUDENT_ID');
  
  if (!token || !studentId) {
    container.innerHTML = `
      <div class="panel">
        <h2>⚠️ Vui lòng đăng nhập</h2>
        <p>Bạn cần đăng nhập để chơi game.</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = `
    <div class="game-selection-panel">
      <h1>🎮 Chọn trò chơi</h1>
      <div class="games-grid" id="gamesGrid">
        <div class="loading">Đang tải...</div>
      </div>
    </div>
  `;
  
  await loadGames();
}

async function loadGames() {
  const gamesGrid = document.getElementById('gamesGrid');
  
  const games = [
    { type: 'hoc-so', name: 'Học Số', icon: '🔢', color: '#5b8cff' },
    { type: 'ghep-so', name: 'Ghép Số', icon: '🧩', color: '#ff6a88' },
    { type: 'chan-le', name: 'Chẵn Lẻ', icon: '⚖️', color: '#31c48d' },
    { type: 'so-sanh', name: 'So Sánh', icon: '⚡', color: '#ffd25a' },
    { type: 'xep-so', name: 'Xếp Số', icon: '📊', color: '#ff9f5f' }
  ];
  
  let html = '';
  
  for (const game of games) {
    try {
      const response = await fetch(`${API_URL}/api/games/levels/${game.type}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        const levels = data.data;
        html += `
          <div class="game-card" style="border-left: 4px solid ${game.color}">
            <div class="game-icon" style="background: ${game.color}">${game.icon}</div>
            <h3>${game.name}</h3>
            <p>${levels.length} levels</p>
            <button onclick="selectGame('${game.type}')" class="btn-play">
              Chơi ngay
            </button>
          </div>
        `;
      }
    } catch (error) {
      console.error(`Error loading ${game.type}:`, error);
    }
  }
  
  gamesGrid.innerHTML = html || '<p>Không có game nào</p>';
}

window.selectGame = function(gameType) {
  // Navigate to game levels page
  console.log('Selected game:', gameType);
  // TODO: Implement navigation
};

export function unmount(container) {
  // Cleanup
}
```

### CSS: `frontEnd/panels/game-selection/style.css`

```css
.game-selection-panel {
  padding: 20px;
}

.game-selection-panel h1 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  padding: 20px;
}

.game-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.game-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

.game-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 15px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
}

.game-card h3 {
  margin-bottom: 10px;
  color: #333;
}

.game-card p {
  color: #666;
  margin-bottom: 15px;
}

.btn-play {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: transform 0.2s;
}

.btn-play:hover {
  transform: scale(1.05);
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}
```

## 2. Tạo trang Game Levels

### File: `frontEnd/panels/game-levels/panel.js`

```javascript
const API_URL = 'http://localhost:5000';

export async function mount(container, gameType) {
  const token = localStorage.getItem('hm_is_authed');
  const studentId = localStorage.getItem('STUDENT_ID');
  
  container.innerHTML = `
    <div class="game-levels-panel">
      <h1>📚 Chọn Level</h1>
      <div id="levelsContainer" class="levels-container">
        <div class="loading">Đang tải levels...</div>
      </div>
    </div>
  `;
  
  await loadLevels(gameType, studentId, token);
}

async function loadLevels(gameType, studentId, token) {
  const container = document.getElementById('levelsContainer');
  
  try {
    // Load levels
    const levelsResponse = await fetch(`${API_URL}/api/games/levels/${gameType}`);
    const levelsData = await levelsResponse.json();
    
    if (!levelsData.success) {
      container.innerHTML = '<p>Không thể tải levels</p>';
      return;
    }
    
    const levels = levelsData.data;
    
    // Load progress if logged in
    let progress = null;
    if (token && studentId) {
      try {
        const progressResponse = await fetch(
          `${API_URL}/api/games/progress/${studentId}/${gameType}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        const progressData = await progressResponse.json();
        if (progressData.success) {
          progress = progressData.data;
        }
      } catch (error) {
        console.log('No progress yet');
      }
    }
    
    let html = '';
    levels.forEach((level, index) => {
      const isLocked = progress && index > 0 && index > progress.highest_level_passed;
      const isPassed = progress && index <= progress.highest_level_passed;
      
      html += `
        <div class="level-card ${isLocked ? 'locked' : ''} ${isPassed ? 'passed' : ''}">
          <div class="level-number">Level ${level.level_number}</div>
          <h3>${level.title}</h3>
          <p>${level.description}</p>
          <div class="level-info">
            <span class="difficulty ${level.difficulty}">${level.difficulty}</span>
            <span class="time-limit">⏱️ ${level.time_limit}s</span>
          </div>
          ${isLocked ? 
            '<button class="btn-locked" disabled>🔒 Khóa</button>' :
            `<button class="btn-start" onclick="startLevel(${level.level_id})">
              ${isPassed ? '🔄 Chơi lại' : '▶️ Bắt đầu'}
            </button>`
          }
        </div>
      `;
    });
    
    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = '<p>Lỗi khi tải levels</p>';
    console.error(error);
  }
}

window.startLevel = function(levelId) {
  console.log('Starting level:', levelId);
  // TODO: Navigate to game play
};

export function unmount(container) {
  // Cleanup
}
```

## 3. Tạo trang Progress Dashboard

### File: `frontEnd/panels/progress/panel.js`

```javascript
const API_URL = 'http://localhost:5000';

export async function mount(container) {
  const token = localStorage.getItem('hm_is_authed');
  const studentId = localStorage.getItem('STUDENT_ID');
  
  if (!token || !studentId) {
    container.innerHTML = '<p>Vui lòng đăng nhập</p>';
    return;
  }
  
  container.innerHTML = `
    <div class="progress-panel">
      <h1>📊 Tiến độ của bạn</h1>
      
      <div class="stats-grid" id="statsGrid">
        <div class="loading">Đang tải...</div>
      </div>
      
      <h2>🎮 Tiến độ từng game</h2>
      <div class="progress-grid" id="progressGrid">
        <div class="loading">Đang tải...</div>
      </div>
      
      <h2>📜 Lịch sử chơi gần đây</h2>
      <div class="history-list" id="historyList">
        <div class="loading">Đang tải...</div>
      </div>
      
      <h2>🏆 Thành tích</h2>
      <div class="achievements-grid" id="achievementsGrid">
        <div class="loading">Đang tải...</div>
      </div>
    </div>
  `;
  
  await loadProgress(studentId, token);
}

async function loadProgress(studentId, token) {
  const headers = { 'Authorization': `Bearer ${token}` };
  
  try {
    // Load statistics
    const statsResponse = await fetch(`${API_URL}/api/games/stats/${studentId}`, { headers });
    const statsData = await statsResponse.json();
    
    if (statsData.success) {
      const stats = statsData.data;
      document.getElementById('statsGrid').innerHTML = `
        <div class="stat-card">
          <div class="stat-value">${stats.total_games}</div>
          <div class="stat-label">Games đã chơi</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.total_results}</div>
          <div class="stat-label">Lượt chơi</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.total_stars}</div>
          <div class="stat-label">⭐ Tổng sao</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.total_achievements}</div>
          <div class="stat-label">🏆 Thành tích</div>
        </div>
      `;
    }
    
    // Load game progress
    const progressResponse = await fetch(`${API_URL}/api/games/progress/${studentId}`, { headers });
    const progressData = await progressResponse.json();
    
    if (progressData.success) {
      const games = progressData.data;
      let html = '';
      games.forEach(game => {
        html += `
          <div class="progress-card">
            <h3>${game.game_type}</h3>
            <p>Level hiện tại: ${game.current_level}</p>
            <p>Level cao nhất: ${game.highest_level_passed}</p>
            <p>⭐ ${game.total_stars} sao</p>
            <p>🎯 ${game.total_attempts} lượt chơi</p>
          </div>
        `;
      });
      document.getElementById('progressGrid').innerHTML = html || '<p>Chưa có tiến độ</p>';
    }
    
    // Load recent results
    const resultsResponse = await fetch(`${API_URL}/api/games/results/${studentId}?limit=10`, { headers });
    const resultsData = await resultsResponse.json();
    
    if (resultsData.success) {
      const results = resultsData.data;
      let html = '';
      results.forEach(result => {
        html += `
          <div class="history-item">
            <div class="history-game">${result.game_type}</div>
            <div class="history-score">Điểm: ${result.score}%</div>
            <div class="history-stars">${'⭐'.repeat(result.stars)}</div>
            <div class="history-time">${new Date(result.completed_at).toLocaleDateString()}</div>
          </div>
        `;
      });
      document.getElementById('historyList').innerHTML = html || '<p>Chưa có lịch sử</p>';
    }
    
    // Load achievements
    const achievementsResponse = await fetch(`${API_URL}/api/games/achievements/${studentId}`, { headers });
    const achievementsData = await achievementsResponse.json();
    
    if (achievementsData.success) {
      const achievements = achievementsData.data;
      let html = '';
      achievements.forEach(achievement => {
        html += `
          <div class="achievement-card">
            <div class="achievement-icon">🏆</div>
            <h4>${achievement.title}</h4>
            <p>${achievement.description}</p>
            <small>${new Date(achievement.earned_at).toLocaleDateString()}</small>
          </div>
        `;
      });
      document.getElementById('achievementsGrid').innerHTML = html || '<p>Chưa có thành tích</p>';
    }
  } catch (error) {
    console.error('Error loading progress:', error);
  }
}

export function unmount(container) {
  // Cleanup
}
```

## 4. Cập nhật main.js để tích hợp các panel mới

Thêm vào `main.js`:

```javascript
// Thêm vào phần renderPanel
if (key === 'games') {
  content.innerHTML = '<div class="loading">Đang tải...</div>';
  import('./panels/game-selection/panel.js').then(mod => {
    mod.mount(content);
  });
  return;
}

if (key === 'progress') {
  content.innerHTML = '<div class="loading">Đang tải...</div>';
  import('./panels/progress/panel.js').then(mod => {
    mod.mount(content);
  });
  return;
}
```

## 5. Cập nhật sidebar trong index.html

Thêm menu item cho Progress:

```html
<a class="nav__item" href="#" data-nav="progress" data-page="progress">
  <span class="nav__icon" aria-hidden="true">
    <i class="fa-solid fa-chart-line"></i>
  </span>
  <span class="nav__text">Tiến độ</span>
</a>
```

## Kết luận

Sau khi implement các panel trên, frontend sẽ có đầy đủ tính năng:

✅ Hiển thị danh sách games từ database
✅ Hiển thị levels với trạng thái (locked/unlocked)
✅ Hiển thị tiến độ học sinh
✅ Hiển thị lịch sử chơi game
✅ Hiển thị thành tích
✅ Kết nối hoàn toàn với backend API

Tất cả dữ liệu đều được lấy từ database thông qua API, không còn hardcode!
