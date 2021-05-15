import { Injectable, NgZone, OnInit } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { ScriptChromeMessagingWithPort } from "../../../../src/Messaging/ScriptChromeMessagingPort";

@Injectable({
    providedIn: 'root',
})
export class GroupcodeHandler {
    constructor(private ngZone: NgZone) {
        const messaging = ScriptChromeMessagingWithPort.getInstance('popup');
        messaging.messageHandlers.set('groupcode', (message, port) => {
            ngZone.run(() => {
                this.groupcode.next(message.payload.encoded);
            });
        });
        messaging.sendMessage({
            type: 'getgroupcode'    
        });                
    }
    groupcode : BehaviorSubject<string>  = new BehaviorSubject<string>('');      
}  