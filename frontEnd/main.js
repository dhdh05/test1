(function () {
  const sidebar = document.querySelector('[data-sidebar]');
  const backdrop = document.querySelector('[data-backdrop]');
  const toggleBtn = document.querySelector('[data-action="toggle-sidebar"]');
  const authBackdrop = document.querySelector('[data-auth-backdrop]');
  const authOpenBtn = document.querySelector('[data-action="open-auth"]');
  const authCloseBtn = document.querySelector('[data-auth-close]');
  
  const AUTH_KEY = 'hm_is_authed';

  const locks = { sidebar: false, auth: false };

  function syncScrollLock() {
    const shouldLock = Boolean(locks.sidebar || locks.auth);
    document.body.style.overflow = shouldLock ? 'hidden' : '';
  }

  function isMobileLayout() {
    return window.matchMedia('(max-width: 900px)').matches;
  }

  function openSidebar() {
    if (!sidebar || !backdrop) return;
    sidebar.classList.add('is-open');
    backdrop.hidden = false;
    locks.sidebar = true;
    syncScrollLock();
  }

  function closeSidebar() {
    if (!sidebar || !backdrop) return;
    sidebar.classList.remove('is-open');
    backdrop.hidden = true;
    locks.sidebar = false;
    syncScrollLock();
  }

  function openAuth() {
    if (!authBackdrop) return;
    authBackdrop.hidden = false;
    locks.auth = true;
    syncScrollLock();
  }

  function closeAuth() {
    if (!authBackdrop) return;
    authBackdrop.hidden = true;
    locks.auth = false;
    syncScrollLock();
  }

  toggleBtn?.addEventListener('click', () => {
    if (isMobileLayout()) {
      const isOpen = sidebar.classList.contains('is-open');
      if (isOpen) closeSidebar(); else openSidebar();
    } else {
      const app = document.querySelector('.app');
      if (app) app.classList.toggle('sidebar-collapsed');
    }
  });

  const hideBtn = document.querySelector('[data-action="hide-sidebar"]');
  hideBtn?.addEventListener('click', () => {
    const app = document.querySelector('.app');
    if (!app) return;
    app.classList.toggle('sidebar-hidden');
    // ... logic hide snow ...
  });

  backdrop?.addEventListener('click', closeSidebar);
  authOpenBtn?.addEventListener('click', openAuth);
  authCloseBtn?.addEventListener('click', (e) => { e.preventDefault(); closeAuth(); });
  authBackdrop?.addEventListener('click', (e) => { if (e.target === authBackdrop) closeAuth(); });

  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (locks.auth) closeAuth();
    else closeSidebar();
  });

  // Dropdown Logic
  const dropdownBtns = document.querySelectorAll('[data-dropdown]');
  dropdownBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-dropdown');
      if (!key) return;
      dropdownBtns.forEach((other) => {
        if (other === btn) return;
        const otherKey = other.getAttribute('data-dropdown');
        if (!otherKey) return;
        const otherPanel = document.querySelector(`[data-submenu="${otherKey}"]`);
        other.setAttribute('aria-expanded', 'false');
        otherPanel?.classList.remove('is-open');
        const otherChev = other.querySelector('.nav__chev');
        if (otherChev) otherChev.style.transform = 'rotate(0deg)';
      });
      const panel = document.querySelector(`[data-submenu="${key}"]`);
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      panel?.classList.toggle('is-open', !expanded);
      const chev = btn.querySelector('.nav__chev');
      if (chev) { chev.style.transform = expanded ? 'rotate(0deg)' : 'rotate(180deg)'; }
    });
  });

  // Tab switching inside Auth Modal
  document.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('[data-auth-tab]');
    if (tabBtn) {
      const target = tabBtn.getAttribute('data-auth-tab');
      document.querySelectorAll('[data-auth-tab]').forEach(t => t.classList.remove('is-active'));
      document.querySelectorAll('[data-auth-form]').forEach(f => f.hidden = true);
      tabBtn.classList.add('is-active');
      const form = document.querySelector(`[data-auth-form="${target}"]`);
      if (form) form.hidden = false;
    }
    const switchBtn = e.target.closest('[data-switch-to]');
    if (switchBtn) {
      const target = switchBtn.getAttribute('data-switch-to');
      document.querySelectorAll('[data-auth-tab]').forEach(t => t.classList.remove('is-active'));
      document.querySelectorAll('[data-auth-form]').forEach(f => f.hidden = true);
      const tab = document.querySelector(`[data-auth-tab="${target}"]`);
      const form = document.querySelector(`[data-auth-form="${target}"]`);
      if (tab) tab.classList.add('is-active');
      if (form) form.hidden = false;
    }
  });

  // --- LOGIN FORM SUBMIT ---
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      // LƯU Ý: Đổi port 3000 hoặc 3001 tùy vào server của bạn
      const API_URL = 'http://localhost:3000/api/auth/login';

      try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.success) {
            localStorage.setItem('user_info', JSON.stringify(data.user));
            alert('✅ Đăng nhập thành công!');
            closeAuth();
            window.location.reload();
        } else {
            alert('❌ ' + data.message);
        }
      } catch (err) { alert('Lỗi kết nối Server! Kiểm tra lại terminal xem server chạy port nào.'); }
    });
  }

  // --- HELPER ĐỂ LOAD PANEL ĐỘNG ---
  window.loadDynamicPanel = function(key) {
    const content = document.querySelector('.content');
    if (!content) return;
    
    let modulePath = '';
    if(key === 'digits-hoc-so') modulePath = './panels/hoc-chu-so/panel.js';
    else if(key === 'digits-ghep-so') modulePath = './panels/ghep-so/panel.js';
    else if(key === 'digits-chan-le') modulePath = './panels/chan-le/panel.js';
    else if(key === 'digits-dem-so') modulePath = './panels/dem-so/panel.js';
    else if(key === 'compare-so-sanh') modulePath = './panels/so-sanh/panel.js';
    else if(key === 'compare-xep-so') modulePath = './panels/xep-so/panel.js';
    else if(key === 'practice-tinh-toan') modulePath = './panels/practice-tinh-toan/panel.js';
    else if(key === 'practice-nhan-ngon') modulePath = './panels/practice-nhan-ngon/panel.js';
    else if(key === 'games-dino') modulePath = './panels/dino-math/panel.js';
    else if(key === 'games') modulePath = './panels/hung-tao/panel.js';

    if(modulePath) {
        content.innerHTML = '<div class="loading">Đang tải...</div>';
        import(modulePath).then(mod => {
            if (content._mountedPanel && typeof content._mountedPanel.unmount === 'function') {
                try { content._mountedPanel.unmount(content); } catch (e) {}
            }
            mod.mount(content);
            content._mountedPanel = mod;
        }).catch(err => {
            console.error(err);
            content.innerHTML = `<div class="panel"><h2>Lỗi tải panel</h2><p>${err}</p></div>`;
        });
    } else {
        content.innerHTML = `<div class="panel"><h2>Nội dung đang cập nhật</h2></div>`;
    }
  }

  // Auto-run user update
  document.addEventListener('DOMContentLoaded', updateSidebarUser);
})();

