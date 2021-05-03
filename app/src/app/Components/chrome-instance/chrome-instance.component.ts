import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { chromeInstanceId } from 'src/app/Services/ChromeInstanceIdHandler';
import { contentScriptReady } from 'src/app/Services/Messaging/DocumentEventing';

@Component({
  selector: 'app-chrome-instance',
  templateUrl: './chrome-instance.component.html',
  styleUrls: ['./chrome-instance.component.scss']
})
export class ChromeInstanceComponent implements OnInit, OnDestroy {
  chromeInstanceId?: string;
  contentScriptReady: Observable<boolean> = contentScriptReady.asObservable();
  constructor() { }

  listener?: any;
  subscriptions: Array<Subscription> = [];
  ngOnDestroy(): void {
    //document.removeEventListener("chrome-tab-router", this.eventHandler);
    this.subscriptions.forEach(value => value.unsubscribe());
  }

  ngOnInit(): void {
    console.log('here it comes');
    this.subscriptions.push(chromeInstanceId.subscribe({
      next: value => {
        this.chromeInstanceId = value;
      }
    }));    
  }

  buttonClicked() {
    //contentScriptReady.next(true);
  }
}
