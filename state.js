export const appState = {
  appointments: [],
  tasks: [],
  notes: [],
  users: [],
  activity: [],
  currentUserProfile: null
};

export function isAdmin() {
  return appState.currentUserProfile?.role === "admin";
}

export function formatDate(dateString) {
  if (!dateString) return "No date";
  const [year, month, day] = dateString.split("-");
  return `${month}/${day}/${year}`;
}

export function todayString() {
  return new Date().toISOString().split("T")[0];
}

export function emailToDocId(email) {
  return String(email || "").trim().toLowerCase();
}