// ============================================================
// 🌟 CÁC HÀM TOÀN CỤC (Global Functions)
// Để HTML onclick gọi được, chúng bắt buộc phải nằm ở đây
// ============================================================

// 1. Cập nhật Sidebar User
function updateSidebarUser() {
    const userInfo = JSON.parse(localStorage.getItem('user_info'));
    const nameDisplay = document.getElementById('user-name-display');
    const roleDisplay = document.getElementById('user-role-display');
    if(!nameDisplay) return;

    if (userInfo) {
        nameDisplay.innerText = userInfo.name || userInfo.full_name || userInfo.username;
        roleDisplay.innerText = "Học sinh";
    } else {
        nameDisplay.innerText = "Khách";
        roleDisplay.innerText = "Nhấn để đăng nhập";
    }
}

// 2. Chuyển Tab (Menu Navigation)
// function switchTab(tabName) {
//     console.log("Chuyển tab:", tabName);
    
//     // Đổi active menu
//     document.querySelectorAll('.nav__item').forEach(el => el.classList.remove('is-active'));
//     // Active menu mới
//     const activeLink = document.querySelector(`.nav__item[onclick*="'${tabName}'"]`);
//     if (activeLink) activeLink.classList.add('is-active');

//     const mainContent = document.getElementById('main-content');
//     if (!mainContent) return;

