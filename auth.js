import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

import { auth, db } from "./firebase.js";
import { appState, emailToDocId } from "./state.js";

// Add your main/admin Google account here before testing v3.2.
// Example: const BOOTSTRAP_ADMIN_EMAILS = ["you@gmail.com"];
const BOOTSTRAP_ADMIN_EMAILS = [npringleco@gmail.com];

const provider = new GoogleAuthProvider();

async function getOrCreateUserProfile(user) {
  const email = emailToDocId(user.email);
  const ref = doc(db, "users", email);
  const existing = await getDoc(ref);

  if (existing.exists()) {
    const data = existing.data();
    if (data.active === false) return null;
    return { id: existing.id, ...data };
  }

  if (BOOTSTRAP_ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email)) {
    const profile = {
      email,
      name: user.displayName || email,
      role: "admin",
      active: true,
      createdAt: serverTimestamp(),
      createdBy: "bootstrap"
    };
    await setDoc(ref, profile);
    return { id: email, ...profile };
  }

  return null;
}

export function setupAuth(onLogin, onLogout) {
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const mobileLogoutBtn = document.getElementById("mobileLogoutBtn");
  const unauthorizedLogoutBtn = document.getElementById("unauthorizedLogoutBtn");
  const userEmail = document.getElementById("userEmail");
  const userRole = document.getElementById("userRole");
  const appContent = document.getElementById("appContent");
  const signedOutMessage = document.getElementById("signedOutMessage");
  const unauthorizedMessage = document.getElementById("unauthorizedMessage");
  const sidebar = document.getElementById("sidebar");
  const menuBtn = document.getElementById("menuBtn");

  loginBtn.onclick = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      alert(error.message);
      console.error(error);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  logoutBtn.onclick = logout;
  mobileLogoutBtn.onclick = logout;
  unauthorizedLogoutBtn.onclick = logout;

  onAuthStateChanged(auth, async user => {
    if (user) {
      const profile = await getOrCreateUserProfile(user);

      if (profile) {
        appState.currentUserProfile = profile;
        userEmail.textContent = user.email;
        if (userRole) userRole.textContent = profile.role === "admin" ? "Admin" : "Family Member";
        appContent.classList.remove("hidden");
        sidebar.classList.remove("hidden");
        menuBtn.classList.remove("hidden");
        mobileLogoutBtn.classList.remove("hidden");
        signedOutMessage.classList.add("hidden");
        unauthorizedMessage.classList.add("hidden");
        await onLogin(user, profile);
        return;
      }

      appState.currentUserProfile = null;
      userEmail.textContent = "";
      if (userRole) userRole.textContent = "";
      appContent.classList.add("hidden");
      sidebar.classList.add("hidden");
      menuBtn.classList.add("hidden");
      mobileLogoutBtn.classList.add("hidden");
      signedOutMessage.classList.add("hidden");
      unauthorizedMessage.classList.remove("hidden");
      onLogout();
      return;
    }

    appState.currentUserProfile = null;
    userEmail.textContent = "";
    if (userRole) userRole.textContent = "";
    appContent.classList.add("hidden");
    sidebar.classList.add("hidden");
    menuBtn.classList.add("hidden");
    mobileLogoutBtn.classList.add("hidden");
    signedOutMessage.classList.remove("hidden");
    unauthorizedMessage.classList.add("hidden");
    onLogout();
  });
}
