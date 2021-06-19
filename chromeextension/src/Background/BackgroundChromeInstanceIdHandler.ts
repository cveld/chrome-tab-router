import { BehaviorSubject, ReplaySubject } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { messageHandlers, sendMessage } from '../Messaging/ChromeMessaging';
import { IMessageType } from '../Shared/MessageModels';
import { BackgroundChromeMessagingWithPort } from '../Messaging/BackgroundChromeMessagingPort';

export const chromeInstanceId = new BehaviorSubject<string>('');

(<any>chrome).instanceID.getID((...args: any[]) => {  
  const instanceID = args[0];  
  chromeInstanceId.next(instanceID);  
});

function getchromeinstanceidHandler(request: IMessageType, sender: chrome.runtime.MessageSender, sendResponse: any) {  
  chromeInstanceId.pipe(filter(v => v !== ''), take(1)).subscribe(instanceID => {    
    sendResponse(instanceID);
  });
  return true;
}

messageHandlers.set('getchromeinstanceid', getchromeinstanceidHandler);

const popupmessaging = BackgroundChromeMessagingWithPort.getInstance('popup');
popupmessaging.messageHandlers.set('getchromeinstanceid', (message, port) => {
  port.postMessage({
    type: 'chromeinstanceid',
    payload: chromeInstanceId.value
  });
});