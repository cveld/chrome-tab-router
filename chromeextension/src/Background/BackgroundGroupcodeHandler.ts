import { BehaviorSubject } from 'rxjs';
import { messageHandlers, setHandler } from '../Messaging/ChromeMessaging';
import type { IMessageType } from '../Shared/MessageModels';
import { BackgroundChromeMessagingWithPort } from '../Messaging/BackgroundChromeMessagingPort';
import { listeners } from './chromestorage';

interface IGroupcode {
  clientprincipalname?: {
    groupcode: string
  },
  signature?: string,
  encoded?: string
}
export const groupcode = new BehaviorSubject<IGroupcode>({});

function setGroupcodeHandler(request: IMessageType<any>, sender: chrome.runtime.MessageSender, sendResponse: any) {
  const newgroupcode = request.payload;
  chrome.storage.local.set({ 'groupcode': newgroupcode });
  sendResponse();
}

export function registerBackgroundGroupcodeHandler() {
  // the chrome storage contains the base64-wrapped version;
  // the BehaviorSubject contains the decoded version
  chrome.storage.local.get<{ groupcode?: { encoded: string } }>('groupcode', value => {
    if (!value || Object.keys(value).length == 0) {
      // the groupcode is undefined; i.e. not yet stored in the chrome local storage. Skip it
      return;
    }
    const groupcodestring = atob(value.groupcode!.encoded);
    const groupcodevalue = JSON.parse(groupcodestring);
    groupcodevalue.encoded = value.groupcode!.encoded;
    groupcode.next(groupcodevalue);
  });

  listeners.set('groupcode', (oldValue: IGroupcode | null, newValue: IGroupcode) => {
    const groupcodestring = atob(newValue.encoded!);
    const groupcodevalue: IGroupcode = JSON.parse(groupcodestring);
    groupcodevalue.encoded = newValue.encoded;
    groupcode.next(groupcodevalue);
    console.log(`new groupcode value: ${groupcodevalue}`);
  });

  setHandler('groupcode', setGroupcodeHandler);

  const popupmessaging = BackgroundChromeMessagingWithPort.getInstance('popup');

  popupmessaging.messageHandlers.set('groupcode', (message, port) => {
    chrome.storage.local.set({ 'groupcode': message.payload });
  });

  groupcode.subscribe(next => {
    popupmessaging.sendMessage({
      type: 'groupcode',
      payload: next
    });
  });

  popupmessaging.messageHandlers.set('getgroupcode', (message, port) => {
    popupmessaging.sendMessage({
      type: 'groupcode',
      payload: { encoded: groupcode.value.encoded }
    });
  });

  messageHandlers.set('getgroupcode', (request, sender, sendResponse) => {
    sendResponse(groupcode.value);
  });
}