//     // Logic hiển thị từng trang
//     if (tabName === 'home') {
//         window.location.reload(); // Reload để về trang chủ sạch sẽ
//     } 
//     else if (tabName === 'thong-ke') {
//         const userInfo = JSON.parse(localStorage.getItem('user_info'));
//         if(!userInfo) {
//             mainContent.innerHTML = '<div class="panel"><h1>Vui lòng đăng nhập để xem thống kê</h1></div>';
//             return;
//         }
//         mainContent.innerHTML = `
//             <div style="padding:20px;">
//                 <h1 style="color:#2575fc">📊 Thống kê của ${userInfo.name || userInfo.username}</h1>
//                 <p>Tính năng đang phát triển...</p>
//             </div>
//         `;
//     }
// }

// 3. Xử lý nút Login trên Sidebar
function handleLoginClick() {
    const userInfo = localStorage.getItem('user_info');
    if (userInfo) {
        switchTab('thong-ke');
    } else {
        const authBackdrop = document.querySelector('[data-auth-backdrop]');
        if (authBackdrop) {
            authBackdrop.hidden = false;
            // Focus vào input nếu có
            setTimeout(() => document.getElementById('username')?.focus(), 100);
        }
    }
}

// 4. Xử lý nút Phụ huynh
function handleParentAccess() {
    const userInfo = JSON.parse(localStorage.getItem('user_info'));
    if (!userInfo) {
        alert("Vui lòng đăng nhập tài khoản học sinh trước!");
        return;
    }
    document.getElementById('pin-modal').style.display = 'flex';
    document.getElementById('parent-pin-input').value = '';
    document.getElementById('parent-pin-input').focus();
}

// 5. Xác thực PIN
async function verifyParentPin() {
    const pin = document.getElementById('parent-pin-input').value;
    const userInfo = JSON.parse(localStorage.getItem('user_info'));
    
    // Đổi port nếu cần
    const API_VERIFY = 'http://localhost:3000/api/parents/verify-pin';

    try {
        const res = await fetch(API_VERIFY, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ student_id: userInfo.id, pin: pin })
        });
        const data = await res.json();
        
        if(data.success) {
             document.getElementById('pin-modal').style.display = 'none';
             renderParentDashboard(userInfo.id);
        } else {
             alert('Mã PIN không đúng!');
        }
    } catch(e) {
        // Fallback offline
        if(pin === '1234') {
            document.getElementById('pin-modal').style.display = 'none';
            renderParentDashboard(userInfo.id);
        } else {
            alert('Mã PIN không đúng!');
        }
    }
}

// 6. Hiển thị Dashboard Phụ huynh
async function renderParentDashboard(studentId) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '<div class="loading">Đang tải dữ liệu phụ huynh...</div>';
    
    try {
        const res = await fetch(`http://localhost:3000/api/parents/stats/${studentId}`);
        const json = await res.json();
        const stats = json.data || [];

        let html = `
        <div style="padding:20px;">
            <h1 style="color:#2575fc;">👨‍👩‍👧‍👦 Khu vực Phụ huynh</h1>
            <button onclick="window.location.reload()" style="margin-bottom:20px; padding:8px 15px; cursor:pointer;">⬅ Quay lại</button>
            
            <table style="width:100%; border-collapse:collapse; background:white; border-radius:10px; overflow:hidden; box-shadow:0 5px 15px rgba(0,0,0,0.1);">
                <thead style="background:#f0f2f5;">
                    <tr>
                        <th style="padding:15px; text-align:left;">Ngày</th>
                        <th style="padding:15px; text-align:left;">Bài học / Game</th>
                        <th style="padding:15px; text-align:left;">Thời gian</th>
                        <th style="padding:15px; text-align:left;">Điểm số</th>
                    </tr>
                </thead>
                <tbody>
        `;

        if(stats.length === 0) html += '<tr><td colspan="4" style="padding:20px; text-align:center;">Chưa có dữ liệu học tập.</td></tr>';
        else {
            stats.forEach(row => {
                html += `
                    <tr style="border-bottom:1px solid #eee;">
                        <td style="padding:15px;">${row.play_date}</td>
                        <td style="padding:15px; font-weight:bold; color:#2575fc;">${row.game_type}</td>
                        <td style="padding:15px;">${row.total_time} giây</td>
                        <td style="padding:15px;">${row.total_score}</td>
                    </tr>
                `;
            });
        }
        html += '</tbody></table></div>';
        mainContent.innerHTML = html;

    } catch(e) {
        mainContent.innerHTML = '<h2>Lỗi tải dữ liệu. Hãy đảm bảo Server đang chạy!</h2>';
    }
}

