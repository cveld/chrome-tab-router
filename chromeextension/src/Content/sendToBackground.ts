import { sendMessage } from '../Messaging/ChromeMessaging';
import { dispatchEventToPage } from '../Messaging/DocumentEventing';
import type { IMessageType } from '../Shared/MessageModels';

/**
 * sendMessage() for content-script handlers that answer the page. When the
 * background service worker is unreachable the page gets a
 * 'backgroundunreachable' event with the error instead of an empty answer, so
 * it can tell "extension found but not working" apart from "no data yet".
 */
export async function sendToBackground<T>(
  message: IMessageType<T>,
): Promise<{ ok: true; response: any } | { ok: false }> {
  try {
    return { ok: true, response: await sendMessage(message) };
  } catch (error) {
    dispatchEventToPage({
      type: 'backgroundunreachable',
      payload: { error: error instanceof Error ? error.message : String(error) },
    });
    return { ok: false };
  }
}
