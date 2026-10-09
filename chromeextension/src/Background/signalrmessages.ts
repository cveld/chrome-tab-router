import { BehaviorSubject } from 'rxjs';
import { chromeInstanceId } from './BackgroundChromeInstanceIdHandler';
import { connection } from './signalr';
import { localTransport } from './localsync';
import { syncBackend } from './syncBackendHandler';
import { activeTransport, type ISignalrMessage } from './transport';
import { MessageStatusEnum } from '../Shared/MessageStatusModels';
import type { IMessageStatus } from '../Shared/MessageStatusModels';
import { createLogger } from '../Shared/logger';

export type { ISignalrMessage };

const logger = createLogger('messages');

export const messageStatus = new BehaviorSubject<IMessageStatus>({ status: MessageStatusEnum.init });

export async function sendSignalrMessage<T>(message: ISignalrMessage<T>) {
  const transport = activeTransport();
  if (!transport) {
    return;
  }
  logger.debug('send', message.type);
  try {
    const result = await transport.send({
      ...message,
      chromeinstanceid: chromeInstanceId.value,
      connectionid: transport.connectionId() ?? undefined
    });
    if (result.delivered) {
      messageStatus.next({ status: MessageStatusEnum.success });
    }
    return result.data;
  }
  catch (err) {
    logger.error(`send ${message.type} failed:`, err);
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

  // The local relay delivers every message through one callback instead of
  // per-type subscriptions on a hub connection.
  localTransport.onMessage = message => {
    const handler = handlers.get(message.type);
    if (handler) {
      filterself(handler)(message);
    }
  };

  // An error from one backend says nothing about the other.
  syncBackend.subscribe(() => messageStatus.next({ status: MessageStatusEnum.init }));
}

function filterself(func: (message: ISignalrMessage<any>) => void) {
  return (message: ISignalrMessage<any>) => {
    if (message.chromeinstanceid === chromeInstanceId.value) {
      // skip self
      return;
    }
    logger.debug('received', message.type, 'from', message.chromeinstanceid);
    func(message);
  };
}
