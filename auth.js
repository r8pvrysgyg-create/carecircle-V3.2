import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

import { auth } from "./firebase.js";

const provider = new GoogleAuthProvider();

// Change this to your main Google email.
const BOOTSTRAP_ADMIN_EMAILS = [
  "npringleco@gmail.com"
];

export function setupAuth(onLogin, onLogout) {
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const userEmail = document.getElementById("userEmail");
  const appContent = document.getElementById("appContent");
  const signedOutMessage = document.getElementById("signedOutMessage");

  loginBtn.onclick = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      alert(error.message);
      console.error(error);
    }
  };

  logoutBtn.onclick = async () => {
    await signOut(auth);
  };

  onAuthStateChanged(auth, user => {
    if (user) {
      const isBootstrapAdmin = BOOTSTRAP_ADMIN_EMAILS
        .map(email => email.toLowerCase())
        .includes(user.email.toLowerCase());

      if (!isBootstrapAdmin) {
        userEmail.textContent = user.email + " is not approved yet.";
        loginBtn.classList.add("hidden");
        logoutBtn.classList.remove("hidden");
        appContent.classList.add("hidden");
        signedOutMessage.classList.remove("hidden");
        signedOutMessage.innerHTML = `
          <h2>Access Pending</h2>
          <p>This Google account is not approved for CareCircle yet.</p>
        `;
        onLogout();
        return;
      }

      userEmail.textContent = user.email;
      loginBtn.classList.add("hidden");
      logoutBtn.classList.remove("hidden");
      appContent.classList.remove("hidden");
      signedOutMessage.classList.add("hidden");

      onLogin(user);
    } else {
      userEmail.textContent = "";
      loginBtn.classList.remove("hidden");
      logoutBtn.classList.add("hidden");
      appContent.classList.add("hidden");
      signedOutMessage.classList.remove("hidden");
      signedOutMessage.innerHTML = `
        <h2>Please sign in</h2>
        <p>Only approved family members can view or add information.</p>
      `;

      onLogout();
    }
  });
}
