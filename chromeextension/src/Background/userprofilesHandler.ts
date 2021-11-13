console.log('userprofileshandler-start');
import { BehaviorSubject } from 'rxjs';
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
import { mergeUserprofiles } from './userprofileHandlerUtility';

export const userprofiles = new BehaviorSubject<IUserProfileStatus[]>([]);

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
        merged.deleted = false;    
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
    // consume add, updated, removed userprofiles
    // ensure current userprofile is not deleted
    const result = mergeUserprofiles(chromeInstanceId.value, userprofiles.value, message.payload);

    if (result.haschanges) {
        sendSignalrMessage({
            type: 'userprofiles',
            payload: result.merged
        });            
    }
    chrome.storage.local.set({
        'userprofiles': result.merged
    });
});

