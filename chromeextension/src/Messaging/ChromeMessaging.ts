export interface IMessageType {
  type: string;
  payload?: any;
}

export const messageHandlers = new Map<string, (request: IMessageType, sender: chrome.runtime.MessageSender, sendResponse?: any) => void>();

chrome.runtime.onMessage.addListener((request: IMessageType, sender, sendResponse) => {
  if (messageHandlers.has(request.type)) {
    messageHandlers.get(request.type)!(request, sender, sendResponse);
  }
});

export function sendMessage(message: IMessageType): Promise<any> {
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

//const MessageHandlers : Map<>= {}