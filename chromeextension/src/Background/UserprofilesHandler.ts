console.log('userprofileshandler-start');
import { BehaviorSubject } from 'rxjs';
export const userprofiles = new BehaviorSubject<IUserProfileStatus[]>([]);

import { listeners } from './chromestorage';
import { IUserProfileStatus } from '../Shared/UserprofileModels';

import { sendMessage as sendMessageToContentPage } from '../Messaging/ChromeMessaging';
import { ConnectionStatusEnum } from '../Shared/signalrModels';
import { chromeInstanceId } from './BackgroundChromeInstanceIdHandler';
import { connectionStatus } from './signalr';
import { sendSignalrMessage, addHandler, ISignalrMessage } from './signalrmessages';
import { BackgroundChromeMessagingWithPort } from '../Messaging/BackgroundChromeMessagingPort';
import { mergeScan } from 'rxjs/operators';
import { rules } from './rulesHandler';
import { IRule } from '../Shared/RuleModels';

addHandler('connected', message => {    
    addOrUpdate({
        chromeInstanceId: message.chromeinstanceid!,
        connectionId: message.connectionid!,
        lastSeen: Date.now()        
    })
    sendSignalrMessage({
        type: 'live'
    });
    sendSignalrMessage<Array<IUserProfileStatus>>({
        type: 'userprofiles',
        payload: userprofiles.value
    });
    sendSignalrMessage<Array<IRule>>({
        type: 'rules',
        payload: rules
    });
});

addHandler('live', message => {    
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
        const merged = newarr[index];
        merged.connectionId = userProfileStatus.connectionId;
        merged.lastSeen = userProfileStatus.lastSeen;        
    }
    chrome.storage.local.set({ 'userprofiles': newarr });  
}

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

popupmessaging.messageHandlers.set('userprofiles', (message, port) => {
    chrome.storage.local.set({
        'userprofiles': message.payload
    });
    sendSignalrMessage({
        type: 'userprofiles',
        payload: message.payload
    });
});

connectionStatus.subscribe(newConnectionStatus => {
    if (newConnectionStatus.status === ConnectionStatusEnum.connected) {
        sendSignalrMessage({
            type: 'connected'            
        });
    }
});


// Merge incoming signalr message
addHandler<Array<IUserProfileStatus>>('userprofiles', (message) => {
    const mergedMap = new Map<string, IUserProfileStatus>();  
    message.payload?.forEach(u => {
        mergedMap.set(u.chromeInstanceId!, u); 
    });
    let haschanges = false;
    userprofiles.value.forEach(u => {
        if (mergedMap.has(u.chromeInstanceId!)) {
            const found = mergedMap.get(u.chromeInstanceId!)!;            
            if (u?.updated && (!found.updated || found?.updated < u.updated)) {
                haschanges = true;
                found.name = u.name;
            }
        }
        else {
            haschanges = true;
            mergedMap.set(u.chromeInstanceId!, u);
        }        
    });

    const merged = Array.from(mergedMap, ([_, value]) => value);

    if (haschanges) {
        sendSignalrMessage({
            type: 'userprofiles',
            payload: merged
        });            
    }
    chrome.storage.local.set({
        'userprofiles': merged
    });
});

