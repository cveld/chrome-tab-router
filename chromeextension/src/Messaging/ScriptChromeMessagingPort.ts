/// <reference types="chrome"/>
import { IMessageType } from "../Shared/MessageModels";

const ports = new Map<string, ScriptChromeMessagingWithPort>();

export class ScriptChromeMessagingWithPort {
  messageHandlers = new Map<string, (message: IMessageType, port: chrome.runtime.Port) => void>();
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

  sendMessage(message: IMessageType): void {
    let resolveFunc: (value: any) => void;
    let rejectFunc;
    const promise = new Promise<any>((resolve, reject) => {
      resolveFunc = resolve;
      rejectFunc = reject;
    });
    this.port.postMessage(message);    
  }
}

