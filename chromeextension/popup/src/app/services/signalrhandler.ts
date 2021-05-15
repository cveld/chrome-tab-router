import { Injectable } from "@angular/core";
import { ScriptChromeMessagingWithPort } from "../../../../src/Messaging/ScriptChromeMessagingPort";

@Injectable({
    providedIn: 'root',
})
export class signalrHandler {
    reconnect() {
        const messaging = ScriptChromeMessagingWithPort.getInstance('popup');
        messaging.sendMessage({type:'reconnect'});
    }
}