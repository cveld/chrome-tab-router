import type { IMessageType } from "../Shared/MessageModels";

type ICallback<T> = (request: IMessageType<T>, sender: chrome.runtime.MessageSender, sendResponse?: any) => void;
type ICallbackAny = ICallback<any>;

export const messageHandlers = new Map<string, ICallbackAny>();

export function setHandler<T>(action: string, callback: ICallback<T>) {
  messageHandlers.set(action, callback);
}

// Only to be used from content script or extension page script to background script.
// Rejects with chrome.runtime.lastError, e.g. "Could not establish connection.
// Receiving end does not exist." when the service worker is not running.
export function sendMessage<T>(message: IMessageType<T>): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response: any) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
      } else {
        resolve(response);
      }
    });
  });
}

// MV3 note: this must be called synchronously from an entrypoint's main() —
// see entrypoints/background.ts / entrypoints/content.ts — so the listener
// is attached before Chrome delivers the message that woke this context.
export function registerChromeMessaging() {
  chrome.runtime.onMessage.addListener((request: IMessageType<any>, sender, sendResponse) => {
    if (messageHandlers.has(request.type)) {
      return messageHandlers.get(request.type)!(request, sender, sendResponse);
    } else {
      sendResponse();
    }
  });
}
