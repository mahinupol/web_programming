import { db } from "./firebase.js";
import { requireAuth } from "./auth-state.js";
import {
  collection,
  onSnapshot,
  orderBy,
  query
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
  const profile = await requireAuth();
  if (!profile) return;

  const greetingEl = document.getElementById('user-greeting');
  if (greetingEl && profile.name) {
    greetingEl.innerText = `Welcome back, ${profile.name.split(' ')[0]}!`;
  }

  subscribeTasks(profile.uid);
});

function subscribeTasks(uid) {
  const tasksRef = collection(db, 'users', uid, 'tasks');
  const tasksQuery = query(tasksRef, orderBy('createdAt', 'desc'));

  onSnapshot(tasksQuery, (snapshot) => {
    const tasks = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    renderRecentTasks(tasks);
    renderStats(tasks);
    renderUpcoming(tasks);
  });
}

function renderRecentTasks(tasks) {
  const taskList = document.getElementById('recent-tasks');
  if (!taskList) return;

  taskList.innerHTML = '';

  const recent = tasks.slice(0, 5);
  if (recent.length === 0) {
    taskList.innerHTML = '<p style="color: var(--text-tertiary);">No tasks yet.</p>';
    return;
  }

  recent.forEach((task) => {
    const taskEl = document.createElement('div');
    taskEl.className = 'task-item';

    const subjectColor = getSubjectColor(task.subject);
    const isDone = task.status === 'done';
    const dueLabel = task.dueDate ? formatDate(task.dueDate) : 'No due date';

    taskEl.innerHTML = `
      <div class="task-info">
        <div class="task-checkbox ${isDone ? 'checked' : ''}"></div>
        <div>
          <div class="task-name" style="${isDone ? 'text-decoration: line-through; color: var(--text-tertiary);' : ''}">${escapeHtml(task.title || 'Untitled Task')}</div>
          <div class="task-meta">
            <span class="task-subject" style="color: ${subjectColor}">${escapeHtml(task.subject || 'General')}</span>
            <span><i data-lucide="clock" style="width: 12px; height: 12px; margin-right: 2px; vertical-align: -2px;"></i> ${dueLabel}</span>
          </div>
        </div>
      </div>
      <button class="icon-btn" style="border: none; background: transparent; width: 32px; height: 32px;"><i data-lucide="more-vertical"></i></button>
    `;
    taskList.appendChild(taskEl);
  });

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function renderStats(tasks) {
  const todayStr = toDateString(new Date());
  const dueToday = tasks.filter((task) => task.dueDate === todayStr && task.status !== 'done');
  const completed = tasks.filter((task) => task.status === 'done');
  const overdue = tasks.filter((task) => task.dueDate && task.dueDate < todayStr && task.status !== 'done');

  const totalHours = completed.reduce((sum, task) => sum + (Number(task.durationHours) || 0), 0);
  const streak = calculateStreak(completed);

  setText('tasks-due-today', String(dueToday.length));
  setText('stat-completed', String(completed.length));
  setText('stat-hours', totalHours.toFixed(1));
  setText('stat-streak', String(streak));
  setText('stat-overdue', String(overdue.length));
}

function renderUpcoming(tasks) {
  const container = document.getElementById('upcoming-deadlines');
  if (!container) return;

  const todayStr = toDateString(new Date());
  const upcoming = tasks
    .filter((task) => task.dueDate && task.dueDate >= todayStr && task.status !== 'done')
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
    .slice(0, 3);

  if (upcoming.length === 0) {
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.innerHTML = `
      <div style="width: 80px; height: 80px; border-radius: 50%; background: var(--bg-secondary); display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
        <i data-lucide="calendar" style="width: 32px; height: 32px; opacity: 0.5;"></i>
      </div>
      <p>No upcoming deadlines.</p>
    `;
  } else {
    container.style.alignItems = 'stretch';
    container.style.justifyContent = 'flex-start';
    container.innerHTML = upcoming.map((task) => {
      const dueLabel = formatDate(task.dueDate);
      return `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); margin-bottom: 0.75rem;">
          <div>
            <div style="font-weight: 600;">${escapeHtml(task.title || 'Untitled Task')}</div>
            <div style="font-size: 0.875rem; color: var(--text-tertiary);">${escapeHtml(task.subject || 'General')}</div>
          </div>
          <div style="font-size: 0.875rem; color: var(--text-secondary);">${dueLabel}</div>
        </div>
      `;
    }).join('');
  }

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function calculateStreak(completedTasks) {
  const completedDates = new Set(
    completedTasks
      .map((task) => toDate(task.completedAt))
      .filter(Boolean)
      .map((date) => toDateString(date))
  );

  if (completedDates.size === 0) return 0;

  let streak = 0;
  const cursor = new Date();

  while (completedDates.has(toDateString(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function toDate(value) {
  if (!value) return null;
  if (typeof value === 'string') return new Date(value);
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  return null;
}

function toDateString(date) {
  return date.toISOString().slice(0, 10);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getSubjectColor(subject) {
  if (!subject) return '#5e6ad2';
  const seed = subject.toLowerCase();
  if (seed.includes('math')) return '#10b981';
  if (seed.includes('physics')) return '#f59e0b';
  if (seed.includes('english')) return '#ef4444';
  return '#5e6ad2';
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}
