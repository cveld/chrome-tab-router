import { BehaviorSubject, combineLatest } from 'rxjs';
import { ConnectionStatusEnum, type IConnectionStatus } from '../Shared/signalrModels';
import { localRelayUrl, type ILocalPairing } from '../Shared/SyncBackendModels';
import { createLogger } from '../Shared/logger';
import { connectionStatus } from './signalr';
import { localPairing, localPairingLoaded, syncBackend } from './syncBackendHandler';
import type { ISignalrMessage, ISyncTransport } from './transport';

const logger = createLogger('localsync');

// Wire contract with the relay in /localsync (src/protocol.ts).
const PROTOCOL = 'ctr-v1';
const SECRET_PROTOCOL_PREFIX = 'ctr-secret.';

/** The subset of WebSocket the transport uses; lets tests drive it without a network. */
export interface ISocketLike {
  onmessage: ((event: { data: unknown }) => void) | null;
  onclose: (() => void) | null;
  onerror: (() => void) | null;
  send(data: string): void;
  close(): void;
}

export type SocketFactory = (url: string, protocols: string[]) => ISocketLike;

// The cast only narrows the event types; WebSocket has everything ISocketLike lists.
const defaultSocketFactory: SocketFactory = (url, protocols) =>
  new WebSocket(url, protocols) as unknown as ISocketLike;

// Seconds before the next attempt after a failure. The relay is on this
// machine, so a first retry soon is cheap; later ones back off like the cloud.
const BACKOFF_SECONDS = [1, 5, 15, 30, 60];

// Chrome 116+ keeps the service worker alive while WebSocket traffic flows at
// least every ~30s: ping every 15s (the relay answers), give up after 30s of silence.
const PING_INTERVAL_MS = 15_000;
const SILENCE_LIMIT_MS = 30_000;

/**
 * Syncs through a relay running on this machine (see /localsync) instead of
 * the Azure hub. Reports into the same `connectionStatus` the cloud uses, so
 * the badge, Connection tab and router page work unchanged.
 */
export class LocalTransport implements ISyncTransport {
  readonly backend = 'local' as const;

  /** Set by signalrmessages.ts; receives every message another profile sent. */
  onMessage: (message: ISignalrMessage<unknown>) => void = () => undefined;

  private pairing: ILocalPairing | null = null;
  private socket: ISocketLike | null = null;
  private relayConnectionId: string | null = null;
  private attempt = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private lastActivity = 0;

  constructor(
    private readonly status: BehaviorSubject<IConnectionStatus>,
    private readonly createSocket: SocketFactory = defaultSocketFactory,
  ) {}

  get running(): boolean {
    return this.pairing !== null;
  }

  isPairedWith(pairing: ILocalPairing): boolean {
    return this.pairing?.port === pairing.port && this.pairing.secret === pairing.secret;
  }

  start(pairing: ILocalPairing) {
    this.stop();
    this.pairing = pairing;
    this.attempt = 0;
    this.connect();
  }

  /** Does not touch the status: the caller knows what should be shown instead. */
  stop() {
    this.clearTimers();
    this.dropSocket();
    this.pairing = null;
  }

  async send(message: ISignalrMessage<unknown>) {
    if (!this.socket || !this.relayConnectionId) {
      // Not connected: the connection status says so, and the state exchange
      // on (re)connect brings the other profiles up to date again.
      logger.debug('not connected, dropping', message.type);
      return { delivered: false };
    }
    this.socket.send(JSON.stringify(message));
    return { delivered: true };
  }

  canConnect() {
    return this.running;
  }

  connectionId() {
    return this.relayConnectionId;
  }

  reconnect() {
    if (!this.pairing) {
      return;
    }
    logger.info('manual reconnect requested');
    this.clearTimers();
    this.dropSocket();
    this.attempt = 0;
    this.connect();
  }

  reconnectIfDisconnected() {
    if (!this.pairing || this.status.value.status === ConnectionStatusEnum.connected) {
      return;
    }
    if (this.socket) {
      // An attempt is in flight.
      return;
    }
    this.clearTimers();
    this.connect(this.status.value.error);
  }

