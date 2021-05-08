import { sendMessage as sendMessageToContentPage } from '../Messaging/ChromeMessaging';
import { chromeInstanceId } from './BackgroundChromeInstanceIdHandler';
import { connectionStatus, ConnectionStatusEnum } from './signalr';
import { sendSignalrMessage, addHandler } from './signalrmessages';

connectionStatus.subscribe(newConnectionStatus => {
    if (newConnectionStatus.status === ConnectionStatusEnum.connected) {
        sendSignalrMessage({
            type: 'connected'
        });
    }
});

addHandler('connected', message => {
    console.log(`connected received in chromeprofile ${chromeInstanceId.value}`, message);
});