/**
 * Core Application Logic
 * Handles component loading, theme toggling, and global utilities.
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadComponents().then(() => {
    // Initialize Lucide icons after components are loaded
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    setupThemeToggle();
    highlightActiveSidebarItem();
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
    el.outerHTML = `<nav class="navbar glass"><a href="index.html" class="nav-brand"><span>SmartStudy</span></a><div class="nav-links"><a href="login.html" class="btn btn-ghost">Log In</a><a href="register.html" class="btn btn-primary">Get Started</a></div></nav>`;
  } else if (id === 'sidebar-placeholder') {
    el.outerHTML = `<aside class="sidebar"><div class="sidebar-header"><a href="dashboard.html" class="sidebar-brand">SmartStudy</a></div><div class="sidebar-menu"><a href="dashboard.html" class="sidebar-item active">Dashboard</a><a href="tasks.html" class="sidebar-item">Tasks</a></div></aside>`;
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
    if(darkIcon) darkIcon.style.display = 'none';
    if(lightIcon) lightIcon.style.display = 'block';
  } else {
    if(darkIcon) darkIcon.style.display = 'block';
    if(lightIcon) lightIcon.style.display = 'none';
  }

  toggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'dark') {
      if(darkIcon) darkIcon.style.display = 'none';
      if(lightIcon) lightIcon.style.display = 'block';
    } else {
      if(darkIcon) darkIcon.style.display = 'block';
      if(lightIcon) lightIcon.style.display = 'none';
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

// Simple Toast Notification System
window.showToast = function(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type} fade-in`;
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    padding: 12px 24px;
    background: ${type === 'success' ? 'var(--success)' : 'var(--danger)'};
    color: white;
    border-radius: var(--border-radius-sm);
    box-shadow: var(--shadow-lg);
    z-index: 1000;
    font-weight: 500;
  `;
  toast.innerText = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};
