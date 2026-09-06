import { sendMessage } from '../Messaging/ChromeMessaging';
import { eventHandlers, dispatchEventToPage } from '../Messaging/DocumentEventing';
import type { IMessageType } from '../Shared/MessageModels';

async function setGroupcodeHandler(message: IMessageType<any>) {
  await sendMessage({
    type: 'groupcode',
    payload: message.payload
  });

  dispatchEventToPage({
    type: 'groupcode',
    payload: message.payload
  });
}

async function getGroupcodeHandler() {
  const result = await sendMessage({
    type: 'getgroupcode'
  });
  dispatchEventToPage({
    type: 'groupcode',
    payload: result
  });
}

export function registerContentGroupcodeHandler() {
  eventHandlers.set('groupcode', setGroupcodeHandler);
  eventHandlers.set('getgroupcode', getGroupcodeHandler);
}
