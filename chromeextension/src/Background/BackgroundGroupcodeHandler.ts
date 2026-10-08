import { BehaviorSubject } from 'rxjs';
import { messageHandlers, setHandler } from '../Messaging/ChromeMessaging';
import type { IMessageType } from '../Shared/MessageModels';
import { BackgroundChromeMessagingWithPort } from '../Messaging/BackgroundChromeMessagingPort';
import { listeners } from './chromestorage';
import { createLogger } from '../Shared/logger';

const logger = createLogger('groupcode');

interface IGroupcode {
  clientprincipalname?: {
    groupcode: string
  },
  signature?: string,
  encoded?: string
}
export const groupcode = new BehaviorSubject<IGroupcode>({});
/**
 * `groupcode` starts out empty until the first (async) storage read finishes, so
 * "no group code" is only meaningful once this is true.
 */
export const groupcodeLoaded = new BehaviorSubject<boolean>(false);

function setGroupcodeHandler(request: IMessageType<any>, sender: chrome.runtime.MessageSender, sendResponse: any) {
  const newgroupcode = request.payload;
  chrome.storage.local.set({ 'groupcode': newgroupcode });
  sendResponse();
}

export function registerBackgroundGroupcodeHandler() {
  // the chrome storage contains the base64-wrapped version;
  // the BehaviorSubject contains the decoded version
  chrome.storage.local.get<{ groupcode?: { encoded: string } }>('groupcode', value => {
    try {
      if (!value || Object.keys(value).length == 0) {
        // the groupcode is undefined; i.e. not yet stored in the chrome local storage. Skip it
        return;
      }
      const groupcodestring = atob(value.groupcode!.encoded);
      const groupcodevalue = JSON.parse(groupcodestring);
      groupcodevalue.encoded = value.groupcode!.encoded;
      groupcode.next(groupcodevalue);
    } finally {
      groupcodeLoaded.next(true);
    }
  });

  listeners.set('groupcode', (oldValue: IGroupcode | null, newValue: IGroupcode) => {
    const groupcodestring = atob(newValue.encoded!);
    const groupcodevalue: IGroupcode = JSON.parse(groupcodestring);
    groupcodevalue.encoded = newValue.encoded;
    groupcode.next(groupcodevalue);
    logger.info('group code changed');
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
