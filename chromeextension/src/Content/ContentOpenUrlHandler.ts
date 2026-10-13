import { eventHandlers } from '../Messaging/DocumentEventing';
import type { IMessageType } from '../Shared/MessageModels';
import { sendToBackground } from './sendToBackground';

export interface IOpenUrlHerePayload {
  url: string;
}

// Lets the web app bridge page (see contentScriptMatches.ts - the only
// origin this content script runs on) ask for a url to be opened in THIS
// tab, bypassing routing entirely. The background identifies "this tab" via
// chrome.runtime.onMessage's sender.tab, so no tab id needs to travel
// through the page<->content-script event bridge at all.
async function openUrlHereHandler(message: IMessageType<IOpenUrlHerePayload>) {
  if (!message.payload?.url) {
    return;
  }
  await sendToBackground({ type: 'openUrlHere', payload: { url: message.payload.url } });
}

export function registerContentOpenUrlHandler() {
  eventHandlers.set('openUrlHere', openUrlHereHandler);
}
