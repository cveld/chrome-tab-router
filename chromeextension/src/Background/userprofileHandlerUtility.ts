import { IUserProfileStatus } from "../Shared/UserprofileModels";

export function mergeUserprofiles(currentProfileId: string, existingUserprofiles: IUserProfileStatus[], incomingUserprofiles: IUserProfileStatus[]|undefined) {
    const mergedMap = new Map<string, IUserProfileStatus>();  
    let haschanges = false;

    const threeMonthsAgo = Date.now() - (3 * 30 * 24 * 60 * 60 * 1000);
    incomingUserprofiles?.forEach(u => {
        let skip = false;
        if (!u.updated) { 
            // ensure the updated datetime is set for deleted records
            u.updated = Date.now();
        }
        if (u.deleted) {
            if (u.chromeInstanceId === currentProfileId) {
                // ensure current userprofile is not deleted:
                haschanges = true;
                u.deleted = false;
                u.updated = Date.now();
            } else {                
                if (u.updated < threeMonthsAgo) {
                    // skip old deleted records
                    skip = true;
                }
            }   
        }

        if (!skip) { 
            mergedMap.set(u.chromeInstanceId!, u); 
        }
    });
    
    existingUserprofiles.forEach(u => {
        // ensure updated property is set for existing records:
        if (!u.updated) {
            u.updated = Date.now();
        }
        // ensure deleted record is fresh:
        if (!u.deleted || u.updated > threeMonthsAgo) {
            if (mergedMap.has(u.chromeInstanceId!)) {
                const found = mergedMap.get(u.chromeInstanceId!)!;            
                if (u?.updated && (!found.updated || found.updated < u.updated)) {
                    haschanges = true;
                    found.name = u.name;
                    if (u.chromeInstanceId !== currentProfileId) {
                        found.deleted = u.deleted;
                    }        
                }
            }
            else {                
                haschanges = true;
                mergedMap.set(u.chromeInstanceId!, u);
            }        
        }
    });

    const merged = Array.from(mergedMap, ([_, value]) => value);

    return {haschanges, merged};
}