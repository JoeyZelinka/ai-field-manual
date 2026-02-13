export const LS_KEY = "ai_field_manual_v1";

export function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function mergeSave(partial) {
  const existing = loadState() || {};
  saveState({ ...existing, ...partial });
}