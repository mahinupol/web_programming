import { db } from "./firebase.js";
import { requireAuth } from "./auth-state.js";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

let currentUid = null;
let selectedDate = new Date();
let allSessions = [];

document.addEventListener('DOMContentLoaded', async () => {
  const profile = await requireAuth();
  if (!profile) return;
  currentUid = profile.uid;

  setupDateControls();
  setupForm();
  setupViewToggle();
  updateCurrentDateLabel();
  subscribeSessions();
  setupModalBackdrop();
});

function setupDateControls() {
  const prevBtn = document.getElementById('date-prev');
  const nextBtn = document.getElementById('date-next');
  const addBtn = document.getElementById('add-session-btn');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      selectedDate.setDate(selectedDate.getDate() - 1);
      updateCurrentDateLabel();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      selectedDate.setDate(selectedDate.getDate() + 1);
      updateCurrentDateLabel();
    });
  }

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const modal = document.getElementById('sessionModal');
      if (modal) modal.classList.add('active');
      setValue('session-date', toDateString(selectedDate));
    });
  }
}

function setupForm() {
  const form = document.getElementById('session-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = getValue('session-title');
    const date = getValue('session-date');
    const startTime = getValue('session-start');
    const endTime = getValue('session-end');
    const location = getValue('session-location');
    const category = getValue('session-category');

    if (!title || !date || !startTime || !endTime) return;

    try {
      await addDoc(collection(db, 'users', currentUid, 'sessions'), {
        title,
        date,
        startTime,
        endTime,
        location,
        category,
        createdAt: serverTimestamp()
      });

      form.reset();
      closeModal('sessionModal');
      if (typeof showToast === 'function') {
        showToast('Session saved successfully!');
      }
    } catch (error) {
      alert(error.message || 'Unable to save session.');
    }
  });
}

function subscribeSessions() {
  const sessionsRef = collection(db, 'users', currentUid, 'sessions');
  const sessionsQuery = query(sessionsRef, orderBy('createdAt', 'desc'));

  onSnapshot(sessionsQuery, (snapshot) => {
    allSessions = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    renderSessions(allSessions);
  });
}

function renderSessions(sessions) {
  const dateStr = toDateString(selectedDate);
  const daySessions = sessions.filter((session) => session.date === dateStr);

  document.querySelectorAll('.timeline-content').forEach((slot) => {
    slot.innerHTML = '';
  });

  daySessions.forEach((session) => {
    const hour = parseInt(session.startTime.split(':')[0], 10);
    const slot = document.querySelector(`[data-slot="${hour}"]`);
    if (!slot) return;

    const block = document.createElement('div');
    block.className = 'timeline-block';
    block.style.borderLeftColor = getCategoryColor(session.category);
    block.style.background = `${getCategoryColor(session.category)}1A`;

    block.innerHTML = `
      <div class="block-title">${escapeHtml(session.title)}</div>
      <div class="block-meta">
        ${session.location ? `<span><i data-lucide="map-pin" style="width:12px;height:12px;"></i> ${escapeHtml(session.location)}</span>` : ''}
        <span>${session.startTime} - ${session.endTime}</span>
      </div>
    `;

    slot.appendChild(block);
  });

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function updateCurrentDateLabel() {
  const label = document.getElementById('current-date');
  if (!label) return;
  label.textContent = selectedDate.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  renderSessions(allSessions);
}

function getCategoryColor(category) {
  const seed = (category || '').toLowerCase();
  if (seed.includes('lecture')) return '#10b981';
  if (seed.includes('study')) return '#5e6ad2';
  if (seed.includes('break')) return '#9ca3af';
  return '#f59e0b';
}

function toDateString(date) {
  return date.toISOString().slice(0, 10);
}

function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

function setupViewToggle() {
  const viewBtns = document.querySelectorAll('.view-btn');
  viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      viewBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const isWeekly = btn.textContent.trim().toLowerCase() === 'weekly';
      if (isWeekly) {
        renderWeeklyView();
      } else {
        renderSessions(allSessions);
      }
    });
  });
}

function renderWeeklyView() {
  // Get Monday of current week
  const monday = new Date(selectedDate);
  const day = monday.getDay();
  const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
  monday.setDate(diff);

  // Show sessions for the whole week
  const weekSessions = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekSessions[toDateString(d)] = [];
  }
  allSessions.forEach(s => {
    if (weekSessions[s.date] !== undefined) {
      weekSessions[s.date].push(s);
    }
  });

  // Clear timeline slots and show a weekly summary
  document.querySelectorAll('.timeline-content').forEach(slot => slot.innerHTML = '');

  // Insert a summary into the first slot
  const firstSlot = document.querySelector('.timeline-content');
  if (firstSlot) {
    const days = Object.keys(weekSessions);
    let html = '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;padding:0.5rem 0;">';
    days.forEach(dateStr => {
      const d = new Date(dateStr);
      const dayName = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      const sessions = weekSessions[dateStr];
      const hasEvents = sessions.length > 0;
      html += `<div style="flex:1;min-width:100px;background:${hasEvents ? 'var(--accent-light)' : 'var(--bg-secondary)'};border:1px solid var(--border-color);border-radius:var(--border-radius-sm);padding:0.75rem;cursor:pointer;" onclick="void 0" title="Click to go to this day">`;
      html += `<div style="font-weight:600;font-size:0.8rem;margin-bottom:0.4rem;">${dayName}</div>`;
      if (sessions.length === 0) {
        html += '<div style="font-size:0.75rem;color:var(--text-tertiary);">No sessions</div>';
      } else {
        sessions.forEach(s => {
          html += `<div style="font-size:0.75rem;background:var(--bg-primary);padding:0.25rem 0.5rem;border-radius:4px;margin-bottom:0.25rem;border-left:3px solid ${getCategoryColor(s.category)};">${escapeHtml(s.title)} (${s.startTime}–${s.endTime})</div>`;
        });
      }
      html += '</div>';
    });
    html += '</div>';
    firstSlot.innerHTML = html;
  }
}

function setupModalBackdrop() {
  const modal = document.getElementById('sessionModal');
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
