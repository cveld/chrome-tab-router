import { registerChromeMessaging } from '../src/Messaging/ChromeMessaging';
import { registerDocumentEventing, dispatchEventToPage } from '../src/Messaging/DocumentEventing';
import { registerContentChromeInstanceIdHandler } from '../src/Content/ContentChromeInstanceIdHandler';
import { registerContentGroupcodeHandler } from '../src/Content/ContentGroupcodeHandler';

export default defineContentScript({
  // No port here: WXT's dev-mode content-script reload logic validates match
  // patterns more strictly than Chrome's own manifest parser and rejects a
  // port in the host. Dropping it also means this still matches if the
  // Angular dev server ends up on a different port than 4200.
  matches: ['http://localhost/*', 'https://*.azurestaticapps.net/*'],
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
      console.log('Content script disconnected from runtime');
    });

    dispatchEventToPage({ type: 'contentscriptready' });
  },
});
