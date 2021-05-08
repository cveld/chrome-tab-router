import { HttpClient } from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { contentScriptReady, dispatchEventToContentScript, eventHandlers } from './Messaging/DocumentEventing';

interface IGroupCode {
  clientprincipalname?: object,
  signature?: string,
  encoded?: string
}

@Injectable({
  providedIn: 'root',
})
export class GroupcodeHandler implements OnInit {
  constructor(private httpClient: HttpClient) {    
  }
  
  ngOnInit(): void {
    eventHandlers.set('groupcode', (...args: any[]) => {
      this.groupcode.next(args[0].payload);
    });
    contentScriptReady.subscribe(value => {
      if (value) {
        dispatchEventToContentScript({ 
          type: 'getgroupcode'    
        });
      }
    });
  }
  groupcode : BehaviorSubject<string>  = new BehaviorSubject<string>('');  

  setGroupcode(groupcode: string) {
    this.groupcode.next(groupcode);
    contentScriptReady.subscribe({
      next: value => {
        if (value) {
          dispatchEventToContentScript({ 
            type: 'groupcode',
            payload: groupcode
          });
        } // if
      } // function
    }); // subscribe
  } // function

  getGroupcode() {
    this.httpClient.get("/api/groupcode", { withCredentials: true }).subscribe(result => {
      console.log(result);
      const newGroupcode = result as IGroupCode;       
      this.setGroupcode(newGroupcode.encoded!);
    });
  }
}
