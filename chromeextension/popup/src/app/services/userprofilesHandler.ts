import { Injectable, NgZone } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { IUserProfileStatus } from "../../../../src/Shared/UserprofileModels";
import { ScriptChromeMessagingWithPort } from "../../../../src/Messaging/ScriptChromeMessagingPort";

@Injectable({
    providedIn: 'root',
})
export class UserprofilesHandler {
    userprofiles = new BehaviorSubject<IUserProfileStatus[]>([]);
    messaging : ScriptChromeMessagingWithPort;
    constructor(private ngZone: NgZone) {
        this.messaging = ScriptChromeMessagingWithPort.getInstance('popup');
        this.messaging.messageHandlers.set('userprofiles', (message, port) => {
            ngZone.run(() => {
                this.userprofiles.next(message.payload);
            });
        });

        this.messaging.sendMessage({type: 'getuserprofiles'});
    }

    setUserprofiles(userprofiles: IUserProfileStatus[]) {
        this.messaging.sendMessage({
            type: 'userprofiles',
            payload: userprofiles
        });
        this.userprofiles.next(userprofiles);
    }

    updateUserprofile(userprofile: IUserProfileStatus) {
        const index = this.userprofiles.value.findIndex(u => u.chromeInstanceId === userprofile.chromeInstanceId);
        if (index === -1) {
            return;
        }
        userprofile.updated = Date.now();
        const userprofiles = this.userprofiles.value;
        userprofiles[index] = userprofile;
        this.setUserprofiles(userprofiles);
    }

    deleteUserprofile(userprofile: IUserProfileStatus) {
        const index = this.userprofiles.value.findIndex(u => u.chromeInstanceId === userprofile.chromeInstanceId);
        if (index === -1) {
            return;
        }
        const newUserprofile = this.userprofiles.value[index];
        newUserprofile.deleted = true;
        newUserprofile.updated = Date.now();
        this.setUserprofiles(this.userprofiles.value);
    }
}

