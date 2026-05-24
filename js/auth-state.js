import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

export async function getUserProfile(user) {
  const baseProfile = {
    uid: user.uid,
    name: user.displayName || "Student",
    email: user.email || ""
  };

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    const newProfile = { ...baseProfile, createdAt: serverTimestamp() };
    await setDoc(userRef, newProfile, { merge: true });
    localStorage.setItem("user", JSON.stringify(newProfile));
    return newProfile;
  }

  const profile = { ...baseProfile, ...snap.data() };
  localStorage.setItem("user", JSON.stringify(profile));
  return profile;
}

export function requireAuth(redirectTo = "login.html") {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        localStorage.removeItem("user");
        if (redirectTo) {
          window.location.href = redirectTo;
        }
        resolve(null);
        return;
      }

      const profile = await getUserProfile(user);
      resolve(profile);
    });
  });
}
