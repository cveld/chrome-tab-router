export enum TabStatusEnum {
    undefined,
    Created = 'Created',
    Routing = 'Routing',
    Removed = 'Removed',
    Unmatched = 'Unmatched',
    Self = 'Self',
    Prompting = 'Prompting',
    Cancelled = 'Cancelled'
}
export interface ITabStatus {
    tabId: number,
    status: TabStatusEnum,
    url: string,
    targetUserprofile?: string
}
