import { BehaviorSubject, ReplaySubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { IMessageType, messageHandlers, sendMessage } from '../Messaging/ChromeMessaging';

export const chromeInstanceId = new BehaviorSubject<string>('');

(<any>chrome).instanceID.getID((...args: any[]) => {
  console.log('instanceID', args);
  const instanceID = args[0];  
  chromeInstanceId.next(instanceID);  
  chromeInstanceId.complete();
});

function getchromeinstanceidHandler(request: IMessageType, sender: chrome.runtime.MessageSender, sendResponse: any) {  
  chromeInstanceId.pipe(filter(v => v !== '')).subscribe(instanceID => {
    sendResponse(instanceID);
  });
}

messageHandlers.set('getchromeinstanceid', getchromeinstanceidHandler);

console.log('backgroundchromeinstanceidhandler loaded');