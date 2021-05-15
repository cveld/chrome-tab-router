import { Component, OnInit } from '@angular/core';
import { GroupcodeHandler } from '../services/groupcodeHandler';

@Component({
  selector: 'app-popup',
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.scss']
})
export class PopupComponent implements OnInit {
  groupcode = this.groupcodeHandler.groupcode;
  constructor(private groupcodeHandler: GroupcodeHandler) { }

  ngOnInit(): void {    
  }

}
