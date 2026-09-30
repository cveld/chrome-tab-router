// Adds a "Development" item to the extension icon's context menu that opens
// dev.html, the hub for dev-only tools. Non-production builds only: the
// contextMenus permission and the dev pages are left out of production builds
// (see DEV_ENTRYPOINTS in wxt.config.ts).
const MENU_ID = 'development';

export function registerDevMenuHandler() {
  if (import.meta.env.MODE === 'production') {
    return;
  }

  // Context menu items persist across service worker restarts, so they are
  // (re)created on install/update/reload only. removeAll() avoids a
  // duplicate-id error when the item survived from a previous build.
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: MENU_ID,
        title: 'Development',
        contexts: ['action'],
      });
    });
  });

  chrome.contextMenus.onClicked.addListener(info => {
    if (info.menuItemId === MENU_ID) {
      chrome.tabs.create({ url: chrome.runtime.getURL('/dev.html') });
    }
  });
}
