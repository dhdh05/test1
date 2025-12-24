const API_URL = 'http://localhost:5000';

export async function mount(container, gameType) {
    const token = localStorage.getItem('hm_is_authed');
    const studentId = localStorage.getItem('STUDENT_ID');

    container.innerHTML = `
    <div class="game-levels-panel">
      <div class="levels-header">
        <button class="btn-back" onclick="window.goBackToGames()">← Quay lại</button>
        <h1>📚 Chọn Level - ${gameType}</h1>
      </div>
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
                    `<button class="btn-start" onclick="window.startLevel(${level.level_id}, '${gameType}')">
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

window.startLevel = function (levelId, gameType) {
    console.log('Starting level:', levelId, 'for game:', gameType);
    alert(`Sẽ bắt đầu level ${levelId} của game ${gameType}.\nTính năng này sẽ được kết nối với game thực tế.`);
    // TODO: Navigate to actual game play
};

window.goBackToGames = function () {
    const content = document.querySelector('.content');
    if (!content) return;

    content.innerHTML = '<div class="loading">Đang tải...</div>';
    import('../game-selection/panel.js').then(mod => {
        mod.mount(content);
    }).catch(err => {
        console.error('Failed to load game-selection panel', err);
    });
};

export function unmount(container) {
    // Cleanup
    delete window.startLevel;
    delete window.goBackToGames;
}
