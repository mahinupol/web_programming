import { db } from "./firebase.js";
import { requireAuth } from "./auth-state.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

let currentUid = null;
let taskLists = {};

document.addEventListener('DOMContentLoaded', async () => {
  const profile = await requireAuth();
  if (!profile) return;
  currentUid = profile.uid;

  taskLists = {
    todo: document.querySelector('[data-list="todo"]'),
    inProgress: document.querySelector('[data-list="inProgress"]'),
    done: document.querySelector('[data-list="done"]')
  };

  setupForm();
  subscribeTasks();
  setupSearch();
  setupModalBtn();
});

function setupForm() {
  const form = document.getElementById('task-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = getValue('task-title');
    const subject = getValue('task-subject');
    const description = getValue('task-description');
    const dueDate = getValue('task-due');
    const durationHours = parseFloat(getValue('task-duration')) || 0;
    const priority = getValue('task-priority') || 'medium';
    const status = getValue('task-status') || 'todo';

    if (!title) return;

    try {
      await addDoc(collection(db, 'users', currentUid, 'tasks'), {
        title,
        subject,
        description,
        dueDate: dueDate || null,
        durationHours,
        priority,
        status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        completedAt: status === 'done' ? serverTimestamp() : null
      });

      form.reset();
      closeModal('taskModal');
      if (typeof showToast === 'function') {
        showToast('Task saved successfully!');
      }
    } catch (error) {
      alert(error.message || 'Unable to save task.');
    }
  });

  const board = document.querySelector('.task-board');
  if (!board) return;

  board.addEventListener('change', async (e) => {
    if (!e.target.classList.contains('task-status')) return;
    const taskId = e.target.dataset.id;
    const newStatus = e.target.value;
    if (!taskId) return;

    const updates = {
      status: newStatus,
      updatedAt: serverTimestamp(),
      completedAt: newStatus === 'done' ? serverTimestamp() : null
    };

    try {
      await updateDoc(doc(db, 'users', currentUid, 'tasks', taskId), updates);
    } catch (error) {
      alert(error.message || 'Unable to update task.');
    }
  });

  board.addEventListener('click', async (e) => {
    const deleteBtn = e.target.closest('.task-delete');
    if (!deleteBtn) return;
    const taskId = deleteBtn.dataset.id;
    if (!taskId) return;

    if (!confirm('Delete this task?')) return;

    try {
      await deleteDoc(doc(db, 'users', currentUid, 'tasks', taskId));
      if (typeof showToast === 'function') {
        showToast('Task deleted.', 'error');
      }
    } catch (error) {
      alert(error.message || 'Unable to delete task.');
    }
  });
}

function subscribeTasks() {
  const tasksRef = collection(db, 'users', currentUid, 'tasks');
  const tasksQuery = query(tasksRef, orderBy('createdAt', 'desc'));

  onSnapshot(tasksQuery, (snapshot) => {
    const tasks = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    renderTasks(tasks);
  });
}

