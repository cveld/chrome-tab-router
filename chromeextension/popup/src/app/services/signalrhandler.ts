import { Injectable, NgZone } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { ScriptChromeMessagingWithPort } from "../../../../src/Messaging/ScriptChromeMessagingPort";
import { ConnectionStatusEnum, IConnectionStatus } from "../../../../src/Shared/signalrModels";
@Injectable({
    providedIn: 'root',
})
export class signalrHandler {
    connectionStatus = new BehaviorSubject<IConnectionStatus>({ status: ConnectionStatusEnum.init });    
    private messaging = ScriptChromeMessagingWithPort.getInstance('popup');
    constructor(ngZone: NgZone) {
        this.messaging.messageHandlers.set('ConnectionStatus', (message, port) => {
            ngZone.run(() => this.connectionStatus.next(message.payload));
        });
        this.messaging.sendMessage({type:'getconnectionstatus'});
    }
    reconnect() {        
        this.messaging.sendMessage({type:'reconnect'});
    }
}