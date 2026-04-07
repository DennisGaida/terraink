const STORAGE_KEY = "here_api_key";
export const HERE_KEY_CHANGED_EVENT = "here-api-key-changed";

export function getHereApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setHereApiKey(key: string): void {
  try {
    if (key) {
      localStorage.setItem(STORAGE_KEY, key);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    window.dispatchEvent(new CustomEvent(HERE_KEY_CHANGED_EVENT));
  } catch {
    // ignore storage errors
  }
}
