import { HttpClient } from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { contentScriptReady, dispatchEventToContentScript, eventHandlers, IEventType } from './Messaging/DocumentEventing';
import * as environment from '../../environments/environment';

interface IGroupCode {
  clientprincipalname?: object,
  signature?: string,
  encoded?: string
}

@Injectable({
  providedIn: 'root',
})
export class GroupcodeHandler {
  constructor(private httpClient: HttpClient) {      
    eventHandlers.set('groupcode', (message: IEventType) => {      
        this.groupcode.next(message.payload);  
    });

    contentScriptReady.subscribe(value => {
      if (value) {
        dispatchEventToContentScript({ 
          type: 'getgroupcode'    
        });
      }
    });
  }
  groupcode : BehaviorSubject<IGroupCode>  = new BehaviorSubject<IGroupCode>({});  

  setGroupcode(groupcode: IGroupCode) {
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
    return new Promise<void>((resolve, reject) => {      
      const result$ = this.httpClient.get(environment.environment.apibase + "/api/groupcode", { withCredentials: true });      
      result$.subscribe(result => {
        console.log(result);
        const newGroupcode = result as IGroupCode;       
        this.setGroupcode({
          encoded: newGroupcode.encoded!
        });    
        resolve();
      }, error => {
        reject(error);
      });
    });
  }
}
