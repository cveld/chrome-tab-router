import axios from "axios";
import { BehaviorSubject } from "rxjs";
import { chromeInstanceId } from "./BackgroundChromeInstanceIdHandler";
import { groupcode } from "./BackgroundGroupcodeHandler";
import { apiBaseUrl } from "./settings";
import { connection } from './signalr';

export const enum MessageStatusEnum {
    undefined,
    success,
    error,
    init
}
interface IMessageStatus {
status: MessageStatusEnum,
error?: string
}
export const messageStatus = new BehaviorSubject<IMessageStatus>({ status: MessageStatusEnum.init });
    
interface ISignalrMessage {
    type: string,
    payload?: any
}

export async function sendSignalrMessage(message: ISignalrMessage) {  
    const groupcodeAuthorization = groupcode.value.signature!;
    try {
      const result = await axios.post(`${apiBaseUrl}/api/messages`, {
        chromeinstanceid: chromeInstanceId.value,
        connectionid: connection.value?.connectionId,
        message: message
      }, {
        headers: {
          groupcodeauthorization: groupcodeAuthorization
        }
      });
      messageStatus.next({ status: MessageStatusEnum.success });
      return result.data;
    }
    catch(err) {
      console.log(err);
      messageStatus.next({
        status: MessageStatusEnum.error,
        error: `Cannot send message: ${err}`
      });
    };
}

const handlers = new Map<string, (message: ISignalrMessage) => void>();

export function addHandler(type: string, handler: (message: ISignalrMessage) => void) {
    handlers.set(type, handler);
    connection.value?.on(type, handler);
}

connection.subscribe(newconnection => {
    if (newconnection) {
        handlers.forEach((value, key) => {
            newconnection.on(key, value);
        });
    }
});  