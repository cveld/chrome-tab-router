import { sendMessage } from '../Messaging/ChromeMessaging';
import { eventHandlers, dispatchEventToPage, eventDispatchTargetId } from '../Messaging/DocumentEventing';
import { IMessageType } from '../Shared/MessageModels';

eventHandlers.set('groupcode', setGroupcodeHandler);

async function setGroupcodeHandler(message: IMessageType<any>) {
  const result = await sendMessage({ 
      type: 'groupcode',
      payload: message.payload
  });

  dispatchEventToPage({
    type: 'groupcode',
    payload: message.payload
  });
}

eventHandlers.set('getgroupcode', async () => {
  const result = await sendMessage({
    type: 'getgroupcode'
  });
  dispatchEventToPage({
    type: 'groupcode',
    payload: result
  });
});

console.log('contentgroupcodehandler loaded');
