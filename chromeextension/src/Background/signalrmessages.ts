import axios from 'axios';
import { BehaviorSubject } from 'rxjs';
import { chromeInstanceId } from './BackgroundChromeInstanceIdHandler';
import { groupcode } from './BackgroundGroupcodeHandler';
import { apiBaseUrl } from './settings';
import { connection } from './signalr';
import { MessageStatusEnum } from '../Shared/MessageStatusModels';
import type { IMessageStatus } from '../Shared/MessageStatusModels';

export const messageStatus = new BehaviorSubject<IMessageStatus>({ status: MessageStatusEnum.init });

export interface ISignalrMessage<T> {
  type: string,
  chromeinstanceid?: string,
  connectionid?: string
  payload?: T
}

export async function sendSignalrMessage<T>(message: ISignalrMessage<T>) {
  if (!groupcode.value.signature) {
    return;
  }
  const groupcodeAuthorization = groupcode.value.signature;
  try {
    const result = await axios.post(`${apiBaseUrl}/api/messages`, {
      ...message,
      chromeinstanceid: chromeInstanceId.value,
      connectionid: connection.value?.connectionId
    }, {
      headers: {
        groupcodeauthorization: groupcodeAuthorization
      }
    });
    messageStatus.next({ status: MessageStatusEnum.success });
    return result.data;
  }
  catch (err) {
    console.log(err);
    messageStatus.next({
      status: MessageStatusEnum.error,
      error: `Cannot send message: ${err}`
    });
  }
}

const handlers = new Map<string, (message: ISignalrMessage<any>) => void>();

// Safe to call from any register() regardless of whether a connection
// already exists yet — registerSignalrMessages()'s connection.subscribe
// below re-attaches every entry in `handlers` to each new connection as it
// is created.
export function addHandler<T>(type: string, handler: (message: ISignalrMessage<T>) => void) {
  handlers.set(type, handler);
  connection.value?.on(type, filterself(handler));
}

export function registerSignalrMessages() {
  connection.subscribe(newconnection => {
    if (newconnection) {
      handlers.forEach((value, key) => {
        newconnection.on(key, filterself(value));
      });
    }
  });
}

function filterself(func: (message: ISignalrMessage<any>) => void) {
  return (message: ISignalrMessage<any>) => {
    if (message.chromeinstanceid === chromeInstanceId.value) {
      // skip self
      return;
    }
    func(message);
  };
}
