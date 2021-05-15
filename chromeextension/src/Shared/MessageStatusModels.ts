export const enum MessageStatusEnum {
    undefined = 'undefined',
    success = 'success',
    error = 'error',
    init = 'init'
}
export interface IMessageStatus {
    status: MessageStatusEnum,
    error?: string
}