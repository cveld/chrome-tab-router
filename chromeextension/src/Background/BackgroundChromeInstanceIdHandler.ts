import { BehaviorSubject } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { messageHandlers } from '../Messaging/ChromeMessaging';
import type { IMessageType } from '../Shared/MessageModels';
import { BackgroundChromeMessagingWithPort } from '../Messaging/BackgroundChromeMessagingPort';
import { v4 as uuidv4 } from 'uuid';

export const chromeInstanceId = new BehaviorSubject<string>('');

/* originally we pulled the chrome profile instance from a privileged sdk:
(<any>chrome).instanceID.getID((...args: any[]) => {
  const instanceID = args[0];
  chromeInstanceId.next(instanceID);
});
*/

function getchromeinstanceidHandler(request: IMessageType<any>, sender: chrome.runtime.MessageSender, sendResponse: any) {
  chromeInstanceId.pipe(filter(v => v !== ''), take(1)).subscribe(instanceID => {
    sendResponse(instanceID);
  });
  return true;
}

export function registerBackgroundChromeInstanceIdHandler() {
  chrome.storage.local.get<{ instanceid?: string }>('instanceid', value => {
    if (!value || Object.keys(value).length == 0) {
      // the instanceid is undefined; i.e. not yet stored in the chrome local storage.
      // This is the opportunity to generate a unique id:
      const instanceID = uuidv4();
      chrome.storage.local.set({ 'instanceid': instanceID });
      chromeInstanceId.next(instanceID);
    } else {
      chromeInstanceId.next(value.instanceid!);
    }
  });

  messageHandlers.set('getchromeinstanceid', getchromeinstanceidHandler);

  const popupmessaging = BackgroundChromeMessagingWithPort.getInstance('popup');
  popupmessaging.messageHandlers.set('getchromeinstanceid', (message, port) => {
    port.postMessage({
      type: 'chromeinstanceid',
      payload: chromeInstanceId.value
    });
  });
}
