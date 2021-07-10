import { HttpClient } from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { contentScriptReady, dispatchEventToContentScript, eventHandlers, IEventType } from './Messaging/DocumentEventing';

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
      this.setGroupcode({ 
        encoded: 'eyJjbGllbnRwcmluY2lwYWxuYW1lIjp7ImlkZW50aXR5UHJvdmlkZXIiOiJhYWQiLCJ1c2VySWQiOiJmNzc1MDY4MTVkNWI0YTRjOTMzMTAxNjMxOGE2OGNjNiIsInVzZXJEZXRhaWxzIjoiY2FybEBpbnR2ZWxkLm5sIiwidXNlclJvbGVzIjpbImFub255bW91cyIsImF1dGhlbnRpY2F0ZWQiXSwiZ3JvdXBjb2RlIjoiYzAwOWQ1YTctNjIxOS00YzRmLWI3NmUtNmVmOTkyZWM0YTFlIn0sInNpZ25hdHVyZSI6IlUyRnNkR1ZrWDEvd3FSVURnUUxHWTE2TlJZT3VCOHJNYlZNYnhqS20yRW56cm5oV3NKNlpaN0VERHlGdHVqVEM0WEc3cTFjeHhJK2NkREhhNEhaYUdwMENNT1ZxSUh5RjNUdVh5bGpyUE5ndHYvMCtqd0V5V29Za0JIRG1KUm03cGRJWXQyM28zb0JQZXVYR2VJcWFNbGpNbkFCOUd6bEE3K01zTy81OTZaSkpXZ2hGSXd1M0NSdUM2REJlZ1dHbEZDZkliazhtc1F5dDJWZHk0bHlUUVhKdVNQSmtxbWJUNWsvblQ0V0JCaW9aQnRGUWZXU2NoYnBaRVpNNmF2N0dFbE15bmZodzJYNXhPS0NsY3RYK3dJSURWMzhZdlBrSW5ZSU1HNFJJRjdFPSJ9' 
      });    
      resolve();
      return;
      const result$ = this.httpClient.get("https://salmon-flower-0b5657e03-3.westeurope.azurestaticapps.net/api/groupcode", { withCredentials: true });      
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
