import { eventHandlers, dispatchEventToPage } from '../Messaging/DocumentEventing';
import { sendToBackground } from './sendToBackground';

async function getchromeinstanceidHandler(...args: any) {
  const result = await sendToBackground({ type: 'getchromeinstanceid' });
  if (!result.ok) {
    return;
  }
  dispatchEventToPage({
    type: 'chromeinstanceid',
    payload: result.response
  });
}

export function registerContentChromeInstanceIdHandler() {
  eventHandlers.set('getchromeinstanceid', getchromeinstanceidHandler);
}
