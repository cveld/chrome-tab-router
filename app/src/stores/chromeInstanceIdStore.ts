// The extension's per-install instance id, requested over the bridge so the
// page can prove the extension is present and show which profile is connected.
import { createStore } from '../lib/stores';
import {
  backgroundErrorStore,
  contentScriptReadyStore,
  dispatchEventToContentScript,
  ensureDocumentEventing,
  eventHandlers,
} from '../messaging/documentEventing';

ensureDocumentEventing();

export const chromeInstanceIdStore = createStore<string>('');

eventHandlers.set('chromeinstanceid', event => {
  chromeInstanceIdStore.set(typeof event.payload === 'string' ? event.payload : '');
  // Any real answer proves the background is alive again.
  backgroundErrorStore.set('');
});

function requestChromeInstanceId(): void {
  dispatchEventToContentScript({ type: 'getchromeinstanceid' });
}

contentScriptReadyStore.subscribe(() => {
  requestChromeInstanceId();
});
