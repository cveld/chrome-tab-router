export const listeners = new Map<string, (oldValue: any, newValue: any) => void>();

export function registerChromeStorageListener() {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
      if (listeners.has(key)) {
        listeners.get(key)!(oldValue, newValue);
      }
    }
  });
}
