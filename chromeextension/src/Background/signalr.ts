import * as signalR from '@microsoft/signalr';
import { HubConnectionState } from '@microsoft/signalr';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ConnectionStatusEnum } from '../Shared/signalrModels';
import type { IConnectionStatus } from '../Shared/signalrModels';
import type { SyncBackend } from '../Shared/SyncBackendModels';
import { groupcode } from './BackgroundGroupcodeHandler';
import { syncBackend } from './syncBackendHandler';
import { apiBaseUrl } from './settings';
import { BackgroundChromeMessagingWithPort } from '../Messaging/BackgroundChromeMessagingPort';
import { createLogger } from '../Shared/logger';

const logger = createLogger('signalr');

export const connectionStatus = new BehaviorSubject<IConnectionStatus>({ status: ConnectionStatusEnum.init });

export let connection: BehaviorSubject<signalR.HubConnection | null> = new BehaviorSubject<signalR.HubConnection | null>(null);

/**
 * @param retryError error of the failed attempt this one retries; kept on the
 * connecting status so the UI keeps showing the failure instead of a fresh
 * "Connecting…" on every backoff round.
 */
function connectionstart(connection: signalR.HubConnection, retryError?: string) {
  if (connection.state === HubConnectionState.Connected) {
    logger.warn('Signalr connection already connected');
    return;
  }
  // The watchdog can fire while an attempt is in flight; start() would then
  // reject with "not in the 'Disconnected' state" and flash a bogus error.
  if (connection.state !== HubConnectionState.Disconnected) {
    logger.debug('attempt already in flight, skipping', connection.state);
    return;
  }
  connectionStatus.next({ status: ConnectionStatusEnum.connecting, error: retryError });
  connection.start()
    .then(() => {
      logger.info('connected', connection.connectionId);
      connectionStatus.next({
        status: ConnectionStatusEnum.connected,
        connectionId: connection.connectionId
      });
    })
    .catch(err => {
      logger.error('connect failed:', err);
      // Stringify: the status is posted to extension pages, and an Error
      // object arrives there as {}, which React cannot render.
      connectionStatus.next({ status: ConnectionStatusEnum.error, error: String(err) });
      runConnect();
    });
}

function connectionstop(connection: signalR.HubConnection) {
  connection.stop()
    .then(() => {
      connectionStatus.next({
        status: ConnectionStatusEnum.disconnected
      });
    })
    .catch(err => {
      logger.error('stop failed:', err);
      connectionStatus.next({ status: ConnectionStatusEnum.error, error: String(err) });
    });
}

/** Manual reconnect from the options page: drop a live connection, or start a dead one. */
export function reconnectCloud() {
  logger.info('manual reconnect requested');
  if (!connection.value) {
    return;
  }
  if (connection.value.state === HubConnectionState.Connected) {
    connectionstop(connection.value);
  } else {
    connectionstart(connection.value);
  }
}

const backoffschedule = [0, 5, 15, 30, 60];
let backoffIndex = 0;
const backoffreset = 60 * 5 * 1000; // 5 minutes
let disconnectBackoff = 0;

let timeoutfunc: ReturnType<typeof setTimeout> | null = null;
function runConnect() {
  if (timeoutfunc) {
    clearTimeout(timeoutfunc);
  }
  timeoutfunc = null;
  if (!connection.value) {
    // The sync backend was switched away from the cloud while an attempt was in flight.
    return;
  }
  const currenttimestamp = Date.now();
  logger.debug('runConnect', { backoffIndex, waitMs: Math.max(0, disconnectBackoff - currenttimestamp) });
  if (disconnectBackoff < currenttimestamp) {
    if (disconnectBackoff + backoffreset < currenttimestamp) {
      backoffIndex = 0;
    } else {
      backoffIndex++;
    }
    disconnectBackoff = currenttimestamp + backoffschedule[Math.min(backoffIndex, backoffschedule.length - 1)]! * 1000;
    connectionstart(connection.value!, connectionStatus.value.error);
  } else {
    timeoutfunc = setTimeout(runConnect, disconnectBackoff - currenttimestamp);
  }
}

// Called by watchdogAlarm.ts as a defense-in-depth backstop.
export function reconnectIfDisconnected() {
  if (!connection.value) {
    return;
  }
  if (connectionStatus.value.status !== ConnectionStatusEnum.connected) {
    runConnect();
  }
}

export function registerSignalr() {
  // The hub connection only exists while the cloud backend is selected; the
  // local relay (localsync.ts) reports into the same connectionStatus.
  combineLatest([
    groupcode.pipe(filter(val => Object.keys(val).length !== 0)),
    syncBackend.pipe(filter((backend): backend is SyncBackend => backend !== null)),
  ]).subscribe(([newgroupcode, backend]) => {
    if (timeoutfunc) {
      clearTimeout(timeoutfunc);
    }
    if (connection.value != null) {
      // Detach first so the old connection's onclose is not mistaken for a drop of the current one.
      const former = connection.value;
      connection.next(null);
      former.stop();
      // potential memory leak. How to clean up the former connection properly?
    }
    if (backend !== 'cloud') {
      return;
    }

    const newconnection = new signalR.HubConnectionBuilder()
      .withUrl(`${apiBaseUrl}/api`, {
        headers: {
          groupcode: newgroupcode.clientprincipalname!.groupcode!,
          groupcodeauthorization: newgroupcode.signature!
        }
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Made explicit (rather than relying implicitly on the server's default)
    // because Chrome 116+ only keeps the background service worker alive
    // while WebSocket traffic keeps flowing at least every ~30s; 15s gives a
    // comfortable safety margin either direction.
    newconnection.keepAliveIntervalInMilliseconds = 15000;
    newconnection.serverTimeoutInMilliseconds = 30000;

    logger.info(`connecting to ${apiBaseUrl}/api`);
    connectionstart(newconnection);

    newconnection.onclose((error) => {
      logger.warn('disconnected', error ?? '');
      // Only reconnect if this is the latest signalr connection:
      if (newconnection === connection.value) {
        connectionStatus.next({ status: ConnectionStatusEnum.disconnected, error: 'Disconnected' });
        runConnect();
      }
    });
    connection.next(newconnection);
  });

  const backgroundChromeMessagingWithPort = BackgroundChromeMessagingWithPort.getInstance('popup');
  connectionStatus.subscribe(newConnectionStatus => {
    backgroundChromeMessagingWithPort?.sendMessage({
      type: 'ConnectionStatus',
      payload: newConnectionStatus
    });
  });
  backgroundChromeMessagingWithPort.messageHandlers.set('getconnectionstatus', (message, port) => {
    backgroundChromeMessagingWithPort.sendMessage({
      type: 'ConnectionStatus',
      payload: connectionStatus.value
    });
  });
  // The 'reconnect' message is handled by transport.ts, which picks the active backend.
}
