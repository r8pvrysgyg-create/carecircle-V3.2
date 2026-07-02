import { appState } from "./state.js";
import { renderAppointmentCard } from "./appointments.js";
import { renderTaskCard } from "./tasks.js";
import { renderNoteCard } from "./notes.js";

export function renderFamily() {
  renderPerson("Grandma", "grandma");
  renderPerson("Grandpa", "grandpa");
}

function renderPerson(person, prefix) {
  const appts = appState.appointments.filter(a => a.person === person || a.person === "Both").slice(0, 5);
  const tasks = appState.tasks.filter(t => t.person === person || t.person === "Both").slice(0, 5);
  const notes = appState.notes.filter(n => n.person === person || n.person === "Both").slice(0, 5);

  const apptDiv = document.getElementById(`${prefix}Appointments`);
  const taskDiv = document.getElementById(`${prefix}Tasks`);
  const noteDiv = document.getElementById(`${prefix}Notes`);

  if (!apptDiv || !taskDiv || !noteDiv) return;

  apptDiv.innerHTML = appts.length ? appts.map(a => renderAppointmentCard(a, true)).join("") : "<p>No appointments.</p>";
  taskDiv.innerHTML = tasks.length ? tasks.map(t => renderTaskCard(t, true)).join("") : "<p>No tasks.</p>";
  noteDiv.innerHTML = notes.length ? notes.map(n => renderNoteCard(n, true)).join("") : "<p>No notes.</p>";
}
