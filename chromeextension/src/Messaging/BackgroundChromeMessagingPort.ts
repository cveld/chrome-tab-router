import type { IMessageType } from "../Shared/MessageModels";

type ICallback<T> = (message: IMessageType<T>, port: chrome.runtime.Port) => void;
type ICallbackAny = (message: IMessageType<any>, port: chrome.runtime.Port) => void;

const ports = new Map<string, BackgroundChromeMessagingWithPort>();

export class BackgroundChromeMessagingWithPort {
  messageHandlers = new Map<string, ICallbackAny>();
  ports = new Set<chrome.runtime.Port>();

  // Note: getInstance() itself calls chrome.runtime.onConnect.addListener via
  // the constructor below, so — same rule as everywhere else in Background/*
  // — only call this from a register() function invoked from an entrypoint's
  // main(), never at a module's own top level.
  static getInstance(name: string): BackgroundChromeMessagingWithPort {
    if (ports.has(name)) {
      return ports.get(name)!;
    }
    const instance = new BackgroundChromeMessagingWithPort(name);
    ports.set(name, instance);
    return instance;
  }

  private constructor(name: string) {
    chrome.runtime.onConnect.addListener(port => {
      if (port.name === name) {
        this.ports.add(port);
        port.onMessage.addListener((message, port) => {
          if (this.messageHandlers.has(message.type)) {
            return this.messageHandlers.get(message.type)!(message, port);
          }
        });
        port.onDisconnect.addListener((port) => {
          this.ports.delete(port);
        });
      }
    });
  }

  // TODO: we should implement a narrow port specific request response pattern. for now the response gets broadcasted to all open ports
  sendMessage(message: IMessageType<any>): void {
    this.ports.forEach(port => port.postMessage(message));
  }
}
