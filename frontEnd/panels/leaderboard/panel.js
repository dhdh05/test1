const API_URL = 'http://localhost:5000';

export async function mount(container) {
    const token = localStorage.getItem('hm_is_authed');
    const studentId = localStorage.getItem('STUDENT_ID');

    container.innerHTML = `
    <div class="leaderboard-panel">
      <h1>🏆 Bảng Xếp Hạng</h1>
      
      <div class="leaderboard-tabs">
        <button class="tab-btn active" data-tab="overall" onclick="window.switchLeaderboardTab('overall')">
          Tổng thể
        </button>
        <button class="tab-btn" data-tab="weekly" onclick="window.switchLeaderboardTab('weekly')">
          Tuần này
        </button>
        <button class="tab-btn" data-tab="monthly" onclick="window.switchLeaderboardTab('monthly')">
          Tháng này
        </button>
      </div>
      
      <div class="leaderboard-content" id="leaderboardContent">
        <div class="loading">Đang tải bảng xếp hạng...</div>
      </div>
    </div>
  `;

    await loadLeaderboard('overall', studentId, token);
}

async function loadLeaderboard(period, studentId, token) {
    const content = document.getElementById('leaderboardContent');

    try {
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const response = await fetch(`${API_URL}/api/games/leaderboard?period=${period}`, { headers });
        const data = await response.json();

        if (data.success && data.data) {
            const leaderboard = data.data;
            let html = '<div class="leaderboard-list">';

            leaderboard.forEach((entry, index) => {
                const rank = index + 1;
                const isCurrentUser = studentId && entry.student_id === parseInt(studentId);
                const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';

                html += `
          <div class="leaderboard-item ${isCurrentUser ? 'current-user' : ''} ${rank <= 3 ? 'top-three' : ''}">
            <div class="rank">
              ${medal || `#${rank}`}
            </div>
            <div class="player-info">
              <div class="player-name">
                ${entry.full_name || entry.username || 'Unknown'}
                ${isCurrentUser ? '<span class="you-badge">Bạn</span>' : ''}
              </div>
              <div class="player-stats">
                <span>⭐ ${entry.total_stars || 0} sao</span>
                <span>🎮 ${entry.total_games || 0} games</span>
              </div>
            </div>
            <div class="score">
              ${entry.total_score || 0}
              <span class="score-label">điểm</span>
            </div>
          </div>
        `;
            });

            html += '</div>';

            // Show current user's position if not in top list
            if (studentId && token) {
                const userInList = leaderboard.find(e => e.student_id === parseInt(studentId));
                if (!userInList) {
                    try {
                        const userRankResponse = await fetch(
                            `${API_URL}/api/games/leaderboard/rank/${studentId}?period=${period}`,
                            { headers }
                        );
                        const userRankData = await userRankResponse.json();

                        if (userRankData.success && userRankData.data) {
                            const userRank = userRankData.data;
                            html += `
                <div class="user-position">
                  <h3>Vị trí của bạn</h3>
                  <div class="leaderboard-item current-user">
                    <div class="rank">#${userRank.rank}</div>
                    <div class="player-info">
                      <div class="player-name">
                        ${userRank.full_name || userRank.username}
                        <span class="you-badge">Bạn</span>
                      </div>
                      <div class="player-stats">
                        <span>⭐ ${userRank.total_stars || 0} sao</span>
                        <span>🎮 ${userRank.total_games || 0} games</span>
                      </div>
                    </div>
                    <div class="score">
                      ${userRank.total_score || 0}
                      <span class="score-label">điểm</span>
                    </div>
                  </div>
                </div>
              `;
                        }
                    } catch (error) {
                        console.log('Could not load user rank');
                    }
                }
            }

            content.innerHTML = html;
        } else {
            content.innerHTML = '<p class="empty-state">Chưa có dữ liệu bảng xếp hạng</p>';
        }
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        content.innerHTML = '<p class="error-state">Lỗi khi tải bảng xếp hạng</p>';
    }
}

window.switchLeaderboardTab = function (period) {
    const studentId = localStorage.getItem('STUDENT_ID');
    const token = localStorage.getItem('hm_is_authed');

    // Update active tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${period}"]`).classList.add('active');

    // Load leaderboard for selected period
    loadLeaderboard(period, studentId, token);
};

export function unmount(container) {
    // Cleanup
    delete window.switchLeaderboardTab;
}
