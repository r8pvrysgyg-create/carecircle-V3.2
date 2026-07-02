import { setupAuth } from "./auth.js";
import { setupNavigation } from "./ui.js";
import { addNote, loadNotes } from "./notes.js";
import { addAppointment, loadAppointments } from "./appointments.js";
import { addTask, loadTasks } from "./tasks.js";
import { renderDashboard } from "./dashboard.js";
import { renderFamily } from "./family.js";
import { setupSearch } from "./search.js";
import { appState, isAdmin } from "./state.js";
import { addApprovedUser, loadUsers, applyAdminVisibility } from "./admin.js";
import { loadActivity } from "./activity.js";

const addNoteBtn = document.getElementById("addNote");
const addApptBtn = document.getElementById("addAppt");
const addTaskBtn = document.getElementById("addTask");
const addAdminUserBtn = document.getElementById("addAdminUser");

if (addNoteBtn) addNoteBtn.onclick = addNote;
if (addApptBtn) addApptBtn.onclick = addAppointment;
if (addTaskBtn) addTaskBtn.onclick = addTask;
if (addAdminUserBtn) addAdminUserBtn.onclick = addApprovedUser;

setupNavigation();
setupSearch();

setupAuth(
  async () => {
    applyAdminVisibility();
    await Promise.all([loadAppointments(), loadTasks(), loadNotes(), loadActivity()]);
    if (isAdmin()) await loadUsers();
    renderDashboard();
    renderFamily();
  },
  () => {
    appState.appointments = [];
    appState.tasks = [];
    appState.notes = [];
    appState.users = [];
    appState.activity = [];
    appState.currentUserProfile = null;
    document.querySelectorAll("#appContent div[id]").forEach(el => {
      if (el.id) el.innerHTML = "";
    });
  }
);
