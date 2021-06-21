import { Injectable, NgZone, OnInit } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { ScriptChromeMessagingWithPort } from "../../../../src/Messaging/ScriptChromeMessagingPort";

@Injectable({
    providedIn: 'root',
})
export class ChromeinstanceidHandler {
    private messaging: ScriptChromeMessagingWithPort;
    constructor(private ngZone: NgZone) {
        this.messaging = ScriptChromeMessagingWithPort.getInstance('popup');
        this.messaging.messageHandlers.set('chromeinstanceid', (message, port) => {
            ngZone.run(() => {
                this.chromeinstanceid.next(message.payload);
            });
        });
        this.messaging.sendMessage({
            type: 'getchromeinstanceid'    
        });                
    }
    chromeinstanceid: BehaviorSubject<string>  = new BehaviorSubject<string>('');   
}  