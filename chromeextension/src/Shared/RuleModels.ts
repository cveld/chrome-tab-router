export interface IRule {
    regex?: RegExp|string,
    targetUserprofile?: string,
    id?: string,
    updated?: number,
    deleted?: boolean
}