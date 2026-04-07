const STORAGE_KEY = "ors_api_key";
export const ORS_KEY_CHANGED_EVENT = "ors-api-key-changed";

export function getOrsApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setOrsApiKey(key: string): void {
  try {
    if (key) {
      localStorage.setItem(STORAGE_KEY, key);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    window.dispatchEvent(new CustomEvent(ORS_KEY_CHANGED_EVENT));
  } catch {
    // ignore storage errors
  }
}
