import { sendMessage } from '../Messaging/ChromeMessaging';
import { eventHandlers, dispatchEventToPage } from '../Messaging/DocumentEventing';

eventHandlers.set('getchromeinstanceid', getchromeinstanceidHandler);

async function getchromeinstanceidHandler(...args: any) {
  const result = await sendMessage({ type: 'getchromeinstanceid' });
  dispatchEventToPage({
    type: 'chromeinstanceid',
    payload: result
  });
}

console.log('chromeinstanceidhandler loaded');
