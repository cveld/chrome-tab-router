import { IMessageType } from "../Shared/MessageModels";

class ChromeMessaging {
  messageHandlers = new Map<string, (request: IMessageType, sender: chrome.runtime.MessageSender, sendResponse?: any) => void>();

  constructor(name: string) {
    chrome.runtime.onMessage.addListener((request: IMessageType, sender, sendResponse) => {
      console.log('sender', sender);
      if (this.messageHandlers.has(request.type)) {
        return this.messageHandlers.get(request.type)!(request, sender, sendResponse);
      } else {
        sendResponse();
      }
    });
  }

  // Only to be used from content script or extension page script to background script
  sendMessage(message: IMessageType): Promise<any> {
    let resolveFunc: (value: any) => void;
    let rejectFunc;
    const promise = new Promise<any>((resolve, reject) => {
      resolveFunc = resolve;
      rejectFunc = reject;
    });
    chrome.runtime.sendMessage(message, (response: any) => {
      resolveFunc(response);
    });
    return promise;
  }
}

const chromeMessageHander = new ChromeMessaging('dummy');
export const messageHandlers = chromeMessageHander.messageHandlers;
export const sendMessage = chromeMessageHander.sendMessage;