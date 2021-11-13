/// <reference types="chrome"/>
import { IMessageType } from "../Shared/MessageModels";

const ports = new Map<string, ScriptChromeMessagingWithPort>();

type ICallback<T> = (message: IMessageType<T>, port: chrome.runtime.Port) => void;
type ICallbackAny = (message: IMessageType<any>, port: chrome.runtime.Port) => void;
export class ScriptChromeMessagingWithPort {
  messageHandlers = new Map<string, ICallbackAny>();
  port: chrome.runtime.Port;
  static getInstance(name: string): ScriptChromeMessagingWithPort {
    if (ports.has(name)) {
      return ports.get(name)!;
    }
    const instance = new ScriptChromeMessagingWithPort(name);
    ports.set(name, instance);
    return instance;
  }
  private constructor(name: string) {
    this.port = chrome.runtime.connect({
      name: name
    });
    
    this.port.onMessage.addListener((message, port) => {
      console.log('port listener', message, port);
      if (this.messageHandlers.has(message.type)) {            
        return this.messageHandlers.get(message.type)!(message, port);
      }
    });
  }

  setHandler<T>(action: string, callback: ICallback<T>) {
    this.messageHandlers.set(action, callback);
  }
  
  sendMessage<T>(message: IMessageType<T>): void {
    let resolveFunc: (value: any) => void;
    let rejectFunc;
    const promise = new Promise<any>((resolve, reject) => {
      resolveFunc = resolve;
      rejectFunc = reject;
    });
    this.port.postMessage(message);    
  }
}

