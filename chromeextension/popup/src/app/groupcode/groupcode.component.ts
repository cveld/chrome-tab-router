import { Component, OnInit } from '@angular/core';
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

  ngOnInit(): void {
  }

  generateClicked(): void {
    chrome.tabs.create({
      url: configUrl
    })
  }

  submitClicked(): void {}
}
