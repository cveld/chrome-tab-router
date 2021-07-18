import { Injectable, NgZone, OnInit } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { ScriptChromeMessagingWithPort } from "../../../../src/Messaging/ScriptChromeMessagingPort";

@Injectable({
    providedIn: 'root',
})
export class GroupcodeHandler {
    private messaging: ScriptChromeMessagingWithPort;
    constructor(private ngZone: NgZone) {
        this.messaging = ScriptChromeMessagingWithPort.getInstance('popup');
        this.messaging.messageHandlers.set('groupcode', (message, port) => {
            ngZone.run(() => {
                this.groupcode.next(message.payload.encoded);
            });
        });
        this.messaging.sendMessage({
            type: 'getgroupcode'    
        });                
    }
    groupcode : BehaviorSubject<string>  = new BehaviorSubject<string>('');   
    setGroupcode(groupcode: string) {
        this.messaging.sendMessage({
            type:'groupcode',
            payload: {
                encoded: groupcode
            }
        });
    }
}  