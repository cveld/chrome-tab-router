import { Injectable, NgZone } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { ScriptChromeMessagingWithPort } from "../../../../src/Messaging/ScriptChromeMessagingPort";
import { ITabStatus } from "../../../../src/Shared/TabStatusModels";
@Injectable({
    providedIn: 'root',
})
export class LogHandler {
    log = new BehaviorSubject<ITabStatus[]>([]);
    constructor(private ngZone: NgZone) {
        const messaging = ScriptChromeMessagingWithPort.getInstance('popup');
        messaging.messageHandlers.set('log', (message, port) => {
            ngZone.run(() => {
                this.log.next(message.payload);
            });
        });

        messaging.sendMessage({type:'getlog'});
    }

}