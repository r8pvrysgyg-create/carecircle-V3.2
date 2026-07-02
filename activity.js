import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

import { auth, db } from "./firebase.js";
import { appState } from "./state.js";
import { escapeHtml } from "./ui.js";

export async function logActivity(action, detail = "") {
  const user = auth.currentUser;
  if (!user) return;

  await addDoc(collection(db, "activity"), {
    action,
    detail,
    userEmail: user.email,
    createdAt: serverTimestamp(),
    createdAtMs: Date.now()
  });
}

export async function loadActivity() {
  const snapshot = await getDocs(collection(db, "activity"));
  appState.activity = [];

  snapshot.forEach(docSnap => {
    appState.activity.push({ id: docSnap.id, ...docSnap.data() });
  });

  appState.activity.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
  renderActivityLog();
}

export function renderActivityLog() {
  const div = document.getElementById("adminActivityLog");
  if (!div) return;

  div.innerHTML = appState.activity.length
    ? appState.activity.slice(0, 20).map(item => `
      <div class="item small-admin-item">
        <strong>${escapeHtml(item.action)}</strong>
        <p>${escapeHtml(item.detail || "")}</p>
        <small>${escapeHtml(item.userEmail || "unknown")}</small>
      </div>
    `).join("")
    : "<p>No activity recorded yet.</p>";
}
