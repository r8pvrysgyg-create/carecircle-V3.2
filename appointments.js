import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

import { auth, db } from "./firebase.js";
import { appState, formatDate, todayString, isAdmin } from "./state.js";
import { escapeHtml } from "./ui.js";
import { renderDashboard } from "./dashboard.js";
import { renderFamily } from "./family.js";
import { logActivity, loadActivity } from "./activity.js";

export async function addAppointment() {
  const user = auth.currentUser;
  if (!user) return alert("You must be logged in to add appointments.");

  const person = document.getElementById("apptPerson").value.trim();
  const doctor = document.getElementById("apptDoctor").value.trim();
  const location = document.getElementById("apptLocation").value.trim();
  const driver = document.getElementById("apptDriver").value.trim();
  const date = document.getElementById("apptDate").value;
  const time = document.getElementById("apptTime").value;
  const notes = document.getElementById("apptNotes").value.trim();

  if (!person || !doctor || !date) return alert("Please enter person, doctor/visit type, and date.");

  await addDoc(collection(db, "appointments"), {
    person,
    doctor,
    location,
    driver,
    date,
    time,
    notes,
    status: "Scheduled",
    createdBy: user.email,
    createdAt: serverTimestamp()
  });

  await logActivity("Added appointment", `${person}: ${doctor} on ${date}`);
  clearAppointmentForm();
  await loadAppointments();
  await loadActivity();
}

export async function loadAppointments() {
  const snapshot = await getDocs(collection(db, "appointments"));
  appState.appointments = [];

  snapshot.forEach(docSnap => {
    appState.appointments.push({ id: docSnap.id, ...docSnap.data() });
  });

  appState.appointments.sort((a, b) => `${a.date || ""} ${a.time || ""}`.localeCompare(`${b.date || ""} ${b.time || ""}`));

  renderAppointments();
  renderDashboard();
  renderFamily();
}

export function renderAppointments() {
  const div = document.getElementById("appointments");
  if (!div) return;

  div.innerHTML = appState.appointments.length
    ? appState.appointments.map(a => renderAppointmentCard(a)).join("")
    : "<p>No appointments added yet.</p>";

  setupAppointmentButtons();
}

export function renderAppointmentCard(a, compact = false) {
  return `
    <div class="item status-${escapeHtml(a.status || "Scheduled").toLowerCase()}">
      <div class="item-topline">
        <strong>${escapeHtml(a.person)}</strong>
        <span class="pill">${escapeHtml(a.status || "Scheduled")}</span>
      </div>
      <p class="item-title">${escapeHtml(a.doctor)}</p>
      <p>📅 ${formatDate(a.date)} ${escapeHtml(a.time || "")}</p>
      ${a.location ? `<p>📍 ${escapeHtml(a.location)}</p>` : ""}
      ${a.driver ? `<p>🚗 Driver: ${escapeHtml(a.driver)}</p>` : ""}
      ${a.notes && !compact ? `<p>📝 ${escapeHtml(a.notes)}</p>` : ""}
      <small>Added by ${escapeHtml(a.createdBy || "unknown")}</small>
      ${!compact ? `
        <div class="action-row">
          <button data-appt-status="${a.id}" data-current-status="${escapeHtml(a.status || "Scheduled")}">Change Status</button>
          ${isAdmin() ? `<button class="danger" data-appt-delete="${a.id}">Delete</button>` : ""}
        </div>` : ""}
    </div>
  `;
}

function setupAppointmentButtons() {
  document.querySelectorAll("[data-appt-delete]").forEach(button => {
    button.onclick = async () => {
      if (!confirm("Delete this appointment?")) return;
      if (!isAdmin()) return alert("Only admins can delete appointments.");
      const id = button.getAttribute("data-appt-delete");
      await deleteDoc(doc(db, "appointments", id));
      await logActivity("Deleted appointment", id);
      await loadAppointments();
      await loadActivity();
    };
  });

  document.querySelectorAll("[data-appt-status]").forEach(button => {
    button.onclick = async () => {
      const id = button.getAttribute("data-appt-status");
      const current = button.getAttribute("data-current-status");
      const statuses = ["Scheduled", "Confirmed", "Completed", "Cancelled"];
      const nextStatus = statuses[(statuses.indexOf(current) + 1) % statuses.length];
      await updateDoc(doc(db, "appointments", id), { status: nextStatus, updatedAt: serverTimestamp() });
      await logActivity("Changed appointment status", `${id} to ${nextStatus}`);
      await loadAppointments();
      await loadActivity();
    };
  });
}

function clearAppointmentForm() {
  ["apptPerson", "apptDoctor", "apptLocation", "apptDriver", "apptDate", "apptTime", "apptNotes"].forEach(id => {
    document.getElementById(id).value = "";
  });
}

export function getTodaysAppointments() {
  const today = todayString();
  return appState.appointments.filter(a => a.date === today && a.status !== "Cancelled");
}

export function getUpcomingAppointments(limit = 5) {
  const today = todayString();
  return appState.appointments.filter(a => a.date >= today && a.status !== "Cancelled").slice(0, limit);
}
