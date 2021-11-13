import { IMessageType } from "../Shared/MessageModels";

type ICallback<T> = (request: IMessageType<T>, sender: chrome.runtime.MessageSender, sendResponse?: any) => void;
type ICallbackAny = ICallback<any>;

class ChromeMessaging {
  messageHandlers = new Map<string, ICallbackAny>();

  constructor(name: string) {
    chrome.runtime.onMessage.addListener((request: IMessageType<any>, sender, sendResponse) => {
      console.log('sender', sender);
      if (this.messageHandlers.has(request.type)) {
        return this.messageHandlers.get(request.type)!(request, sender, sendResponse);
      } else {
        sendResponse();
      }
    });
  }

  setHandler<T>(action: string, callback: ICallback<T>) {
    this.messageHandlers.set(action, callback);
  }

  // Only to be used from content script or extension page script to background script
  sendMessage<T>(message: IMessageType<T>): Promise<any> {
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
export const setHandler = chromeMessageHander.setHandler;
export const sendMessage = chromeMessageHander.sendMessage;