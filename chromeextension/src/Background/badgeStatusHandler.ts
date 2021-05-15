import { map, mergeMap } from "rxjs/operators";
import { ConnectionStatusEnum } from "../Shared/signalrModels";
import { connection, connectionStatus } from "./signalr";
import { groupcode } from './BackgroundGroupcodeHandler';
import { messageStatus } from "./signalrmessages";
import { combineLatest, forkJoin } from "rxjs";
import { MessageStatusEnum } from "../Shared/MessageStatusModels";
function badgeStatusHandler() {

}
combineLatest([connectionStatus, groupcode, messageStatus]).pipe(map(value => {
    return {
        connectionStatus: value[0],
        groupcode: value[1],
        messageStatus: value[2]
    };
})).subscribe(value => {
    console.log('combineLatest', value);
    if (!value.groupcode.signature) {
        error('Groupcode not set');
        return;
    }
    if (value.messageStatus.status === MessageStatusEnum.error) {
        error(`Messages error: ${value.messageStatus.error}`);
        return;
    }
    if (value.connectionStatus.status !== ConnectionStatusEnum.connected) {
        error(`Connection error: ${value.connectionStatus.error}`);
        return;
    }
    ok();
});

function ok() {
    chrome.browserAction.setTitle({ title: 'Chrome tab router' });
    chrome.browserAction.setBadgeText({ 
        text: ""
    });
    chrome.browserAction.setBadgeBackgroundColor({
        color: "#44F"
    });
}

function error(text: string) {
    chrome.browserAction.setTitle({ title: text });
    chrome.browserAction.setBadgeText({ 
        text: "!"
    });
    chrome.browserAction.setBadgeBackgroundColor({
        color: "#F00"
    });
}
