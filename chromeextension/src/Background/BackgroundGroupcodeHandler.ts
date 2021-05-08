import { BehaviorSubject, ReplaySubject } from 'rxjs';
import { IMessageType, messageHandlers, sendMessage } from '../Messaging/ChromeMessaging';

interface IGroupcode {
  clientprincipalname?: {
    groupcode: string
  },
  signature?: string
}
export const groupcode = new BehaviorSubject<IGroupcode>({});
// the chrome storage contains the mime64 wrapped version
// the BehaviorSubject contains the decoded version
chrome.storage.local.get('groupcode', value => {
  const groupcodestring = atob(value.groupcode);
  const groupcodevalue = JSON.parse(groupcodestring);
  groupcode.next(groupcodevalue);
});
chrome.storage.onChanged.addListener((changes, areaName) => {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        if (key === 'groupcode') {            
          const groupcodestring = atob(newValue);
          const groupcodevalue = JSON.parse(groupcodestring);
          groupcode.next(groupcodevalue);
          console.log(`new groupcode value: ${groupcodevalue}`);
        }
        console.log(
          `Storage key "${key}" in namespace "${areaName}" changed.`,
          `Old value was "${JSON.stringify(oldValue)}", new value is "${JSON.stringify(newValue)}".`
        );
    }
});

function setGroupcodeHandler(request: IMessageType, sender: chrome.runtime.MessageSender, sendResponse: any) {    
  console.log(request.payload);
  // const decoded = Buffer.from(request.payload, 'base64').toString();
  // const newgroupcode = JSON.parse(decoded) as IGroupcode;
  const newgroupcode = request.payload;
  console.log('new groupcode:', newgroupcode)
  chrome.storage.local.set({ 'groupcode': newgroupcode });  
  sendResponse();  
}

messageHandlers.set('groupcode', setGroupcodeHandler);