import { BehaviorSubject } from 'rxjs';
import { contentScriptReady, dispatchEventToContentScript, eventHandlers } from './Messaging/DocumentEventing';

eventHandlers.set('chromeinstanceid', (...args: any[]) => {
  chromeInstanceId.next(args[0]);
});

export const chromeInstanceId : BehaviorSubject<string>  = new BehaviorSubject<string>('');

contentScriptReady.subscribe(value => {
  if (value) {
    dispatchEventToContentScript({ type: 'getchromeinstanceid' });
  }
});
