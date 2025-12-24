const API_URL = 'http://localhost:5000';

export async function mount(container) {
    const token = localStorage.getItem('hm_is_authed');
    const studentId = localStorage.getItem('STUDENT_ID');

    if (!token || !studentId) {
        container.innerHTML = `
      <div class="panel">
        <h2>⚠️ Vui lòng đăng nhập</h2>
        <p>Bạn cần đăng nhập để xem tiến độ.</p>
      </div>
    `;
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
          <div class="stat-icon">🎮</div>
          <div class="stat-value">${stats.total_games || 0}</div>
          <div class="stat-label">Games đã chơi</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🎯</div>
          <div class="stat-value">${stats.total_results || 0}</div>
          <div class="stat-label">Lượt chơi</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⭐</div>
          <div class="stat-value">${stats.total_stars || 0}</div>
          <div class="stat-label">Tổng sao</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🏆</div>
          <div class="stat-value">${stats.total_achievements || 0}</div>
          <div class="stat-label">Thành tích</div>
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
                const gameIcons = {
                    'hoc-so': '🔢',
                    'ghep-so': '🧩',
                    'chan-le': '⚖️',
                    'so-sanh': '⚡',
                    'xep-so': '📊'
                };
                const icon = gameIcons[game.game_type] || '🎮';

                html += `
          <div class="progress-card">
            <div class="progress-icon">${icon}</div>
            <h3>${game.game_type}</h3>
            <div class="progress-stats">
              <div class="progress-stat">
                <span class="label">Level hiện tại:</span>
                <span class="value">${game.current_level}</span>
              </div>
              <div class="progress-stat">
                <span class="label">Level cao nhất:</span>
                <span class="value">${game.highest_level_passed}</span>
              </div>
              <div class="progress-stat">
                <span class="label">⭐ Sao:</span>
                <span class="value">${game.total_stars}</span>
              </div>
              <div class="progress-stat">
                <span class="label">🎯 Lượt chơi:</span>
                <span class="value">${game.total_attempts}</span>
              </div>
            </div>
          </div>
        `;
            });
            document.getElementById('progressGrid').innerHTML = html || '<p class="empty-state">Chưa có tiến độ. Hãy bắt đầu chơi game!</p>';
        }

        // Load recent results
        const resultsResponse = await fetch(`${API_URL}/api/games/results/${studentId}?limit=10`, { headers });
        const resultsData = await resultsResponse.json();

        if (resultsData.success) {
            const results = resultsData.data;
            let html = '';
            results.forEach(result => {
                const date = new Date(result.completed_at);
                const formattedDate = date.toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                html += `
          <div class="history-item">
            <div class="history-game">
              <strong>${result.game_type}</strong>
              <span class="history-level">Level ${result.level_number || 'N/A'}</span>
            </div>
            <div class="history-score">
              <span class="score-value">${result.score}%</span>
              <div class="history-stars">${'⭐'.repeat(result.stars || 0)}</div>
            </div>
            <div class="history-time">${formattedDate}</div>
          </div>
        `;
            });
            document.getElementById('historyList').innerHTML = html || '<p class="empty-state">Chưa có lịch sử chơi.</p>';
        }

        // Load achievements
        const achievementsResponse = await fetch(`${API_URL}/api/games/achievements/${studentId}`, { headers });
        const achievementsData = await achievementsResponse.json();

        if (achievementsData.success) {
            const achievements = achievementsData.data;
            let html = '';
            achievements.forEach(achievement => {
                const date = new Date(achievement.earned_at);
                const formattedDate = date.toLocaleDateString('vi-VN');

                html += `
          <div class="achievement-card">
            <div class="achievement-icon">🏆</div>
            <h4>${achievement.title}</h4>
            <p>${achievement.description}</p>
            <small>${formattedDate}</small>
          </div>
        `;
            });
            document.getElementById('achievementsGrid').innerHTML = html || '<p class="empty-state">Chưa có thành tích. Hãy cố gắng hoàn thành các thử thách!</p>';
        }
    } catch (error) {
        console.error('Error loading progress:', error);
        document.getElementById('statsGrid').innerHTML = '<p class="error-state">Lỗi khi tải thống kê</p>';
        document.getElementById('progressGrid').innerHTML = '<p class="error-state">Lỗi khi tải tiến độ</p>';
        document.getElementById('historyList').innerHTML = '<p class="error-state">Lỗi khi tải lịch sử</p>';
        document.getElementById('achievementsGrid').innerHTML = '<p class="error-state">Lỗi khi tải thành tích</p>';
    }
}

export function unmount(container) {
    // Cleanup
}
