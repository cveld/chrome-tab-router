import { BehaviorSubject } from 'rxjs';
import { ScriptChromeMessagingWithPort } from '../Messaging/ScriptChromeMessagingPort';
import { ConnectionStatusEnum, IConnectionStatus } from '../Shared/signalrModels';

export const connectionStatus$ = new BehaviorSubject<IConnectionStatus>({ status: ConnectionStatusEnum.init });

const scriptChromeMessagingWithPort = ScriptChromeMessagingWithPort.getInstance('popup');
scriptChromeMessagingWithPort.messageHandlers.set('signalrconnection', (message, port) => {
    console.log('popup script signalrconnection', message, port);
    connectionStatus$.next(message.payload);
});

export function reconnect() {
    scriptChromeMessagingWithPort.sendMessage({
        type: 'reconnect'
    });
}

console.log('popupSignalrConnectionHandler loaded');