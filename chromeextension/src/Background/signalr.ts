import * as signalR from "@microsoft/signalr";
import axios from "axios";
import { BehaviorSubject } from "rxjs";
import { filter, tap } from "rxjs/operators";
import { IMessageType } from '../Shared/MessageModels';
import { ConnectionStatusEnum, IConnectionStatus } from "../Shared/signalrModels";
import { groupcode } from "./BackgroundGroupcodeHandler";
import { apiBaseUrl } from "./settings";

export const connectionStatus = new BehaviorSubject<IConnectionStatus>({ status: ConnectionStatusEnum.init });

export let connection : BehaviorSubject<signalR.HubConnection | null> = new BehaviorSubject<signalR.HubConnection | null>(null);

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
  newconnection.start()
    .then(() => {
      newconnection.connectionId
      connectionStatus.next({ 
        status: ConnectionStatusEnum.connected,
        connectionId: newconnection.connectionId
      })
    })
    .catch(err => {
        console.error(err);
        connectionStatus.next({ status: ConnectionStatusEnum.error, error: err })
    });

  newconnection.onclose(() => {
    console.log('disconnected');
    connectionStatus.next({ status: ConnectionStatusEnum.disconnected });
  });
  connection.next(newconnection);
});

import { BackgroundChromeMessagingWithPort } from '../Messaging/BackgroundChromeMessagingPort';
const backgroundChromeMessagingWithPort = BackgroundChromeMessagingWithPort.getInstance('popup');
connectionStatus.subscribe(newConnectionStatus => {
  backgroundChromeMessagingWithPort?.sendMessage({
    type: 'newConnectionStatus',
    payload: newConnectionStatus
  });
});
backgroundChromeMessagingWithPort!.messageHandlers.set('reconnect', () => {
  connection.value?.start();
});