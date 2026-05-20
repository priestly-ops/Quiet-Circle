export function readSaved(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

export function writeSaved(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function removeSaved(key) {
  localStorage.removeItem(key);
}
