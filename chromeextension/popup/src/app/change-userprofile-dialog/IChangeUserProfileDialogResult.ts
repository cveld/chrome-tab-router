import { IUserProfileStatus } from "../../../../src/Shared/UserprofileModels";

export const enum ChangeUserProfileDialogResultActionEnum {
    undefined = "undefined",
    change = "change",
    delete = "delete"
}

export interface IChangeUserProfileDialogResult {
    action: ChangeUserProfileDialogResultActionEnum,
    userProfileStatus?: IUserProfileStatus
}