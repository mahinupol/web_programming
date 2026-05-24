import { db } from "./firebase.js";
import { requireAuth } from "./auth-state.js";
import {
  collection,
  getDocs,
  orderBy,
  query
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
  const profile = await requireAuth();
  if (!profile) return;

  const tasks = await loadTasks(profile.uid);
  initCharts(tasks);
  updateStats(tasks);

  window.addEventListener('themeChanged', () => {
    initCharts(tasks);
  });
});

let trendChartInstance = null;
let subjectChartInstance = null;

async function loadTasks(uid) {
  const tasksRef = collection(db, 'users', uid, 'tasks');
  const tasksQuery = query(tasksRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(tasksQuery);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

function initCharts(tasks) {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#9ca3af' : '#4b5563';
  const gridColor = isDark ? '#2d3139' : '#e5e7eb';

  Chart.defaults.color = textColor;
  Chart.defaults.font.family = "'Inter', sans-serif";

  const { labels, trendData } = buildWeeklyTrend(tasks);
  const subjectData = buildSubjectDistribution(tasks);

  const trendCtx = document.getElementById('trendChart');
  if (trendCtx) {
    if (trendChartInstance) trendChartInstance.destroy();

    trendChartInstance = new Chart(trendCtx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Study Hours',
          data: trendData,
          borderColor: '#5e6ad2',
          backgroundColor: 'rgba(94, 106, 210, 0.1)',
          borderWidth: 3,
          pointBackgroundColor: '#5e6ad2',
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: gridColor },
            border: { display: false }
          },
          x: {
            grid: { display: false },
            border: { display: false }
          }
        }
      }
    });
  }

  const subjectCtx = document.getElementById('subjectChart');
  if (subjectCtx) {
    if (subjectChartInstance) subjectChartInstance.destroy();

    subjectChartInstance = new Chart(subjectCtx, {
      type: 'doughnut',
      data: {
        labels: subjectData.labels,
        datasets: [{
          data: subjectData.values,
          backgroundColor: subjectData.colors,
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          }
        }
      }
    });
  }
}

function buildWeeklyTrend(tasks) {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date();
  const monday = getMonday(today);
  const totals = new Array(7).fill(0);

  tasks.forEach((task) => {
    const date = task.dueDate ? new Date(task.dueDate) : toDate(task.createdAt);
    if (!date || Number.isNaN(date.getTime())) return;

    const dayIndex = Math.floor((stripTime(date) - stripTime(monday)) / 86400000);
    if (dayIndex >= 0 && dayIndex < 7) {
      totals[dayIndex] += Number(task.durationHours) || 0;
    }
  });

  return { labels, trendData: totals };
}

function buildSubjectDistribution(tasks) {
  const counts = new Map();
  tasks.forEach((task) => {
    const subject = task.subject ? task.subject.trim() : 'General';
    counts.set(subject, (counts.get(subject) || 0) + 1);
  });

  const labels = Array.from(counts.keys());
  const values = Array.from(counts.values());
  const colors = labels.map((label, index) => getSubjectColor(label, index));

  if (labels.length === 0) {
    return { labels: ['No data'], values: [1], colors: ['#e5e7eb'] };
  }

  return { labels, values, colors };
}

function updateStats(tasks) {
  const { dayLabel, maxValue } = mostProductiveDay(tasks);
  const avgSession = averageDuration(tasks);
  const completionRate = calcCompletionRate(tasks);

  setText('stat-productive-day', maxValue > 0 ? dayLabel : 'No data');
  setText('stat-avg-session', avgSession > 0 ? `${avgSession.toFixed(1)}h` : '0h');
  setText('stat-completion-rate', `${completionRate}%`);
}

function mostProductiveDay(tasks) {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const totals = new Array(7).fill(0);
  const monday = getMonday(new Date());

  tasks.forEach((task) => {
    const date = task.dueDate ? new Date(task.dueDate) : toDate(task.createdAt);
    if (!date) return;
    const dayIndex = Math.floor((stripTime(date) - stripTime(monday)) / 86400000);
    if (dayIndex >= 0 && dayIndex < 7) {
      totals[dayIndex] += Number(task.durationHours) || 0;
    }
  });

  let maxValue = 0;
  let maxIndex = 0;
  totals.forEach((value, index) => {
    if (value > maxValue) {
      maxValue = value;
      maxIndex = index;
    }
  });

  return { dayLabel: labels[maxIndex], maxValue };
}

function averageDuration(tasks) {
  if (tasks.length === 0) return 0;
  const total = tasks.reduce((sum, task) => sum + (Number(task.durationHours) || 0), 0);
  return total / tasks.length;
}

function calcCompletionRate(tasks) {
  if (tasks.length === 0) return 0;
  const done = tasks.filter((task) => task.status === 'done').length;
  return Math.round((done / tasks.length) * 100);
}

function getMonday(date) {
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  return stripTime(monday);
}

function stripTime(date) {
  const cloned = new Date(date);
  cloned.setHours(0, 0, 0, 0);
  return cloned;
}

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  return null;
}

function getSubjectColor(subject, index = 0) {
  if (!subject) return pickPalette(index);
  const seed = subject.toLowerCase();
  if (seed.includes('math')) return '#10b981';
  if (seed.includes('physics')) return '#f59e0b';
  if (seed.includes('english')) return '#ef4444';
  if (seed.includes('chem')) return '#3b82f6';
  if (seed.includes('bio')) return '#22c55e';
  return pickPalette(index);
}

function pickPalette(index) {
  const palette = ['#5e6ad2', '#f97316', '#14b8a6', '#e11d48', '#22c55e', '#0ea5e9', '#a855f7'];
  return palette[index % palette.length];
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
