import { appState, formatDate } from "./state.js";
import { getTodaysAppointments, getUpcomingAppointments, renderAppointmentCard } from "./appointments.js";
import { getOpenTasks, renderTaskCard } from "./tasks.js";
import { getRecentNotes, renderNoteCard } from "./notes.js";
import { escapeHtml } from "./ui.js";

export function renderDashboard() {
  const todayDiv = document.getElementById("todayAppointments");
  const upcomingDiv = document.getElementById("upcomingAppointments");
  const openTasksDiv = document.getElementById("openTasks");
  const recentNotesDiv = document.getElementById("recentNotes");
  const activityFeed = document.getElementById("activityFeed");

  if (!todayDiv || !upcomingDiv || !openTasksDiv || !recentNotesDiv) return;

  const todays = getTodaysAppointments();
  const upcoming = getUpcomingAppointments(5);
  const openTasks = getOpenTasks(5);
  const recentNotes = getRecentNotes(5);

  todayDiv.innerHTML = todays.length ? todays.map(a => renderAppointmentCard(a, true)).join("") : "<p>No appointments today.</p>";
  upcomingDiv.innerHTML = upcoming.length ? upcoming.map(a => renderAppointmentCard(a, true)).join("") : "<p>No upcoming appointments.</p>";
  openTasksDiv.innerHTML = openTasks.length ? openTasks.map(t => renderTaskCard(t, true)).join("") : "<p>No open tasks.</p>";
  recentNotesDiv.innerHTML = recentNotes.length ? recentNotes.map(n => renderNoteCard(n, true)).join("") : "<p>No recent notes.</p>";

  document.getElementById("statToday").textContent = todays.length;
  document.getElementById("statUpcoming").textContent = upcoming.length;
  document.getElementById("statOpenTasks").textContent = appState.tasks.filter(t => !t.completed).length;
  document.getElementById("statNotes").textContent = appState.notes.length;

  if (activityFeed) activityFeed.innerHTML = renderActivityFeed();
}

function renderActivityFeed() {
  if (appState.activity && appState.activity.length) {
    return appState.activity.slice(0, 8).map(item => `
      <div class="timeline-item">
        <span class="timeline-icon">🕒</span>
        <div>
          <strong>${escapeHtml(item.action || "Activity")}</strong>
          <p>${escapeHtml(item.detail || "")}</p>
          <small>${escapeHtml(item.userEmail || "unknown")}</small>
        </div>
      </div>
    `).join("");
  }

  const items = [];

  appState.appointments.forEach(a => {
    items.push({
      sort: `${a.date || "9999-99-99"} ${a.time || ""}`,
      icon: "📅",
      title: `${a.person || "Appointment"}: ${a.doctor || "Appointment"}`,
      detail: `${formatDate(a.date)} ${a.time || ""}${a.driver ? ` • Driver: ${a.driver}` : ""}`
    });
  });

  appState.tasks.forEach(t => {
    items.push({
      sort: t.dueDate || "9999-99-99",
      icon: t.completed ? "☑" : "☐",
      title: t.title || "Task",
      detail: `${t.assignedTo ? `Assigned: ${t.assignedTo}` : "Unassigned"}${t.dueDate ? ` • Due ${formatDate(t.dueDate)}` : ""}`
    });
  });

  appState.notes.forEach(n => {
    items.push({
      sort: String(n.createdAtMs || 0),
      icon: "📝",
      title: n.person ? `Note for ${n.person}` : "Family note",
      detail: `${n.author || "Someone"}: ${n.text || ""}`
    });
  });

  if (!items.length) return "<p>No activity yet.</p>";

  return items
    .sort((a, b) => String(b.sort).localeCompare(String(a.sort)))
    .slice(0, 8)
    .map(item => `
      <div class="timeline-item">
        <span class="timeline-icon">${item.icon}</span>
        <div>
          <strong>${escapeHtml(item.title)}</strong>
          <p>${escapeHtml(item.detail)}</p>
        </div>
      </div>
    `).join("");
}