// 7. Xử lý click menu Game (Vì menu game dùng data-page)
document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-page]');
    if (!el) return;
    // Bỏ qua các nút dropdown (chỉ xử lý item con)
    if (el.classList.contains('nav__item--btn') || el.hasAttribute('data-dropdown')) return;
    
    e.preventDefault();
    const key = el.getAttribute('data-page');

    if(key === 'home' || key === 'thong-ke' || key === 'users') {
        // Đã xử lý ở hàm switchTab rồi
    } else {
        // Load game
        window.loadDynamicPanel(key);
        // Active menu
        document.querySelectorAll('.nav__subitem').forEach(s => s.classList.remove('is-active'));
        if (el.classList.contains('nav__subitem')) el.classList.add('is-active');
    }
});
// ... (Các code phía trên giữ nguyên) ...

// ============================================================
// 👇 CẬP NHẬT ĐOẠN NÀY Ở CUỐI FILE js/main.js
// ============================================================

// 1. Hàm Đăng xuất (MỚI)
window.logout = function() {
    if (confirm("Bạn có chắc muốn đăng xuất không?")) {
        localStorage.removeItem('user_info');
        localStorage.removeItem('hm_is_authed');
        alert("Đăng xuất thành công! Hẹn gặp lại bé nhé 👋");
        window.location.reload(); // Tải lại trang để về trạng thái chưa đăng nhập
    }
}

