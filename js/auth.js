import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// Friendly Firebase error messages
function friendlyAuthError(code) {
  const messages = {
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.'
  };
  return messages[code] || 'Something went wrong. Please try again.';
}

function showFormError(form, message) {
  // Remove existing error
  const existing = form.querySelector('.form-error-msg');
  if (existing) existing.remove();

  const errEl = document.createElement('div');
  errEl.className = 'form-error-msg';
  errEl.style.cssText = `
    background: var(--danger-light);
    color: var(--danger);
    border: 1px solid var(--danger);
    border-radius: var(--border-radius-sm);
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    animation: slideDown 0.3s ease;
  `;
  errEl.textContent = message;
  form.insertBefore(errEl, form.firstChild);

  // Auto remove after 5 seconds
  setTimeout(() => errEl.remove(), 5000);
}

function setButtonLoading(btn, loading) {
  if (loading) {
    btn.disabled = true;
    btn.dataset.originalText = btn.textContent;
    btn.innerHTML = '<span style="display:inline-flex;align-items:center;gap:0.5rem;"><svg style="animation:spin 1s linear infinite;width:16px;height:16px;" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="60" stroke-dashoffset="20"/></svg> Please wait...</span>';
  } else {
    btn.disabled = false;
    btn.textContent = btn.dataset.originalText || 'Submit';
  }
}

// Add spin keyframe if not present
if (!document.getElementById('spin-style')) {
  const style = document.createElement('style');
  style.id = 'spin-style';
  style.textContent = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
  document.head.appendChild(style);
}

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const submitBtn = loginForm.querySelector('[type="submit"]');

      if (!email || !password) {
        showFormError(loginForm, 'Please fill in all fields.');
        return;
      }

      setButtonLoading(submitBtn, true);

      try {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const user = credential.user;

        let profile = { uid: user.uid, email: user.email || email, name: user.displayName || 'Student' };
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          profile = { ...profile, ...userSnap.data() };
        }

        localStorage.setItem('user', JSON.stringify(profile));

        if (typeof window.showToast === 'function') {
          window.showToast(`Welcome back, ${profile.name.split(' ')[0]}!`);
        }

        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 600);
      } catch (error) {
        setButtonLoading(submitBtn, false);
        showFormError(loginForm, friendlyAuthError(error.code));
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const submitBtn = registerForm.querySelector('[type="submit"]');

      if (!name || !email || !password) {
        showFormError(registerForm, 'Please fill in all fields.');
        return;
      }

      if (password.length < 8) {
        showFormError(registerForm, 'Password must be at least 8 characters long.');
        return;
      }

      setButtonLoading(submitBtn, true);

      try {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        const user = credential.user;

        await updateProfile(user, { displayName: name });

        const userData = {
          uid: user.uid,
          name,
          email,
          createdAt: serverTimestamp()
        };

        await setDoc(doc(db, 'users', user.uid), userData);

        localStorage.setItem('user', JSON.stringify({ uid: user.uid, name, email }));

        if (typeof window.showToast === 'function') {
          window.showToast(`Account created! Welcome, ${name.split(' ')[0]}!`);
        }

        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 800);
      } catch (error) {
        setButtonLoading(submitBtn, false);
        showFormError(registerForm, friendlyAuthError(error.code));
      }
    });
  }
});
