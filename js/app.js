/**
 * Core Application Logic
 * Handles component loading, theme toggling, mobile sidebar, search, and global utilities.
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadComponents().then(() => {
    // Initialize Lucide icons after components are loaded
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    updateUserNav();
    setupThemeToggle();
    highlightActiveSidebarItem();
    setupMobileSidebarToggle();
    setupSidebarUserInfo();
    setupSearchBar();
  });
});

/**
 * Loads external HTML components into placeholders
 */
async function loadComponents() {
  const components = [
    { id: 'navbar-placeholder', file: 'components/navbar.html' },
    { id: 'sidebar-placeholder', file: 'components/sidebar.html' },
    { id: 'footer-placeholder', file: 'components/footer.html' }
  ];

  for (const component of components) {
    const el = document.getElementById(component.id);
    if (el) {
      try {
        const response = await fetch(component.file);
        if (response.ok) {
          const html = await response.text();
          el.outerHTML = html;
        } else {
          console.warn(`Failed to load ${component.file}. (Note: file:// protocol may block fetch. Use a local server.)`);
          fallbackComponentInjection(component.id);
        }
      } catch (error) {
        console.error(`Error loading ${component.file}:`, error);
        fallbackComponentInjection(component.id);
      }
    }
  }
}

/**
 * Fallback injection if fetch fails (e.g., opened via file://)
 */
function fallbackComponentInjection(id) {
  const el = document.getElementById(id);
  if (!el) return;

  if (id === 'navbar-placeholder') {
    el.outerHTML = `<nav class="navbar glass"><a href="index.html" class="nav-brand"><span>SmartStudy</span></a><div class="nav-links"><span id="nav-user" style="display:none;">Hi, <span id="nav-user-name">Student</span></span><span id="nav-auth"><a href="login.html" class="btn btn-ghost">Log In</a><a href="register.html" class="btn btn-primary">Get Started</a></span></div></nav>`;
  } else if (id === 'sidebar-placeholder') {
    el.outerHTML = `<aside class="sidebar"><div class="sidebar-header"><a href="dashboard.html" class="sidebar-brand">SmartStudy</a></div><div class="sidebar-menu"><a href="dashboard.html" class="sidebar-item" data-page="dashboard">Dashboard</a><a href="tasks.html" class="sidebar-item" data-page="tasks">Tasks</a></div></aside>`;
  }
}

/**
 * Theme Management
 */
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

function setupThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle');
  if (!toggleBtn) return;

  const darkIcon = toggleBtn.querySelector('.dark-icon');
  const lightIcon = toggleBtn.querySelector('.light-icon');

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    if (darkIcon) darkIcon.style.display = 'none';
    if (lightIcon) lightIcon.style.display = 'block';
  } else {
    if (darkIcon) darkIcon.style.display = 'block';
    if (lightIcon) lightIcon.style.display = 'none';
  }

  toggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    if (newTheme === 'dark') {
      if (darkIcon) darkIcon.style.display = 'none';
      if (lightIcon) lightIcon.style.display = 'block';
    } else {
      if (darkIcon) darkIcon.style.display = 'block';
      if (lightIcon) lightIcon.style.display = 'none';
    }

    // Dispatch event for charts to listen and update colors
    window.dispatchEvent(new Event('themeChanged'));
  });
}

