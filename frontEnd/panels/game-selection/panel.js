const API_URL = 'http://localhost:5000';

export async function mount(container) {
    const token = localStorage.getItem('hm_is_authed');
    const studentId = localStorage.getItem('STUDENT_ID');

    if (!token || !studentId) {
        container.innerHTML = `
      <div class="panel">
        <h2>⚠️ Vui lòng đăng nhập</h2>
        <p>Bạn cần đăng nhập để xem danh sách game.</p>
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
            <button onclick="window.selectGame('${game.type}')" class="btn-play">
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

window.selectGame = function (gameType) {
    // Navigate to game levels page
    console.log('Selected game:', gameType);
    const content = document.querySelector('.content');
    if (!content) return;

    content.innerHTML = '<div class="loading">Đang tải levels...</div>';
    import('../game-levels/panel.js').then(mod => {
        mod.mount(content, gameType);
    }).catch(err => {
        console.error('Failed to load game-levels panel', err);
        content.innerHTML = '<div class="panel"><h2>Lỗi khi tải panel</h2></div>';
    });
};

export function unmount(container) {
    // Cleanup
    delete window.selectGame;
}