// 2. Hàm Chuyển Tab (Đã thêm nút Đăng xuất vào giao diện)
// Thay thế toàn bộ hàm window.switchTab cũ bằng đoạn này:
// Thay thế hàm switchTab cũ bằng hàm này:
window.switchTab = async function(tabName) {
    console.log("Chuyển tab:", tabName);
    
    // 1. Đổi màu menu active
    document.querySelectorAll('.nav__item').forEach(el => el.classList.remove('is-active'));
    const activeLink = document.querySelector(`.nav__item[onclick*="'${tabName}'"]`);
    if (activeLink) activeLink.classList.add('is-active');

    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    // 2. Logic hiển thị
    if (tabName === 'home') {
        window.location.reload(); 
    } 
    // 👇👇👇 PHẦN NÂNG CẤP: LẤY DỮ LIỆU THẬT 👇👇👇
    else if (tabName === 'thong-ke') {
        const userInfo = JSON.parse(localStorage.getItem('user_info'));
        
        // A. Chưa đăng nhập
        if(!userInfo) {
            mainContent.innerHTML = `
                <div style="padding: 40px; text-align: center; background: white; border-radius: 15px; margin: 20px;">
                    <h2 style="color: #333;">🔒 Bạn chưa đăng nhập</h2>
                    <button onclick="handleLoginClick()" style="padding:10px 25px; background:#2575fc; color:white; border:none; border-radius:25px; cursor:pointer;">Đăng nhập ngay</button>
                </div>`;
            return;
        }

        // B. Đã đăng nhập -> Hiện Header + Loading
        mainContent.innerHTML = `
            <div style="padding:20px; max-width: 900px; margin: 0 auto;">
                <div style="display:flex; align-items:center; gap:20px; background:white; padding:25px; border-radius:20px; box-shadow:0 10px 25px rgba(0,0,0,0.05); margin-bottom: 30px;">
                    <div style="width:70px; height:70px; background:#e3f2fd; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:30px; color:#2575fc;">
                        <i class="fas fa-user-astronaut"></i>
                    </div>
                    <div style="flex:1;">
                        <h2 style="margin:0; color:#2c3e50;">${userInfo.name || userInfo.username}</h2>
                        <span style="background: #e8f5e9; color: #2e7d32; padding: 2px 10px; border-radius: 10px; font-size: 0.85rem; font-weight: bold;">Học sinh</span>
                    </div>
                    <button onclick="logout()" style="background:#fff0f1; color:#ff4757; border:1px solid #ff4757; padding:10px 20px; border-radius:12px; cursor:pointer; font-weight:bold;">
                        <i class="fas fa-sign-out-alt"></i> Đăng xuất
                    </button>
                </div>

                <h3 style="color:#2575fc; margin-bottom:15px;"><i class="fas fa-chart-bar"></i> Lịch sử học tập</h3>
                <div id="stats-table-area">
                    <div class="loading">⏳ Đang tải bảng điểm từ Server...</div>
                </div>
            </div>
        `;

        // C. Gọi API lấy điểm thật
        try {
            // Dùng API parents/stats để lấy thống kê chi tiết
            const res = await fetch(`http://localhost:3000/api/parents/stats/${userInfo.id}`);
            const json = await res.json();
            
            const statsArea = document.getElementById('stats-table-area');
            
            if (json.success && json.data.length > 0) {
                let html = `
                    <table style="width:100%; border-collapse:collapse; background:white; border-radius:15px; overflow:hidden; box-shadow:0 5px 15px rgba(0,0,0,0.05);">
                        <thead style="background:#f8f9fa; color:#666;">
                            <tr>
                                <th style="padding:15px; text-align:left;">Ngày chơi</th>
                                <th style="padding:15px; text-align:left;">Trò chơi / Bài học</th>
                                <th style="padding:15px; text-align:center;">Thời gian</th>
                                <th style="padding:15px; text-align:center;">Điểm số</th>
                            </tr>
                        </thead>
                        <tbody>`;
                
                json.data.forEach(row => {
                    // Làm đẹp tên game
                    let gameName = row.game_type;
                    if(gameName === 'dino-math' || gameName === 'dino') gameName = '🦕 Khủng Long';
                    if(gameName === 'hung-tao') gameName = '🍎 Hứng Táo';

                    html += `
                        <tr style="border-bottom:1px solid #eee;">
                            <td style="padding:15px;">${row.play_date}</td>
                            <td style="padding:15px; font-weight:bold; color:#2575fc;">${gameName}</td>
                            <td style="padding:15px; text-align:center;">${row.total_time}s</td>
                            <td style="padding:15px; text-align:center; color:#e67e22; font-weight:bold;">${row.total_score}</td>
                        </tr>`;
                });
                
                html += `</tbody></table>`;
                statsArea.innerHTML = html;
            } else {
                statsArea.innerHTML = `
                    <div style="background:white; padding:40px; border-radius:15px; text-align:center; color:#888;">
                        <i class="fas fa-gamepad" style="font-size:40px; margin-bottom:15px; display:block; color:#ddd;"></i>
                        Bé chưa chơi game nào cả. Hãy thử chơi ngay nhé!
                    </div>`;
            }
        } catch (err) {
            console.error(err);
            document.getElementById('stats-table-area').innerHTML = 
                `<div style="color:red; text-align:center;">⚠️ Lỗi kết nối Server! (Đảm bảo backend đang chạy cổng 3000/3001)</div>`;
        }
    }
}

// GẮN HÀM VÀO WINDOW (Đảm bảo HTML gọi được)
window.switchTab = switchTab;
window.handleLoginClick = handleLoginClick;
window.handleParentAccess = handleParentAccess;
window.verifyParentPin = verifyParentPin;
window.updateSidebarUser = updateSidebarUser;
window.renderParentDashboard = renderParentDashboard;