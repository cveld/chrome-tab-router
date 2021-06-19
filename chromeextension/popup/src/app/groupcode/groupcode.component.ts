import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { GroupcodeHandler } from '../services/groupcodeHandler';
import { configUrl } from '../shared/settings';
@Component({
  selector: 'app-groupcode',
  templateUrl: './groupcode.component.html',
  styleUrls: ['./groupcode.component.scss']
})
export class GroupcodeComponent implements OnInit {
  constructor(private groupcodeHandler: GroupcodeHandler) {}
  groupcode = this.groupcodeHandler.groupcode;
  enteredGroupcode: string = '';  
  ngOnInit(): void {
  }

  generateClicked(): void {
    chrome.tabs.create({
      url: configUrl
    })
  }

  submitClicked(): void {
    this.groupcodeHandler.setGroupcode(this.enteredGroupcode!);
  }

  async copyClicked() {        
    await navigator.clipboard.writeText(this.groupcode.value);
  }
}
