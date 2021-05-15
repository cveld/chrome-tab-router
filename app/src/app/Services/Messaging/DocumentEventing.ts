import { CompileShallowModuleMetadata } from "@angular/compiler";
import { BehaviorSubject } from "rxjs";
import { Subject } from "rxjs";

const eventListenerId = 'chrome-tab-router-page';
const eventDispatchTargetId = 'chrome-tab-router-content';


export interface IEventType {
  type: string;
  payload?: any;
}

export const eventHandlers : Map<string, (...args: any) => any> = new Map();

//const MessageHandlers : Map<>= {}

export function dispatchEventToContentScript(event: IEventType) {
  const myevent = new CustomEvent(eventDispatchTargetId, {      
    detail: event
  });
  document.dispatchEvent(myevent);
}

export const contentScriptReady : BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

eventHandlers.set('ping', (...args: any) => {  
  dispatchEventToContentScript({
    type: 'pong'
  });
});

eventHandlers.set('pong', (...args: any) => {  
  if (!contentScriptReady.getValue()) {
    contentScriptReady.next(true);
  }
});

eventHandlers.set('contentscriptready', (...args: any) => {
  if (!contentScriptReady.getValue()) {
    contentScriptReady.next(true);
  }
});

export function init() {
  return () => {
    document.addEventListener(eventListenerId, (customEvent) => {
      const event = (customEvent as CustomEvent).detail as IEventType;
      if (eventHandlers.has(event.type)) {
        const func = eventHandlers.get(event.type);
        func!(event);
      }
    });

    dispatchEventToContentScript({ type: 'ping' });
  }
}