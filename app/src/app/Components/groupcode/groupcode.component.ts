import { Component, OnInit } from '@angular/core';
import { GroupcodeHandler } from "../../Services/GroupcodeHandler";

@Component({
  selector: 'app-groupcode',
  templateUrl: './groupcode.component.html',
  styleUrls: ['./groupcode.component.scss']
})
export class GroupcodeComponent implements OnInit {

  constructor(private groupcodeHandler: GroupcodeHandler) { }
  enteredGroupcode?: string;

  ngOnInit(): void {
  }

  groupcode = this.groupcodeHandler.groupcode;

  generateClicked() {
    this.groupcodeHandler.getGroupcode();
  }
  submitClicked() {
    this.groupcodeHandler.setGroupcode(this.enteredGroupcode!);
  }
}
