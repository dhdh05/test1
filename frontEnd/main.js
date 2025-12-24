(function () {
  const sidebar = document.querySelector('[data-sidebar]');
  const backdrop = document.querySelector('[data-backdrop]');
  const toggleBtn = document.querySelector('[data-action="toggle-sidebar"]');
  const authBackdrop = document.querySelector('[data-auth-backdrop]');
  const authOpenBtn = document.querySelector('[data-action="open-auth"]');
  const authCloseBtn = document.querySelector('[data-auth-close]');
  const authForm = document.querySelector('[data-auth-form]');
  const authEmail = document.querySelector('[data-auth-email]');

  const AUTH_KEY = 'hm_is_authed';

  const locks = {
    sidebar: false,
    auth: false,
  };

  function isAuthed() {
    return localStorage.getItem(AUTH_KEY) === '1';
  }

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
    setTimeout(() => authEmail?.focus(), 0);
  }

  function closeAuth() {
    if (!authBackdrop) return;
    authBackdrop.hidden = true;
    locks.auth = false;
    syncScrollLock();
  }

  function toggleSidebar() {
    if (!sidebar || !backdrop) return;
    const isOpen = sidebar.classList.contains('is-open');
    if (isOpen) closeSidebar();
    else openSidebar();
  }

  toggleBtn?.addEventListener('click', () => {
    if (!isMobileLayout()) return;
    toggleSidebar();
  });

  backdrop?.addEventListener('click', closeSidebar);

  authOpenBtn?.addEventListener('click', () => {
    openAuth();
  });

  authCloseBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    closeAuth();
  });

  document.addEventListener('click', (e) => {
    const el = e.target;
    if (!(el instanceof HTMLElement)) return;

    const closeEl = el.closest('[data-auth-close]');
    if (closeEl) {
      e.preventDefault();
      closeAuth();
    }
  });

  authBackdrop?.addEventListener('click', (e) => {
    if (e.target === authBackdrop) closeAuth();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (locks.auth) closeAuth();
    else closeSidebar();
  });

  window.addEventListener('resize', () => {
    if (!isMobileLayout()) {
      if (backdrop) backdrop.hidden = true;
      if (sidebar) sidebar.classList.remove('is-open');
      locks.sidebar = false;
      syncScrollLock();
    }
  });

  // dropdown behavior
  const dropdownBtns = document.querySelectorAll('[data-dropdown]');
  dropdownBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-dropdown');
      if (!key) return;

      const panel = document.querySelector(`[data-submenu="${key}"]`);
      const expanded = btn.getAttribute('aria-expanded') === 'true';

      btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      panel?.classList.toggle('is-open', !expanded);

      const chev = btn.querySelector('.nav__chev');
      if (chev) {
        chev.style.transform = expanded ? 'rotate(0deg)' : 'rotate(180deg)';
      }
    });
  });

  // active state for top-level items
  const navItems = document.querySelectorAll('[data-nav]');
  navItems.forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();

      const key = a.getAttribute('data-nav');
      if (key === 'users' && !isAuthed()) {
        openAuth();
        return;
      }

      navItems.forEach((x) => x.classList.remove('is-active'));
      a.classList.add('is-active');

      if (isMobileLayout()) closeSidebar();
    });
  });

  // close sidebar after clicking any link inside it (mobile)
  sidebar?.addEventListener('click', (e) => {
    const el = e.target;
    if (!(el instanceof HTMLElement)) return;

    const isLink = el.closest('a');
    if (isLink && isMobileLayout()) closeSidebar();
  });

  // Tab switching
  document.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('[data-auth-tab]');
    if (tabBtn) {
      const target = tabBtn.getAttribute('data-auth-tab');
      document.querySelectorAll('[data-auth-tab]').forEach(t => t.classList.remove('is-active'));
      document.querySelectorAll('[data-auth-form]').forEach(f => f.hidden = true);
      tabBtn.classList.add('is-active');
      const form = document.querySelector(`[data-auth-form="${target}"]`);
      if (form) {
        form.hidden = false;
        const firstInput = form.querySelector('input');
        if (firstInput) firstInput.focus();
      }
    }

    const switchBtn = e.target.closest('[data-switch-to]');
    if (switchBtn) {
      const target = switchBtn.getAttribute('data-switch-to');
      document.querySelectorAll('[data-auth-tab]').forEach(t => t.classList.remove('is-active'));
      document.querySelectorAll('[data-auth-form]').forEach(f => f.hidden = true);
      const tab = document.querySelector(`[data-auth-tab="${target}"]`);
      const form = document.querySelector(`[data-auth-form="${target}"]`);
      if (tab) tab.classList.add('is-active');
      if (form) {
        form.hidden = false;
        const firstInput = form.querySelector('input');
        if (firstInput) firstInput.focus();
      }
    }
  });

  // Handle both forms
  document.querySelectorAll('[data-auth-form]').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const isLogin = form.getAttribute('data-auth-form') === 'login';
      const username = form.username?.value;
      const password = form.password?.value;
      const fullName = form.full_name?.value;
      const passwordConfirm = form.password_confirm?.value;

      // Validation
      if (!username || !password) {
        alert('Vui lòng nhập username và password');
        return;
      }

      if (!isLogin) {
        if (!fullName) {
          alert('Vui lòng nhập họ tên');
          return;
        }
        if (password !== passwordConfirm) {
          alert('Mật khẩu không khớp');
          return;
        }
      }

      try {
        const url = isLogin
          ? 'http://localhost:5000/api/auth/login'
          : 'http://localhost:5000/api/auth/register';

        const body = isLogin
          ? { username, password }
          : { username, password, full_name: fullName };

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const data = await response.json();

        if (response.ok) {
          localStorage.setItem(AUTH_KEY, data.token);
          localStorage.setItem('STUDENT_ID', data.user?.id || data.studentId);
          localStorage.setItem('USER_NAME', data.user?.name || data.user?.full_name || username);
          closeAuth();
          alert(`${isLogin ? '✅ Đăng nhập' : '✅ Đăng ký'} thành công! Xin chào ${data.user?.name || data.user?.full_name || username} 👋`);

          // Reset form
          form.reset();

          setTimeout(() => location.reload(), 500);
        } else {
          alert(`❌ Lỗi: ${data.message || 'Thao tác thất bại'}`);
        }
      } catch (error) {
        console.error('Auth error:', error);
        alert(`❌ Lỗi kết nối: ${error.message}`);
      }
    });
  });

  // preserve initial main content so we can restore it when clicking 'home'
  const contentElement = document.querySelector('.content');
  const initialContentHTML = contentElement ? contentElement.innerHTML : '';

  // bind interactions that live inside the main content area (re-run after restoring)
  function initDynamicBindings() {
    const features = document.querySelectorAll('[data-feature]');
    features.forEach((f) => {
      // remove previous handler to avoid duplicate alerts when re-binding
      f.replaceWith(f.cloneNode(true));
    });

    // re-query and bind features
    document.querySelectorAll('[data-feature]').forEach((f) => {
      f.addEventListener('click', (e) => {
        e.preventDefault();
        const name = f.getAttribute('data-feature');
        if (!name) return;
        alert(`Bạn vừa chọn: ${name}. (Demo UI — sẽ nối trang thật sau)`);
      });
    });
  }

  // initial bind
  initDynamicBindings();

  // Simple page render when clicking nav items or subitems
  function renderPanel(key, title) {
    const content = document.querySelector('.content');
    if (!content) return;

    // cleanup any active panel-specific listeners, timers, or mounted modules
    if (content._digitsKeydownHandler) {
      document.removeEventListener('keydown', content._digitsKeydownHandler);
      delete content._digitsKeydownHandler;
    }
    if (content._ghepCleanup) {
      content._ghepCleanup();
      delete content._ghepCleanup;
    }
    if (content._mountedPanel && typeof content._mountedPanel.unmount === 'function') {
      try { content._mountedPanel.unmount(content); } catch (e) { console.warn('Error during panel unmount', e); }
      delete content._mountedPanel;
    }

    // restore original home content
    if (key === 'home') {
      content.innerHTML = initialContentHTML;
      initDynamicBindings();
      return;
    }

    if (key === 'digits-hoc-so') {
      content.innerHTML = '<div class="loading">Đang tải...</div>';
      import('./panels/hoc-so/panel.js').then(mod => {
        if (content._mountedPanel && typeof content._mountedPanel.unmount === 'function') {
          try { content._mountedPanel.unmount(content); } catch (e) { console.warn('Error during panel unmount', e); }
          delete content._mountedPanel;
        }
        mod.mount(content);
        content._mountedPanel = mod;
      }).catch(err => {
        console.error('Failed to load hoc-so panel', err);
        content.innerHTML = '<div class="panel"><h2>Lỗi khi tải panel</h2></div>';
      });
      return;
    }


    if (key === 'digits-ghep-so') {
      content.innerHTML = '<div class="loading">Đang tải...</div>';
      import('./panels/ghep-so/panel.js').then(mod => {
        if (content._mountedPanel && typeof content._mountedPanel.unmount === 'function') {
          try { content._mountedPanel.unmount(content); } catch (e) { console.warn('Error during panel unmount', e); }
          delete content._mountedPanel;
        }
        mod.mount(content);
        content._mountedPanel = mod;
      }).catch(err => {
        console.error('Failed to load ghep-so panel', err);
        content.innerHTML = '<div class="panel"><h2>Lỗi khi tải panel</h2></div>';
      });
      return;
    }

    if (key === 'digits-chan-le') {
      content.innerHTML = '<div class="loading">Đang tải...</div>';
      import('./panels/chan-le/panel.js').then(mod => {
        if (content._mountedPanel && typeof content._mountedPanel.unmount === 'function') {
          try { content._mountedPanel.unmount(content); } catch (e) { console.warn('Error during panel unmount', e); }
          delete content._mountedPanel;
        }
        mod.mount(content);
        content._mountedPanel = mod;
      }).catch(err => {
        console.error('Failed to load chan-le panel', err);
        content.innerHTML = '<div class="panel"><h2>Lỗi khi tải panel</h2></div>';
      });
      return;
    }

    if (key === 'games') {
      content.innerHTML = '<div class="loading">Đang tải...</div>';
      import('./panels/game-selection/panel.js').then(mod => {
        if (content._mountedPanel && typeof content._mountedPanel.unmount === 'function') {
          try { content._mountedPanel.unmount(content); } catch (e) { console.warn('Error during panel unmount', e); }
          delete content._mountedPanel;
        }
        mod.mount(content);
        content._mountedPanel = mod;
      }).catch(err => {
        console.error('Failed to load game-selection panel', err);
        content.innerHTML = '<div class="panel"><h2>Lỗi khi tải panel</h2></div>';
      });
      return;
    }

    if (key === 'progress') {
      content.innerHTML = '<div class="loading">Đang tải...</div>';
      import('./panels/progress/panel.js').then(mod => {
        if (content._mountedPanel && typeof content._mountedPanel.unmount === 'function') {
          try { content._mountedPanel.unmount(content); } catch (e) { console.warn('Error during panel unmount', e); }
          delete content._mountedPanel;
        }
        mod.mount(content);
        content._mountedPanel = mod;
      }).catch(err => {
        console.error('Failed to load progress panel', err);
        content.innerHTML = '<div class="panel"><h2>Lỗi khi tải panel</h2></div>';
      });
      return;
    }

    if (key === 'leaderboard') {
      content.innerHTML = '<div class="loading">Đang tải...</div>';
      import('./panels/leaderboard/panel.js').then(mod => {
        if (content._mountedPanel && typeof content._mountedPanel.unmount === 'function') {
          try { content._mountedPanel.unmount(content); } catch (e) { console.warn('Error during panel unmount', e); }
          delete content._mountedPanel;
        }
        mod.mount(content);
        content._mountedPanel = mod;
      }).catch(err => {
        console.error('Failed to load leaderboard panel', err);
        content.innerHTML = '<div class="panel"><h2>Lỗi khi tải panel</h2></div>';
      });
      return;
    }

    // fallback simple panel
    content.innerHTML = `
      <div class="panel">
        <h2>${title}</h2>
        <p>Nội dung sẽ được cập nhật.</p>
      </div>
    `;
  }

  // initDigitsPanel moved to panels/hoc-so/panel.js (module)

  // initGhepSoGame is migrated to panels/ghep-so/panel.js (module)

  // Page title mapping for clearer panel headers
  const PAGE_TITLES = {
    'home': 'Trang chủ',
    'digits-hoc-so': 'Học chữ số — Học số',
    'digits-ghep-so': 'Học chữ số — Ghép số',
    'digits-chan-le': 'Học chữ số — Chẵn lẻ',
    'digits-dem-hinh': 'Học chữ số — Đếm hình',
    'compare-so-sanh': 'Phép so sánh — So sánh số',
    'compare-xep-so': 'Phép so sánh — Xếp số',
    'practice-tinh-toan': 'Luyện tập — Tính toán',
    'practice-so-sanh': 'Luyện tập — So sánh',
    'games': 'Trò chơi',
    'progress': 'Tiến độ',
    'leaderboard': 'Bảng xếp hạng',
    'users': 'Người dùng',
    'digits': 'Học chữ số',
    'compare': 'Phép so sánh',
    'practice': 'Luyện tập'
  };

  // Click handler for any element that carries data-page.
  // If the clicked element is a dropdown toggle (has class nav__item--btn or attribute data-dropdown)
  // we DO NOT navigate — only when clicking a subitem or a top-level item without submenu.
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-page]');
    if (!el) return;

    // If this element is a dropdown toggle / nav button with submenu, ignore here
    if (el.classList.contains('nav__item--btn') || el.hasAttribute('data-dropdown')) {
      return;
    }

    e.preventDefault();

    const key = el.getAttribute('data-page');
    const rawText = (el.textContent || key || '').trim();
    const title = PAGE_TITLES[key] || rawText || key;

    // update active state: mark the closest top-level nav__item as active
    document.querySelectorAll('.nav__item').forEach(n => n.classList.remove('is-active'));
    const parentItem = el.closest('.nav__item');
    if (parentItem) parentItem.classList.add('is-active');

    // close sidebar on mobile
    if (isMobileLayout()) closeSidebar();

    // render panel with clear title
    renderPanel(key, title);
  });
})();
