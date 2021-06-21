import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { IUserProfileStatus } from '../../../../src/Shared/UserprofileModels';

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

  changeClicked() {
    this.modal.close(this.userprofile);
  }
}
