import * as signalR from '@microsoft/signalr';
import { HubConnectionState } from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ConnectionStatusEnum } from '../Shared/signalrModels';
import type { IConnectionStatus } from '../Shared/signalrModels';
import { groupcode } from './BackgroundGroupcodeHandler';
import { apiBaseUrl } from './settings';
import { BackgroundChromeMessagingWithPort } from '../Messaging/BackgroundChromeMessagingPort';

export const connectionStatus = new BehaviorSubject<IConnectionStatus>({ status: ConnectionStatusEnum.init });

export let connection: BehaviorSubject<signalR.HubConnection | null> = new BehaviorSubject<signalR.HubConnection | null>(null);

function connectionstart(connection: signalR.HubConnection) {
  if (connection.state === HubConnectionState.Connected) {
    console.warn('Signalr connection already connected');
    return;
  }
  connection.start()
    .then(() => {
      connectionStatus.next({
        status: ConnectionStatusEnum.connected,
        connectionId: connection.connectionId
      });
    })
    .catch(err => {
      console.error(err);
      connectionStatus.next({ status: ConnectionStatusEnum.error, error: err });
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
      console.error(err);
      connectionStatus.next({ status: ConnectionStatusEnum.error, error: err });
    });
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
  const currenttimestamp = Date.now();
  console.log('runConnect', currenttimestamp, disconnectBackoff, disconnectBackoff - currenttimestamp);
  if (disconnectBackoff < currenttimestamp) {
    if (disconnectBackoff + backoffreset < currenttimestamp) {
      backoffIndex = 0;
    } else {
      backoffIndex++;
    }
    disconnectBackoff = currenttimestamp + backoffschedule[Math.min(backoffIndex, backoffschedule.length - 1)]! * 1000;
    connectionstart(connection.value!);
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
  groupcode.pipe(filter(val => Object.keys(val).length !== 0)).subscribe(newgroupcode => {
    if (timeoutfunc) {
      clearTimeout(timeoutfunc);
    }
    if (connection.value != null) {
      connection.value.stop();
      // potential memory leak. How to clean up the former connection properly?
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

    console.log('Connecting...');
    connectionstart(newconnection);

    newconnection.onclose((error) => {
      console.log('disconnected', error, newconnection);
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
  backgroundChromeMessagingWithPort.messageHandlers.set('reconnect', () => {
    if (!connection.value) {
      return;
    }
    if (connection.value.state === HubConnectionState.Connected) {
      connectionstop(connection.value);
    } else {
      connectionstart(connection.value);
    }
  });
}
