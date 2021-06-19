import { BehaviorSubject, ReplaySubject } from 'rxjs';
import { messageHandlers, sendMessage } from '../Messaging/ChromeMessaging';
import { IMessageType } from '../Shared/MessageModels';
import { configUrl } from './settings';
import { BackgroundChromeMessagingWithPort } from '../Messaging/BackgroundChromeMessagingPort';

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
  if (!value || Object.keys(value).length == 0) {
    // the groupcode is undefined; i.e. not yet stored in the chrome local storage. Skip it
    launchConfig();
    return;
  }
  const groupcodestring = atob(value.groupcode);
  const groupcodevalue = JSON.parse(groupcodestring);
  groupcodevalue.encoded = value.groupcode;
  groupcode.next(groupcodevalue);
});
import { listeners } from './chromestorage';

listeners.set('groupcode', (oldValue, newValue) => {           
    const groupcodestring = atob(newValue);
    const groupcodevalue = JSON.parse(groupcodestring);
    groupcodevalue.encoded = newValue;
    groupcode.next(groupcodevalue);
    console.log(`new groupcode value: ${groupcodevalue}`);
  }
);

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

function launchConfig() {  
  //chrome.tabs.create({ url: configUrl });
}

const popupmessaging = BackgroundChromeMessagingWithPort.getInstance('popup');

groupcode.subscribe(next => {
  popupmessaging.sendMessage({
    type: 'groupcode',
    payload: next
  });
});

popupmessaging.messageHandlers.set('getgroupcode', (message, port) => {
  popupmessaging.sendMessage({
    type: 'groupcode',
    payload: groupcode.value
  });
});

messageHandlers.set('getgroupcode', (request, sender, sendResponse) => {
  sendResponse(groupcode.value);
})