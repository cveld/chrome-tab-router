import * as signalR from "@microsoft/signalr";
import axios from "axios";
import { BehaviorSubject } from "rxjs";
import { connect, filter, tap } from "rxjs/operators";
import { IMessageType } from '../Shared/MessageModels';
import { ConnectionStatusEnum, IConnectionStatus } from "../Shared/signalrModels";
import { groupcode } from "./BackgroundGroupcodeHandler";
import { apiBaseUrl } from "./settings";

export const connectionStatus = new BehaviorSubject<IConnectionStatus>({ status: ConnectionStatusEnum.init });

export let connection : BehaviorSubject<signalR.HubConnection | null> = new BehaviorSubject<signalR.HubConnection | null>(null);

function connectionstart(connection: signalR.HubConnection) {
  connection.start()
  .then(() => {    
    connectionStatus.next({ 
      status: ConnectionStatusEnum.connected,
      connectionId: connection.connectionId
    })
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
    })
  })
  .catch(err => {
      console.error(err);
      connectionStatus.next({ status: ConnectionStatusEnum.error, error: err })
  });
}

groupcode.pipe(filter(val => Object.keys(val).length !== 0)).subscribe(newgroupcode => {
  const groupcodeAuthorization = newgroupcode.signature!;

  if (connection.value != null) {
    connection.value.stop();
    // potential memory leak. How to clean up the former connection properly?        
  }

  const newconnection = new signalR.HubConnectionBuilder()
    .withUrl(`${apiBaseUrl}/api`, { headers: {
      groupcode: newgroupcode.clientprincipalname!.groupcode!,
      groupcodeauthorization: newgroupcode.signature!
    }})
    .configureLogging(signalR.LogLevel.Information)
    .build();

  console.log('Connecting...');
  connectionstart(newconnection);

  newconnection.onclose(() => {
    console.log('disconnected');
    connectionStatus.next({ status: ConnectionStatusEnum.disconnected, error: 'Disconnected' });
    runConnect();
  });
  connection.next(newconnection);
});

import { BackgroundChromeMessagingWithPort } from '../Messaging/BackgroundChromeMessagingPort';
import { HubConnectionState } from "@microsoft/signalr";
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
  }
  else {
    connectionstart(connection.value);
  }
});

const backoffschedule = [0, 5, 15, 30, 60];
let backoffIndex = 0;
const backoffreset = 60*5*1000; // 5 minutes
let disconnectBackoff = 0;

let timeoutfunc : NodeJS.Timeout;
function runConnect() {
  const currenttimestamp = Date.now();
  console.log('runConnect', currenttimestamp, disconnectBackoff, disconnectBackoff - currenttimestamp);
  if (disconnectBackoff < currenttimestamp) {  
    if (disconnectBackoff + backoffreset < currenttimestamp) {
      backoffIndex = 0;
    }
    else {
      backoffIndex++;
    }
    disconnectBackoff = currenttimestamp + backoffschedule[Math.min(backoffIndex, backoffschedule.length-1)]*1000;
    connectionstart(connection.value!);
    clearTimeout(timeoutfunc);
  }
  else {
    timeoutfunc = setTimeout(runConnect, disconnectBackoff - currenttimestamp);
  }
}