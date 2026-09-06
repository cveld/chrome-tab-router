import { sendMessage } from '../Messaging/ChromeMessaging';
import { eventHandlers, dispatchEventToPage } from '../Messaging/DocumentEventing';

async function getchromeinstanceidHandler(...args: any) {
  const result = await sendMessage({ type: 'getchromeinstanceid' });
  dispatchEventToPage({
    type: 'chromeinstanceid',
    payload: result
  });
}

export function registerContentChromeInstanceIdHandler() {
  eventHandlers.set('getchromeinstanceid', getchromeinstanceidHandler);
}
