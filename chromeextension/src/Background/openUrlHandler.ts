import { setHandler } from '../Messaging/ChromeMessaging';
import type { IMessageType } from '../Shared/MessageModels';
import type { IOpenUrlHerePayload } from '../Content/ContentOpenUrlHandler';
import { createLogger } from '../Shared/logger';

const logger = createLogger('openUrlHere');

// Answers the 'openUrlHere' message the web app bridge's content script
// forwards (src/Content/ContentOpenUrlHandler.ts): swap THIS tab - the one
// the content script, and so the message's sender, lives in - to the
// requested url. chrome.tabs.update() on an already-existing tab never
// raises chrome.tabs.onCreated, so this bypasses tabUpdateHandler.ts's
// routing without any special-casing there; only the bridge page's own url
// (not this tab's eventual destination) needs that exemption - see
// isBridgeUrl() in Shared/contentScriptMatches.ts.
export function registerOpenUrlHandler(): void {
  setHandler<IOpenUrlHerePayload>('openUrlHere', (message: IMessageType<IOpenUrlHerePayload>, sender, sendResponse) => {
    const tabId = sender.tab?.id;
    const url = message.payload?.url;
    if (!tabId || !url) {
      logger.warn('rejected openUrlHere: missing tab id or url', url ?? '(no url)');
      sendResponse?.({ ok: false, error: 'missing tab id or url' });
      return;
    }

    chrome.tabs.update(tabId, { url }, tab => {
      if (chrome.runtime.lastError || !tab) {
        logger.warn('failed to open url', url, chrome.runtime.lastError?.message ?? '(no tab)');
        sendResponse?.({ ok: false, error: chrome.runtime.lastError?.message ?? 'tab not found' });
        return;
      }
      logger.debug('opened url requested via bridge', url, tabId);
      sendResponse?.({ ok: true });
    });
    return true; // keep the message channel open for the async sendResponse above
  });
}