function highlightActiveSidebarItem() {
  const path = window.location.pathname;
  const page = path.split('/').pop().split('.')[0] || 'dashboard';

  const items = document.querySelectorAll('.sidebar-item');
  items.forEach(item => {
    if (item.dataset.page === page) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

function updateUserNav() {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const userEl = document.getElementById('nav-user');
  const userNameEl = document.getElementById('nav-user-name');
  const authEl = document.getElementById('nav-auth');
  const userMobileEl = document.getElementById('nav-user-mobile');
  const userNameMobileEl = document.getElementById('nav-user-name-mobile');
  const authMobileEls = document.querySelectorAll('.nav-auth-mobile');

  if (user && user.name) {
    if (userEl) userEl.style.display = 'inline-flex';
    if (userNameEl) userNameEl.textContent = user.name.split(' ')[0];
    if (authEl) authEl.style.display = 'none';
    if (userMobileEl) userMobileEl.style.display = 'block';
    if (userNameMobileEl) userNameMobileEl.textContent = user.name.split(' ')[0];
    authMobileEls.forEach((el) => {
      el.style.display = 'none';
    });
    return;
  }

  if (userEl) userEl.style.display = 'none';
  if (authEl) authEl.style.display = 'flex';
  if (userMobileEl) userMobileEl.style.display = 'none';
  authMobileEls.forEach((el) => {
    el.style.display = 'block';
  });
}

/**
 * Mobile Sidebar Toggle for dashboard pages
 */
function setupMobileSidebarToggle() {
  const menuToggle = document.getElementById('mobile-menu-toggle');
  const sidebar = document.querySelector('.sidebar');

  // Create overlay backdrop
  let overlay = document.getElementById('sidebar-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'sidebar-overlay';
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);
  }

  function openSidebar() {
    if (sidebar) sidebar.classList.add('open');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (menuToggle) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (sidebar && sidebar.classList.contains('open')) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });
  }

  // Close sidebar when clicking overlay
  overlay.addEventListener('click', closeSidebar);

  // Close sidebar when pressing Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar && sidebar.classList.contains('open')) {
      closeSidebar();
    }
  });
}

/**
 * Populate sidebar footer with user info from localStorage
 */
function setupSidebarUserInfo() {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  if (!user) return;

  const userNameEl = document.querySelector('.sidebar .user-name');
  const userEmailEl = document.querySelector('.sidebar .user-email');
  const avatarEl = document.querySelector('.sidebar .user-profile-mini .avatar');

  if (userNameEl) userNameEl.textContent = user.name || 'Student';
  if (userEmailEl) userEmailEl.textContent = user.email || 'View Profile';
  if (avatarEl && user.name) {
    avatarEl.textContent = user.name.charAt(0).toUpperCase();
  }
}

/**
 * Search bar live-filter for task lists on dashboard
 */
function setupSearchBar() {
  const searchInput = document.querySelector('.search-bar input');
  if (!searchInput) return;

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase().trim();

    // Filter task items in dashboard recent task list
    const taskItems = document.querySelectorAll('.task-item, .task-card');
    taskItems.forEach(item => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(query) || query === '' ? '' : 'none';
    });
  });

  // Allow pressing Escape to clear search
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input'));
    }
  });
}

// Simple Toast Notification System
window.showToast = function(message, type = 'success') {
  // Remove any existing toasts
  document.querySelectorAll('.toast-notification').forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = 'toast-notification';

  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  const bg = type === 'success'
    ? 'linear-gradient(135deg, #10b981, #34d399)'
    : type === 'error'
      ? 'linear-gradient(135deg, #ef4444, #f87171)'
      : 'linear-gradient(135deg, #f59e0b, #fbbf24)';

  toast.style.cssText = `
    position: fixed;
    bottom: 28px;
    right: 28px;
    padding: 14px 24px 14px 18px;
    background: ${bg};
    color: white;
    border-radius: 12px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.18);
    z-index: 9999;
    font-weight: 600;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    gap: 10px;
    animation: toastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    max-width: 360px;
    word-break: break-word;
  `;

  const styleId = 'toast-style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes toastSlideIn {
        from { opacity: 0; transform: translateY(20px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes toastSlideOut {
        from { opacity: 1; transform: translateY(0) scale(1); }
        to { opacity: 0; transform: translateY(20px) scale(0.95); }
      }
    `;
    document.head.appendChild(style);
  }

  toast.innerHTML = `<span style="font-size:1.1em;">${icon}</span><span>${message}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastSlideOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
};

/**
 * Logout handler — called from sidebar
 */
window.doLogout = async function() {
  try {
    // Dynamically import Firebase auth to sign out
    const { auth } = await import('./firebase.js');
    const { signOut } = await import('https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js');
    await signOut(auth);
  } catch (e) {
    // Ignore if Firebase not available
  }
  localStorage.removeItem('user');
  showToast('Logged out successfully');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 800);
};
