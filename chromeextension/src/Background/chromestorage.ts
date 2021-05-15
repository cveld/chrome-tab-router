//export const listeners = new Map<string, (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => void>();
export const listeners = new Map<string, (oldValue: any, newValue: any) => void>();

chrome.storage.onChanged.addListener((changes, areaName) => {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        if (listeners.has(key)) {
            listeners.get(key)!(oldValue, newValue);
        }
        console.log(
            `Storage key "${key}" in namespace "${areaName}" changed.`,
            `Old value was "${JSON.stringify(oldValue)}", new value is "${JSON.stringify(newValue)}".`
        );
    }
});