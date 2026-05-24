// Firebase shared initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBjfQZ-9RiDqT9823MYcXCO--1-ifmf1rc",
  authDomain: "web-programming-d2d83.firebaseapp.com",
  projectId: "web-programming-d2d83",
  storageBucket: "web-programming-d2d83.firebasestorage.app",
  messagingSenderId: "1986464722",
  appId: "1:1986464722:web:d21f98eab6e29ed4af960b",
  measurementId: "G-DN50EK2PJQ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
