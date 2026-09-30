import { registerChromeMessaging } from '../src/Messaging/ChromeMessaging';
import { registerDocumentEventing, dispatchEventToPage } from '../src/Messaging/DocumentEventing';
import { registerContentChromeInstanceIdHandler } from '../src/Content/ContentChromeInstanceIdHandler';
import { registerContentGroupcodeHandler } from '../src/Content/ContentGroupcodeHandler';
import { contentScriptMatches } from '../src/Shared/contentScriptMatches';

export default defineContentScript({
  // Only the web app's own origin for this build (see contentScriptMatches).
  matches: contentScriptMatches(
    import.meta.env.WXT_CONFIG_URL,
    import.meta.env.WXT_CONTENT_SCRIPT_EXTRA_URLS,
  ),
  main() {
    registerChromeMessaging();
    registerDocumentEventing();
    registerContentChromeInstanceIdHandler();
    registerContentGroupcodeHandler();

    chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
      if (msg.color) {
        document.body.style.backgroundColor = msg.color;
        sendResponse('Change color to ' + msg.color);
      } else {
        sendResponse('Color message is none.');
      }
    });

    // Legacy workaround from the MV2 background page for a Chrome bug where
    // chrome.runtime.connect() from a content script would otherwise fail
    // with "Could not establish connection. Receiving end does not exist."
    // Kept defensively; see entrypoints/background.ts.
    const port = chrome.runtime.connect();
    port.onDisconnect.addListener(function () {
      // Reading lastError silences "Unchecked runtime.lastError" when the
      // service worker is not running; the page learns about that through
      // 'backgroundunreachable' instead.
      console.log('Content script disconnected from runtime', chrome.runtime.lastError?.message ?? '');
    });

    dispatchEventToPage({ type: 'contentscriptready' });
  },
});
