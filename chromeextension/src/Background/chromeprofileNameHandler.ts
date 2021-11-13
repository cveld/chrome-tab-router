console.log('chromeprofile');
import { combineLatest } from "rxjs";
import { map } from "rxjs/operators";
import { chromeInstanceId } from "./BackgroundChromeInstanceIdHandler";
import { userprofiles } from "./userprofilesHandler";

export let name: string | undefined;
combineLatest([chromeInstanceId, userprofiles]).pipe(map(value => {
    return {
        chromeInstanceId: value[0],
        userprofiles: value[1]
    }
})).subscribe(c => {
    const userprofile = userprofiles.value.find(v => v.chromeInstanceId === c.chromeInstanceId);
    if (userprofile) {
        name = userprofile.name;
    }
});
