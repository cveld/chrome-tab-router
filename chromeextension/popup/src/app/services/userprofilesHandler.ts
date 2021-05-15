import { Injectable, NgZone } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { IUserProfileStatus } from "../../../../src/Shared/UserprofileModels";
import { ScriptChromeMessagingWithPort } from "../../../../src/Messaging/ScriptChromeMessagingPort";

@Injectable({
    providedIn: 'root',
})
export class UserprofilesHandler {
    userprofiles = new BehaviorSubject<IUserProfileStatus[]>([]);
    constructor(private ngZone: NgZone) {
        const messaging = ScriptChromeMessagingWithPort.getInstance('popup');
        messaging.messageHandlers.set('userprofiles', (message, port) => {
            ngZone.run(() => {
                this.userprofiles.next(message.payload);
            });
        });

        messaging.sendMessage({type:'getuserprofiles'});
    }
}

