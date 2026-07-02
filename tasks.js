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
import { appState, formatDate, isAdmin } from "./state.js";
import { escapeHtml } from "./ui.js";
import { renderDashboard } from "./dashboard.js";
import { renderFamily } from "./family.js";
import { logActivity, loadActivity } from "./activity.js";

export async function addTask() {
  const user = auth.currentUser;
  if (!user) return alert("You must be logged in to add tasks.");

  const title = document.getElementById("taskTitle").value.trim();
  const assignedTo = document.getElementById("taskAssignedTo").value.trim();
  const dueDate = document.getElementById("taskDueDate").value;
  const person = document.getElementById("taskPerson").value;
  const notes = document.getElementById("taskNotes").value.trim();

  if (!title) return alert("Please enter a task.");

  await addDoc(collection(db, "tasks"), {
    title,
    assignedTo,
    dueDate,
    person,
    notes,
    completed: false,
    createdBy: user.email,
    createdAt: serverTimestamp()
  });

  await logActivity("Added task", title);
  clearTaskForm();
  await loadTasks();
  await loadActivity();
}

export async function loadTasks() {
  const snapshot = await getDocs(collection(db, "tasks"));
  appState.tasks = [];

  snapshot.forEach(taskDoc => appState.tasks.push({ id: taskDoc.id, ...taskDoc.data() }));

  appState.tasks.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return (a.dueDate || "9999-99-99").localeCompare(b.dueDate || "9999-99-99");
  });

  renderTasks();
  renderDashboard();
  renderFamily();
}

export function renderTasks() {
  const div = document.getElementById("tasks");
  if (!div) return;
  div.innerHTML = appState.tasks.length ? appState.tasks.map(t => renderTaskCard(t)).join("") : "<p>No tasks yet.</p>";
  setupTaskButtons();
}

export function renderTaskCard(task, compact = false) {
  return `
    <div class="item task-item ${task.completed ? "completed" : ""}">
      <div class="task-row">
        <button class="check-btn" data-task-toggle="${task.id}" data-completed="${task.completed}">
          ${task.completed ? "☑" : "☐"}
        </button>
        <div>
          <strong>${escapeHtml(task.title)}</strong>
          ${task.person ? `<p>👤 For: ${escapeHtml(task.person)}</p>` : ""}
          ${task.assignedTo ? `<p>🙋 Assigned: ${escapeHtml(task.assignedTo)}</p>` : ""}
          ${task.dueDate ? `<p>📅 Due: ${formatDate(task.dueDate)}</p>` : ""}
          ${task.notes && !compact ? `<p>📝 ${escapeHtml(task.notes)}</p>` : ""}
          <small>Added by ${escapeHtml(task.createdBy || "unknown")}</small>
          ${!compact && isAdmin() ? `<div class="action-row"><button class="danger" data-task-delete="${task.id}">Delete</button></div>` : ""}
        </div>
      </div>
    </div>
  `;
}

function setupTaskButtons() {
  document.querySelectorAll("[data-task-toggle]").forEach(button => {
    button.onclick = async () => {
      const id = button.getAttribute("data-task-toggle");
      const completed = button.getAttribute("data-completed") === "true";
      await updateDoc(doc(db, "tasks", id), {
        completed: !completed,
        completedAt: !completed ? serverTimestamp() : null,
        completedBy: !completed ? auth.currentUser.email : null
      });
      await logActivity(!completed ? "Completed task" : "Reopened task", id);
      await loadTasks();
      await loadActivity();
    };
  });

  document.querySelectorAll("[data-task-delete]").forEach(button => {
    button.onclick = async () => {
      if (!confirm("Delete this task?")) return;
      if (!isAdmin()) return alert("Only admins can delete tasks.");
      const id = button.getAttribute("data-task-delete");
      await deleteDoc(doc(db, "tasks", id));
      await logActivity("Deleted task", id);
      await loadTasks();
      await loadActivity();
    };
  });
}

function clearTaskForm() {
  ["taskTitle", "taskAssignedTo", "taskDueDate", "taskPerson", "taskNotes"].forEach(id => document.getElementById(id).value = "");
}

export function getOpenTasks(limit = 5) {
  return appState.tasks.filter(t => !t.completed).slice(0, limit);
}
