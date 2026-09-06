// Window-event bridge between this page and the extension's content script.
//
// Contract (must stay in sync with chromeextension/src/Messaging/DocumentEventing.ts):
// - page -> content script: CustomEvent "chrome-tab-router-content" on document
// - content script -> page: CustomEvent "chrome-tab-router-page" on document
// - detail is { type, payload }
// - handshake: page pings; the content script answers with pong or
//   contentscriptready, after which the page may issue get* requests.

import { createStore } from '../lib/stores';

const eventListenerId = 'chrome-tab-router-page';
const eventDispatchTargetId = 'chrome-tab-router-content';

export interface IEventType {
  type: string;
  payload?: unknown;
}

type EventHandler = (event: IEventType) => void;

export const eventHandlers = new Map<string, EventHandler>();

export function dispatchEventToContentScript(event: IEventType): void {
  document.dispatchEvent(new CustomEvent(eventDispatchTargetId, { detail: event }));
}

export const contentScriptReadyStore = createStore<boolean>(false);

let initialized = false;

/** Attach the document listener and start the handshake. Idempotent (HMR-safe). */
export function ensureDocumentEventing(): void {
  if (initialized) {
    return;
  }
  initialized = true;

  document.addEventListener(eventListenerId, customEvent => {
    const event = (customEvent as CustomEvent<IEventType>).detail;
    if (!event) {
      return;
    }
    eventHandlers.get(event.type)?.(event);
  });

  function setContentScriptReady() {
    if (!contentScriptReadyStore.get()) {
      contentScriptReadyStore.set(true);
    }
  }

  eventHandlers.set('ping', () => {
    setContentScriptReady();
    dispatchEventToContentScript({ type: 'pong' });
  });
  eventHandlers.set('pong', () => setContentScriptReady());
  eventHandlers.set('contentscriptready', () => setContentScriptReady());

  // Kick off the handshake; if the content script loaded before us it will
  // answer pong, otherwise it pings/announces contentscriptready itself.
  dispatchEventToContentScript({ type: 'ping' });
}
