document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      // Simple mock authentication
      if (email && password) {
        localStorage.setItem('user', JSON.stringify({ email, name: 'Student' }));
        window.location.href = 'dashboard.html';
      }
    });
  }
  
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      if (name && email && password) {
        localStorage.setItem('user', JSON.stringify({ email, name }));
        window.location.href = 'dashboard.html';
      }
    });
  }
});
