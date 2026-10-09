import { BackgroundChromeMessagingWithPort } from '../Messaging/BackgroundChromeMessagingPort';
import type { SyncBackend } from '../Shared/SyncBackendModels';
import { cloudTransport } from './cloudTransport';
import { localTransport } from './localsync';
import { syncBackend } from './syncBackendHandler';

export interface ISignalrMessage<T> {
  type: string,
  chromeinstanceid?: string,
  connectionid?: string
  payload?: T
}

export interface ISendResult {
  /** False when there was nothing to send to (not paired, not connected); not an error. */
  delivered: boolean;
  data?: unknown;
}

/**
 * How messages travel to the other profiles. Incoming messages are not part of
 * the interface: each transport feeds them to the handlers registered through
 * addHandler() in signalrmessages.ts. The connection state is reported through
 * the shared `connectionStatus` subject.
 */
export interface ISyncTransport {
  readonly backend: SyncBackend;
  /** Rejects when the message could not be sent although it should have been. */
  send(message: ISignalrMessage<unknown>): Promise<ISendResult>;
  /** Whether there is anything to connect to yet (a groupcode, a pairing); the watchdog skips the rest. */
  canConnect(): boolean;
  connectionId(): string | null | undefined;
  /** Manual reconnect from the options page. */
  reconnect(): void;
  /** Watchdog backstop: start a new attempt if the connection is not healthy. */
  reconnectIfDisconnected(): void;
}

/** The transport of the selected backend; undefined until the choice has been read from storage. */
export function activeTransport(): ISyncTransport | undefined {
  switch (syncBackend.value) {
    case 'cloud':
      return cloudTransport;
    case 'local':
      return localTransport;
    default:
      return undefined;
  }
}

export function registerTransport() {
  BackgroundChromeMessagingWithPort.getInstance('popup').messageHandlers.set('reconnect', () => {
    activeTransport()?.reconnect();
  });
}
