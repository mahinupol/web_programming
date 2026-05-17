document.addEventListener('DOMContentLoaded', () => {
  initCharts();
  
  // Re-render charts when theme changes to update text colors
  window.addEventListener('themeChanged', () => {
    initCharts();
  });
});

let trendChartInstance = null;
let subjectChartInstance = null;

function initCharts() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  
  // Colors based on theme
  const textColor = isDark ? '#9ca3af' : '#4b5563';
  const gridColor = isDark ? '#2d3139' : '#e5e7eb';
  
  Chart.defaults.color = textColor;
  Chart.defaults.font.family = "'Inter', sans-serif";

  // 1. Trend Chart (Bar/Line)
  const trendCtx = document.getElementById('trendChart');
  if (trendCtx) {
    if (trendChartInstance) trendChartInstance.destroy();
    
    trendChartInstance = new Chart(trendCtx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Study Hours',
          data: [2, 4.5, 3, 5, 2.5, 6, 1],
          borderColor: '#5e6ad2',
          backgroundColor: 'rgba(94, 106, 210, 0.1)',
          borderWidth: 3,
          pointBackgroundColor: '#5e6ad2',
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4 // Smooth curves
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

  // 2. Subject Distribution Chart (Doughnut)
  const subjectCtx = document.getElementById('subjectChart');
  if (subjectCtx) {
    if (subjectChartInstance) subjectChartInstance.destroy();
    
    subjectChartInstance = new Chart(subjectCtx, {
      type: 'doughnut',
      data: {
        labels: ['Computer Science', 'Mathematics', 'Physics', 'English'],
        datasets: [{
          data: [40, 25, 20, 15],
          backgroundColor: [
            '#5e6ad2', // Primary
            '#10b981', // Success
            '#f59e0b', // Warning
            '#ef4444'  // Danger
          ],
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
