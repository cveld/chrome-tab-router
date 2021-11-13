import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { IUserProfileStatus } from '../../../../src/Shared/UserprofileModels';
import { ChangeUserProfileDialogResultActionEnum, IChangeUserProfileDialogResult } from './IChangeUserProfileDialogResult';

@Component({
  selector: 'app-change-userprofile-dialog',
  templateUrl: './change-userprofile-dialog.component.html',
  styleUrls: ['./change-userprofile-dialog.component.scss']
})
export class ChangeUserprofileDialogComponent implements OnInit {

  constructor(public modal: NgbActiveModal) { }

  ngOnInit(): void {
  }

  @Input()
  userprofile: IUserProfileStatus = {};
  
  @Input()
  currentUserprofileId: string = '';

  changeClicked() {
    const closeResult: IChangeUserProfileDialogResult = {
      action: ChangeUserProfileDialogResultActionEnum.change,
      userProfileStatus: this.userprofile
    }
    this.modal.close(closeResult);
  }

  deleteClicked() {
    const closeResult: IChangeUserProfileDialogResult = {
      action: ChangeUserProfileDialogResultActionEnum.delete
    }
    this.modal.close(closeResult);
  }
}
