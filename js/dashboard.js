document.addEventListener('DOMContentLoaded', () => {
  // Mock data for dashboard
  const userStr = localStorage.getItem('user');
  if (userStr) {
    const user = JSON.parse(userStr);
    const greetingEl = document.getElementById('user-greeting');
    if (greetingEl) {
      greetingEl.innerText = `Welcome back, ${user.name.split(' ')[0]}!`;
    }
  }

  // Mobile sidebar toggle
  setupMobileSidebar();
  
  // Render mock tasks
  renderRecentTasks();
});

function setupMobileSidebar() {
  const menuToggle = document.getElementById('mobile-menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }
}

function renderRecentTasks() {
  const taskList = document.getElementById('recent-tasks');
  if (!taskList) return;

  const tasks = [
    { id: 1, title: 'Read Chapter 4: Data Structures', subject: 'Computer Science', date: 'Today, 14:00', completed: false, color: '#5e6ad2' },
    { id: 2, title: 'Write Literature Review', subject: 'English', date: 'Tomorrow', completed: false, color: '#f59e0b' },
    { id: 3, title: 'Calculus Assignment 3', subject: 'Mathematics', date: 'Yesterday', completed: true, color: '#10b981' }
  ];

  taskList.innerHTML = '';

  tasks.forEach(task => {
    const taskEl = document.createElement('div');
    taskEl.className = 'task-item';
    taskEl.innerHTML = `
      <div class="task-info">
        <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="this.classList.toggle('checked')"></div>
        <div>
          <div class="task-name" style="${task.completed ? 'text-decoration: line-through; color: var(--text-tertiary);' : ''}">${task.title}</div>
          <div class="task-meta">
            <span class="task-subject" style="color: ${task.color}">${task.subject}</span>
            <span><i data-lucide="clock" style="width: 12px; height: 12px; margin-right: 2px; vertical-align: -2px;"></i> ${task.date}</span>
          </div>
        </div>
      </div>
      <button class="icon-btn" style="border: none; background: transparent; width: 32px; height: 32px;"><i data-lucide="more-vertical"></i></button>
    `;
    taskList.appendChild(taskEl);
  });
  
  // Re-init lucide icons for newly added elements
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}
