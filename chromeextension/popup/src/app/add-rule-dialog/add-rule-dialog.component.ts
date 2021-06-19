import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { IRule } from '../../../../src/Shared/RuleModels';
import { ChromeinstanceidHandler } from '../services/chromeinstanceidHandler';
import { UserprofilesHandler } from '../services/userprofilesHandler';

@Component({
  selector: 'app-add-rule-dialog',
  templateUrl: './add-rule-dialog.component.html',
  styleUrls: ['./add-rule-dialog.component.scss']
})
export class AddRuleDialogComponent implements OnInit {

  constructor(
    public modal: NgbActiveModal,
    private chromeinstanceidHandler: ChromeinstanceidHandler,
    private userprofilesHandler : UserprofilesHandler) { }

  ngOnInit(): void {
  }

  userprofiles$ = this.userprofilesHandler.userprofiles;
  chromeinstanceid$ = this.chromeinstanceidHandler.chromeinstanceid;

  @Input()
  rule: IRule = {};
  changemode = false;
 
  addClicked() {
    this.modal.close(this.rule as IRule)
  }
}
