export interface IMessageType<T> {
    type: string;
    payload?: T;
}

// Sent by the interstitial router page to the background script.
export interface IRouteTabRequest {
    url: string;
    tabId: number;
    targetUserprofile?: string;
}
