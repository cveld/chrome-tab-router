import { Component, OnInit } from '@angular/core';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { IUserProfileStatus } from '../../../../src/Shared/UserprofileModels';
import { ChangeUserprofileDialogComponent } from '../change-userprofile-dialog/change-userprofile-dialog.component';
import { ChromeinstanceidHandler } from '../services/chromeinstanceidHandler';
import { UserprofilesHandler } from '../services/userprofilesHandler';

@Component({
  selector: 'app-userprofiles',
  templateUrl: './userprofiles.component.html',
  styleUrls: ['./userprofiles.component.scss']
})
export class UserprofilesComponent implements OnInit {
  userprofiles = this.userprofilesHandler.userprofiles;
  chromeinstanceid$ = this.chromeinstanceidHandler.chromeinstanceid;
  constructor(
    private modalService: NgbModal,
    private chromeinstanceidHandler: ChromeinstanceidHandler,
    private userprofilesHandler : UserprofilesHandler) { }

  ngOnInit(): void {
  }

  rowClicked(userprofile: IUserProfileStatus) {
    const ref = this.modalService.open(ChangeUserprofileDialogComponent, {
      ariaLabelledBy: 'Change userprofile'
    });
    (ref.componentInstance as ChangeUserprofileDialogComponent).userprofile = {...userprofile};
    ref.result.then((result: IUserProfileStatus) => {
      this.closeResult = `Closed with: ${result}`;
      this.userprofilesHandler.updateUserprofile(result);

    }, (reason) => {
      this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
    });
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  closeResult = '';
}