function renderTasks(tasks) {
  Object.values(taskLists).forEach((list) => {
    if (list) list.innerHTML = '';
  });

  const counts = { todo: 0, inProgress: 0, done: 0 };


  tasks.forEach((task) => {
    const status = task.status || 'todo';
    const list = taskLists[status] || taskLists.todo;
    if (!list) return;

    counts[status] = (counts[status] || 0) + 1;

    const card = document.createElement('div');
    card.className = 'task-card';
    if (status === 'done') {
      card.style.opacity = '0.7';
    }

    const subject = task.subject || 'General';
    const priority = (task.priority || 'medium').toLowerCase();
    const dueLabel = task.dueDate ? formatDate(task.dueDate) : 'No due date';
    const durationLabel = task.durationHours ? `${task.durationHours}h` : 'No time set';

    // Add a checkbox for marking complete
    card.innerHTML = `
      <div class="task-tags">
        ${renderPriorityBadge(priority)}
        <span class="badge" style="background: ${getSubjectBadgeBg(subject)}; color: ${getSubjectBadgeColor(subject)};">${escapeHtml(subject)}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <input type="checkbox" class="task-complete-checkbox" data-id="${task.id}" ${status === 'done' ? 'checked' : ''} style="accent-color: var(--accent-primary); width: 1.1em; height: 1.1em; cursor: pointer;">
        <div class="task-title" style="flex:1; ${status === 'done' ? 'text-decoration: line-through; color: var(--text-tertiary);' : ''}">${escapeHtml(task.title || 'Untitled Task')}</div>
      </div>
      ${task.description ? `<div class="task-desc">${escapeHtml(task.description)}</div>` : ''}
      <div class="task-footer">
        <span><i data-lucide="calendar" style="width: 12px; height: 12px; vertical-align: -2px;"></i> ${dueLabel}</span>
        <span><i data-lucide="clock" style="width: 12px; height: 12px; vertical-align: -2px;"></i> ${durationLabel}</span>
      </div>
      <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem; align-items: center;">
        <select class="form-control task-status" data-id="${task.id}" style="flex: 1;">
          <option value="todo" ${status === 'todo' ? 'selected' : ''}>To Do</option>
          <option value="inProgress" ${status === 'inProgress' ? 'selected' : ''}>In Progress</option>
          <option value="done" ${status === 'done' ? 'selected' : ''}>Completed</option>
        </select>
        <button class="icon-btn task-delete" data-id="${task.id}" title="Delete">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
    `;

    // Add event listener for the complete checkbox
    const checkbox = card.querySelector('.task-complete-checkbox');
    if (checkbox && status !== 'done') {
      checkbox.addEventListener('change', async (e) => {
        if (e.target.checked) {
          // Animate cross-out and fade out
          const titleDiv = card.querySelector('.task-title');
          if (titleDiv) {
            titleDiv.style.textDecoration = 'line-through';
            titleDiv.style.color = 'var(--text-tertiary)';
          }
          card.style.transition = 'opacity 0.5s';
          card.style.opacity = '0.3';
          setTimeout(async () => {
            // Mark as complete in Firestore
            try {
              await updateDoc(doc(db, 'users', currentUid, 'tasks', task.id), {
                status: 'done',
                updatedAt: serverTimestamp(),
                completedAt: serverTimestamp()
              });
            } catch (error) {
              alert(error.message || 'Unable to mark as complete.');
            }
          }, 350);
          // Remove from DOM after fade
          setTimeout(() => {
            card.remove();
          }, 600);
        }
      });
    }

    list.appendChild(card);
  });

  updateCounts(counts);

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function updateCounts(counts) {
  Object.keys(counts).forEach((status) => {
    const el = document.querySelector(`[data-count="${status}"]`);
    if (el) el.textContent = String(counts[status]);
  });
}

function renderPriorityBadge(priority) {
  if (priority === 'high') {
    return '<span class="badge badge-danger">High Priority</span>';
  }
  if (priority === 'low') {
    return '<span class="badge badge-success">Low Priority</span>';
  }
  return '<span class="badge badge-warning">Medium Priority</span>';
}

function getSubjectBadgeBg(subject) {
  const color = getSubjectBadgeColor(subject);
  return `${color}1A`;
}

function getSubjectBadgeColor(subject) {
  const seed = subject.toLowerCase();
  if (seed.includes('math')) return '#10b981';
  if (seed.includes('physics')) return '#f59e0b';
  if (seed.includes('english')) return '#ef4444';
  return '#5e6ad2';
}

function formatDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

function setupSearch() {
  // Wire up search inputs on tasks page
  const searchInputs = [
    document.getElementById('task-search-input'),
    document.getElementById('tasks-search')
  ];
  searchInputs.forEach(input => {
    if (!input) return;
    input.addEventListener('input', () => {
      const query = input.value.toLowerCase().trim();
      const cards = document.querySelectorAll('.task-card');
      cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(query) || query === '' ? '' : 'none';
      });
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        input.value = '';
        input.dispatchEvent(new Event('input'));
      }
    });
  });
}

function setupModalBtn() {
  const openBtn = document.getElementById('open-task-modal-btn');
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      const modal = document.getElementById('taskModal');
      if (modal) modal.classList.add('active');
    });
  }

  // Close modal when clicking overlay backdrop
  const modal = document.getElementById('taskModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  }
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}
