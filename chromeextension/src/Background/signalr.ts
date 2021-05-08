import * as signalR from "@microsoft/signalr";
import axios from "axios";
import { BehaviorSubject } from "rxjs";
import { filter, tap } from "rxjs/operators";
import { IMessageType } from "../Messaging/ChromeMessaging";
import { groupcode } from "./BackgroundGroupcodeHandler";
import { apiBaseUrl } from "./settings";

export const enum ConnectionStatusEnum {
  undefined,
  connected,
  disconnected,
  error,
  init
}
interface IConnectionStatus {
    status: ConnectionStatusEnum,
    error?: string,
    connectionId?: string | null
};
export const connectionStatus = new BehaviorSubject<IConnectionStatus>({ status: ConnectionStatusEnum.init });
connectionStatus.subscribe(value => {
    if (value.status !== ConnectionStatusEnum.connected) {
        chrome.browserAction.setTitle({ title: 'websocket connection error' });
        chrome.browserAction.setBadgeText({ 
            text: "!"
        });
        chrome.browserAction.setBadgeBackgroundColor({
            color: "#F00"
        });
    } else {
        chrome.browserAction.setTitle({ title: 'Chrome tab router' });
        chrome.browserAction.setBadgeText({ 
            text: ""
        });
        chrome.browserAction.setBadgeBackgroundColor({
            color: "#44F"
        });
    }    
});

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

