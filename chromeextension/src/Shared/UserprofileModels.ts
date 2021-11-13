export interface IUserProfileStatus {
    name?: string,
    chromeInstanceId?: string,
    connectionId?: string,
    lastSeen?: number,   // datetime
    updated?: number,    // datetime
    deleted?: boolean
}
