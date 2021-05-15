import { Component, OnInit } from '@angular/core';
import { GroupcodeHandler } from '../services/groupcodeHandler';
import { signalrHandler } from '../services/signalrhandler';
@Component({
  selector: 'app-popup',
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.scss']
})
export class PopupComponent implements OnInit {
  groupcode = this.groupcodeHandler.groupcode;
  constructor(private groupcodeHandler: GroupcodeHandler, private signalrHandler: signalrHandler) { }

  ngOnInit(): void {    
  }

  reconnectClicked() {
    this.signalrHandler.reconnect();
  }
}