  private connect(retryError?: string) {
    const pairing = this.pairing;
    if (!pairing) {
      return;
    }
    const url = localRelayUrl(pairing.port);
    logger.info(`connecting to ${url}`);
    this.status.next({ status: ConnectionStatusEnum.connecting, error: retryError });

    const socket = this.createSocket(url, [PROTOCOL, SECRET_PROTOCOL_PREFIX + pairing.secret]);
    this.socket = socket;
    this.lastActivity = Date.now();
    socket.onmessage = event => {
      if (socket === this.socket) {
        this.lastActivity = Date.now();
        this.handleFrame(event.data);
      }
    };
    socket.onclose = () => {
      if (socket === this.socket) {
        this.handleClosed(url);
      }
    };
    // An error is always followed by a close event, which does the reporting.
    socket.onerror = () => undefined;
  }

  private handleFrame(raw: unknown) {
    let frame: { type?: unknown; connectionId?: unknown } & ISignalrMessage<unknown>;
    try {
      frame = JSON.parse(String(raw));
    } catch {
      logger.warn('ignoring a frame that is not JSON');
      return;
    }
    if (typeof frame?.type !== 'string') {
      return;
    }
    switch (frame.type) {
      case 'welcome':
        this.relayConnectionId = typeof frame.connectionId === 'string' ? frame.connectionId : null;
        this.attempt = 0;
        logger.info('connected', this.relayConnectionId);
        this.status.next({ status: ConnectionStatusEnum.connected, connectionId: this.relayConnectionId });
        this.startPinging();
        return;
      case 'pong':
        return;
      default:
        this.onMessage(frame);
    }
  }

  private handleClosed(url: string) {
    const wasConnected = this.relayConnectionId !== null;
    this.dropSocket();
    const error = wasConnected
      ? 'Disconnected'
      : `Cannot reach the local sync relay at ${url}. Is it running, and does the pairing code match it?`;
    logger.warn('connection closed:', error);
    this.status.next({
      status: wasConnected ? ConnectionStatusEnum.disconnected : ConnectionStatusEnum.error,
      error,
    });
    this.scheduleRetry(error);
  }

  private scheduleRetry(error: string) {
    const seconds = BACKOFF_SECONDS[Math.min(this.attempt, BACKOFF_SECONDS.length - 1)]!;
    this.attempt++;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.connect(error);
    }, seconds * 1000);
  }

  private startPinging() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
    }
    this.pingTimer = setInterval(() => {
      if (!this.socket) {
        return;
      }
      if (Date.now() - this.lastActivity > SILENCE_LIMIT_MS) {
        logger.warn('relay went silent, reconnecting');
        this.socket.close();
        return;
      }
      this.socket.send(JSON.stringify({ type: 'ping' }));
    }, PING_INTERVAL_MS);
  }

  private clearTimers() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  /** Detach first, so closing does not report a drop of a connection we chose to end. */
  private dropSocket() {
    const socket = this.socket;
    this.socket = null;
    this.relayConnectionId = null;
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    if (socket) {
      socket.onmessage = socket.onclose = socket.onerror = null;
      try {
        socket.close();
      } catch {
        // already closed
      }
    }
  }
}

export const localTransport = new LocalTransport(connectionStatus);

export function registerLocalSync() {
  // Must be registered before registerSignalr(): when the backend changes both
  // react, and the one that is stopping resets the status first so it cannot
  // overwrite the one that is starting.
  combineLatest([syncBackend, localPairing, localPairingLoaded]).subscribe(
    ([backend, pairing, loaded]) => {
      if (backend === null) {
        return;
      }
      if (backend === 'local') {
        if (!loaded) {
          return;
        }
        if (!pairing) {
          if (localTransport.running) {
            localTransport.stop();
          }
          connectionStatus.next({ status: ConnectionStatusEnum.init });
        } else if (!localTransport.isPairedWith(pairing)) {
          localTransport.start(pairing);
        }
        return;
      }
      if (localTransport.running) {
        localTransport.stop();
        connectionStatus.next({ status: ConnectionStatusEnum.init });
      }
    },
  );
}
