import { IMessageType } from "../Shared/MessageModels";

export class BackgroundChromeMessagingWithPort {
  messageHandlers = new Map<string, (message: IMessageType, port: chrome.runtime.Port) => void>();
  ports = new Set<chrome.runtime.Port>();

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
          console.log('port listener', message, port);
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
  sendMessage(message: IMessageType): void {
    console.log('sendmessage', this.ports);
    this.ports.forEach(port => port.postMessage(message));    
  }
}

const ports = new Map<string, BackgroundChromeMessagingWithPort>();

