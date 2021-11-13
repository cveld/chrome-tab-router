import { Component, OnInit } from '@angular/core';
import { signalrHandler } from '../services/signalrHandler';

@Component({
  selector: 'app-connection',
  templateUrl: './connection.component.html',
  styleUrls: ['./connection.component.scss']
})
export class ConnectionComponent implements OnInit {

  constructor(private signalrHandler: signalrHandler) { }
  connectionStatus = this.signalrHandler.connectionStatus;
  ngOnInit(): void {
  }
  reconnectClicked() {
    this.signalrHandler.reconnect();
  }
}
