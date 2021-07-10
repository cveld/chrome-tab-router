import { Component, OnInit } from '@angular/core';
import { GroupcodeHandler } from "../../Services/GroupcodeHandler";
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

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
  groupcodeError = "";

  async generateClicked() {
    this.groupcodeError = "";
    try {
      await this.groupcodeHandler.getGroupcode();
    } catch (e) {      
      this.groupcodeError = e.message;
    }
  }

  submitClicked() {
    this.groupcodeHandler.setGroupcode({
      encoded: this.enteredGroupcode!
    });
  }
  async copyClicked() {        
    await navigator.clipboard.writeText(
      this.groupcode.value.encoded!
    );
  }
}
