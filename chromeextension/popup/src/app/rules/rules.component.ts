import { Component, OnInit } from '@angular/core';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject, Observable } from 'rxjs';
import { IRule } from '../../../../src/Shared/RuleModels';
import { IUserProfileStatus } from '../../../../src/Shared/UserprofileModels';
import { AddRuleDialogComponent } from '../add-rule-dialog/add-rule-dialog.component';
import { ChromeinstanceidHandler } from '../services/chromeinstanceidHandler';
import { RulesHandler } from '../services/rulesHandler';
import { UserprofilesHandler } from '../services/userprofilesHandler';
import { map } from 'rxjs/operators';
@Component({
  selector: 'app-rules',
  templateUrl: './rules.component.html',
  styleUrls: ['./rules.component.scss']
})
export class RulesComponent implements OnInit {
  rules: BehaviorSubject<Array<IRule>> = this.rulesHandler.rules;
  constructor(
    private modalService: NgbModal, 
    private chromeinstanceidHandler: ChromeinstanceidHandler,
    private userprofilesHandler : UserprofilesHandler,
    private rulesHandler: RulesHandler) { }

  ngOnInit(): void {
  }
  hoverindex = new Set<number>();

  chromeInstanceId$ = this.chromeinstanceidHandler.chromeinstanceid;
  userprofiles$: Observable<Map<string, IUserProfileStatus>> = this.userprofilesHandler.userprofiles.pipe(map(u => {
    const map = new Map<string, IUserProfileStatus>();
    u.forEach(v => {
      map.set(v.chromeInstanceId!, v);
    })
    return map;
  }));

  closeResult: string = "";
  newClicked() {
    this.modalService.open(AddRuleDialogComponent, {ariaLabelledBy: 'Add rule'}).result.then((result: IRule) => {
      this.closeResult = `Closed with: ${result}`;
      this.rulesHandler.addRule({
        regex: result.regex,
        targetUserprofile: result.targetUserprofile
      });

    }, (reason) => {
      this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
    });
  }

  addSubmitted() {
    
  }

  trashclicked(rule: IRule) {
    this.rulesHandler.deleteRule(rule);
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

  rowclicked(rule: IRule) {
    const ref = this.modalService.open(AddRuleDialogComponent, {ariaLabelledBy: 'Change rule'});
    const instance = ref.componentInstance as AddRuleDialogComponent;
    instance.rule = {...rule};
    instance.changemode = true;

    ref.result.then((result: IRule) => {
      this.closeResult = `Closed with: ${result}`;
      this.rulesHandler.changeRule(rule, {
        regex: result.regex,
        targetUserprofile: result.targetUserprofile
      });

    }, (reason) => {
      this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
    });
  }
}
