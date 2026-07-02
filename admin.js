import {
  collection,
  getDocs,
  setDoc,
  updateDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

import { auth, db } from "./firebase.js";
import { appState, emailToDocId, isAdmin } from "./state.js";
import { escapeHtml } from "./ui.js";
import { logActivity, loadActivity } from "./activity.js";

export async function addApprovedUser() {
  if (!isAdmin()) return alert("Only admins can add family members.");

  const emailInput = document.getElementById("adminUserEmail");
  const nameInput = document.getElementById("adminUserName");
  const roleInput = document.getElementById("adminUserRole");

  const email = emailToDocId(emailInput.value);
  const name = nameInput.value.trim() || email;
  const role = roleInput.value;

  if (!email || !email.includes("@")) return alert("Enter a valid email address.");

  await setDoc(doc(db, "users", email), {
    email,
    name,
    role,
    active: true,
    createdBy: auth.currentUser.email,
    createdAt: serverTimestamp()
  }, { merge: true });

  await logActivity("Added/updated family member", `${email} as ${role}`);

  emailInput.value = "";
  nameInput.value = "";
  roleInput.value = "family";

  await loadUsers();
  await loadActivity();
}

export async function loadUsers() {
  const snapshot = await getDocs(collection(db, "users"));
  appState.users = [];

  snapshot.forEach(docSnap => appState.users.push({ id: docSnap.id, ...docSnap.data() }));
  appState.users.sort((a, b) => (a.email || "").localeCompare(b.email || ""));

  renderUsers();
}

export function renderUsers() {
  const div = document.getElementById("adminUsers");
  if (!div) return;

  if (!isAdmin()) {
    div.innerHTML = "<p>Only admins can view family access settings.</p>";
    return;
  }

  div.innerHTML = appState.users.length
    ? appState.users.map(user => renderUserCard(user)).join("")
    : "<p>No approved users yet. Add your main account as Admin first.</p>";

  setupUserButtons();
}

function renderUserCard(user) {
  const activeText = user.active === false ? "Inactive" : "Active";
  const role = user.role || "family";
  const canDisable = emailToDocId(user.email) !== emailToDocId(auth.currentUser?.email);

  return `
    <div class="item admin-user-card ${user.active === false ? "disabled-user" : ""}">
      <div class="item-topline">
        <strong>${escapeHtml(user.name || user.email)}</strong>
        <span class="pill">${escapeHtml(role)}</span>
      </div>
      <p>${escapeHtml(user.email)}</p>
      <small>${activeText}</small>
      <div class="action-row">
        <button data-user-role="${escapeHtml(user.email)}" data-current-role="${escapeHtml(role)}">Switch Role</button>
        ${canDisable ? `<button class="danger" data-user-active="${escapeHtml(user.email)}" data-current-active="${user.active !== false}">${user.active === false ? "Reactivate" : "Disable"}</button>` : ""}
      </div>
    </div>
  `;
}

function setupUserButtons() {
  document.querySelectorAll("[data-user-role]").forEach(button => {
    button.onclick = async () => {
      if (!isAdmin()) return alert("Only admins can change roles.");
      const email = emailToDocId(button.getAttribute("data-user-role"));
      const currentRole = button.getAttribute("data-current-role");
      const nextRole = currentRole === "admin" ? "family" : "admin";

      await updateDoc(doc(db, "users", email), {
        role: nextRole,
        updatedBy: auth.currentUser.email,
        updatedAt: serverTimestamp()
      });

      await logActivity("Changed user role", `${email} to ${nextRole}`);
      await loadUsers();
      await loadActivity();
    };
  });

  document.querySelectorAll("[data-user-active]").forEach(button => {
    button.onclick = async () => {
      if (!isAdmin()) return alert("Only admins can disable users.");
      const email = emailToDocId(button.getAttribute("data-user-active"));
      const active = button.getAttribute("data-current-active") === "true";

      if (active && !confirm(`Disable access for ${email}?`)) return;

      await updateDoc(doc(db, "users", email), {
        active: !active,
        updatedBy: auth.currentUser.email,
        updatedAt: serverTimestamp()
      });

      await logActivity(active ? "Disabled user" : "Reactivated user", email);
      await loadUsers();
      await loadActivity();
    };
  });
}

export function applyAdminVisibility() {
  document.querySelectorAll("[data-admin-only]").forEach(el => {
    el.classList.toggle("hidden", !isAdmin());
  });

  document.querySelectorAll("[data-role-label]").forEach(el => {
    el.textContent = isAdmin() ? "Admin" : "Family Member";
  });
}
