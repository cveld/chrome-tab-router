import { BehaviorSubject } from 'rxjs';

export const eventListenerId = 'chrome-tab-router-content';
export const eventDispatchTargetId = 'chrome-tab-router-page';

interface IEventType {
  type: string;
  payload?: any;
}

export const eventHandlers: Map<string, (...args: any[]) => any> = new Map();

export function dispatchEventToPage(event: IEventType) {
  const myevent = new CustomEvent(eventDispatchTargetId, {
    detail: event
  });
  document.dispatchEvent(myevent);
}

export const pageReady: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

// MV3/WXT note: content script entrypoints may only run code inside their
// main() — see entrypoints/content.ts — so this file has no top-level
// document.addEventListener/dispatch calls; register() does that instead.
export function registerDocumentEventing() {
  document.addEventListener(eventListenerId, (customEvent) => {
    const event = (customEvent as CustomEvent).detail as IEventType;
    if (eventHandlers.has(event.type)) {
      const func = eventHandlers.get(event.type);
      func!(event, customEvent.type);
    }
  });

  eventHandlers.set('ping', (...args: any[]) => {
    if (!pageReady.getValue()) {
      pageReady.next(true);
    }
    dispatchEventToPage({ type: 'pong' });
  });
  eventHandlers.set('pong', (...args: any[]) => {
    if (!pageReady.getValue()) {
      pageReady.next(true);
    }
  });
  dispatchEventToPage({ type: 'ping' });
}
