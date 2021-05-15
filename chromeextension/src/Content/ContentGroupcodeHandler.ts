import { sendMessage } from '../Messaging/ChromeMessaging';
import { eventHandlers, dispatchEventToPage } from '../Messaging/DocumentEventing';

eventHandlers.set('groupcode', setGroupcodeHandler);

async function setGroupcodeHandler(...args: any) {
  const result = await sendMessage({ 
      type: 'groupcode',
      payload: args[0].payload
  });
  dispatchEventToPage({
    type: 'groupcode',
    payload: args[0].payload
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
