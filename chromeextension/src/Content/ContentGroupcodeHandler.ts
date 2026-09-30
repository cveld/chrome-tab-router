import { eventHandlers, dispatchEventToPage } from '../Messaging/DocumentEventing';
import type { IMessageType } from '../Shared/MessageModels';
import { sendToBackground } from './sendToBackground';

async function setGroupcodeHandler(message: IMessageType<any>) {
  const result = await sendToBackground({
    type: 'groupcode',
    payload: message.payload
  });
  // Only echo the group code back once the background has actually stored it.
  if (!result.ok) {
    return;
  }

  dispatchEventToPage({
    type: 'groupcode',
    payload: message.payload
  });
}

async function getGroupcodeHandler() {
  const result = await sendToBackground({
    type: 'getgroupcode'
  });
  if (!result.ok) {
    return;
  }
  dispatchEventToPage({
    type: 'groupcode',
    payload: result.response
  });
}

export function registerContentGroupcodeHandler() {
  eventHandlers.set('groupcode', setGroupcodeHandler);
  eventHandlers.set('getgroupcode', getGroupcodeHandler);
}
