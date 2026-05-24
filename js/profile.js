import { db } from "./firebase.js";
import { requireAuth } from "./auth-state.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
  const profile = await requireAuth();
  if (!profile) return;

  const userRef = doc(db, 'users', profile.uid);
  const snap = await getDoc(userRef);
  const data = snap.exists() ? snap.data() : {};

  setText('profile-name', data.name || profile.name || 'Student');
  setText('profile-email', data.email || profile.email || '');
  setText('profile-initial', (data.name || profile.name || 'S').charAt(0).toUpperCase());
  setText('profile-bio', data.bio || 'No bio yet.');
  setText('profile-location', data.location || 'No location set');

  const joined = toDate(data.createdAt);
  setText('profile-joined', joined ? formatDate(joined) : 'Not set');
});

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  return null;
}

function formatDate(date) {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}
