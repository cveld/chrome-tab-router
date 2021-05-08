import { BehaviorSubject } from 'rxjs';

const eventListenerId = 'chrome-tab-router-content';
const eventDispatchTargetId = 'chrome-tab-router-page';

document.addEventListener(eventListenerId, (customEvent) => {
  const event = (customEvent as CustomEvent).detail as IEventType;
  if (eventHandlers.has(event.type)) {
    const func = eventHandlers.get(event.type);
    func!(event);
  }
});

interface IEventType {
  type: string;
  payload?: any;
}

export const eventHandlers : Map<string, (...args: any[]) => any> = new Map();

//const MessageHandlers : Map<>= {}

export function dispatchEventToPage(event: IEventType) {
  const myevent = new CustomEvent(eventDispatchTargetId, {      
    detail: event
  });
  document.dispatchEvent(myevent);
}

export const pageReady : BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
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


console.log('documenteventing loaded');