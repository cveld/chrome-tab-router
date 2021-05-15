import { listeners } from './chromestorage';
import { IUserProfileStatus } from '../Shared/UserprofileModels';
import { BehaviorSubject } from 'rxjs';
import { sendMessage as sendMessageToContentPage } from '../Messaging/ChromeMessaging';
import { ConnectionStatusEnum } from '../Shared/signalrModels';
import { chromeInstanceId } from './BackgroundChromeInstanceIdHandler';
import { connectionStatus } from './signalr';
import { sendSignalrMessage, addHandler } from './signalrmessages';
import { BackgroundChromeMessagingWithPort } from '../Messaging/BackgroundChromeMessagingPort';

connectionStatus.subscribe(newConnectionStatus => {
    if (newConnectionStatus.status === ConnectionStatusEnum.connected) {
        sendSignalrMessage({
            type: 'connected'
        });
    }
});

addHandler('connected', message => {
    console.log(`connected received in chromeprofile ${chromeInstanceId.value}`, message);
    addOrUpdate({
        chromeInstanceId: message.chromeinstanceid!,
        connectionId: message.connectionid!,
        lastSeen: Date.now()
    })
    sendSignalrMessage({
        type: 'live'
    })
});

addHandler('live', message => {
    console.log(`live received in chromeprofile ${chromeInstanceId.value}`, message);
    addOrUpdate({
        chromeInstanceId: message.chromeinstanceid!,
        connectionId: message.connectionid!,
        lastSeen: Date.now()
    });
});

function addOrUpdate(userProfileStatus: IUserProfileStatus) {
    const index = userprofiles.value.findIndex(a => a.chromeInstanceId == userProfileStatus.chromeInstanceId);
    const newarr = userprofiles.value;
    if (index === -1) {
        newarr.push(userProfileStatus);                
    } else {
        newarr[index] = userProfileStatus;
    }
    chrome.storage.local.set({ 'userprofiles': newarr });  
}

export const userprofiles = new BehaviorSubject<IUserProfileStatus[]>([]);
chrome.storage.local.get('userprofiles', value => {   
    if (!value.userprofiles) {
        // skip undefined values
        return;
    }
    userprofiles.next(value.userprofiles);
});
listeners.set('userprofiles', (oldValue, newValue) => {
    userprofiles.next(newValue);
    console.log(`new userprofiles value: ${newValue}`);
});

const popupmessaging = BackgroundChromeMessagingWithPort.getInstance('popup');
userprofiles.subscribe(next => {
    popupmessaging.sendMessage({
        type: 'userprofiles',
        payload: next
      });
});
popupmessaging.messageHandlers.set('getuserprofiles', (message, port) => {
    popupmessaging.sendMessage({
        type: 'userprofiles',
        payload: userprofiles.value
      });
});