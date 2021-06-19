import { BackgroundChromeMessagingWithPort } from '../Messaging/BackgroundChromeMessagingPort';
import { chromeInstanceId } from './BackgroundChromeInstanceIdHandler';
import { checkUrl } from './rulesHandler';
import { addHandler, sendSignalrMessage } from './signalrmessages';
import { ITabStatus, TabStatusEnum } from '../Shared/TabStatusModels';
const tabs = new Set<number>();

let log: Array<ITabStatus>;

const popupmessaging = BackgroundChromeMessagingWithPort.getInstance('popup');
chrome.tabs.onCreated.addListener(async (tab) => {
  tabs.add(tab.id!);
  popupmessaging.sendMessage({
    type: 'tabcreated',
    payload: tab
  });
  //console.log("onCreated:")
    //console.log(args);
    // chrome.runtime.sendMessage({greeting: "hello"}, function(response) {
    //   console.log(response.farewell);
    // });
    
    // Make a simple request:
    // chrome.runtime.sendMessage({getTargetData: true},
    //   (response) => {    
    //     console.log('chrome.runtime.lastError', chrome.runtime.lastError);
    //     console.log('background sendMessage response callback', response);
    //   }
    // );
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {  
  if (changeInfo.status === 'unloaded') {
    return;
  }
  if (changeInfo.url === 'chrome://newtab/') {
    tabs.delete(tabId);
  }
  else {
    if (tabs.has(tabId)) {
      console.log('tabUpdated:', tabId, changeInfo, tab);
      tabs.delete(tabId);
      const match = checkUrl(changeInfo.url!);
      const self = match === chromeInstanceId.value;
      if (!self) {
        addLogline({
          tabId: tabId,
          status: match ? (self ? TabStatusEnum.Self : TabStatusEnum.Routing) : TabStatusEnum.Unmatched,
          url: changeInfo.url!,
          targetUserprofile: match
        });
      }
      if (match && !self) {
        sendSignalrMessage({
          type: 'openurl',
          payload: {
            url: changeInfo.url,
            originaltab: tabId,
            originalUserprofile: chromeInstanceId.value,
            targetUserprofile: match
          }
        });
      }
    }
  }
  // popupmessaging.sendMessage({
  //   type: 'tabupdated',
  //   payload: {
  //     tabId: tabId,
  //     changeInfo: changeInfo,
  //     tab: tab
  //   }
  // })
}); // chrome tabs onUpdated

addHandler<any>('openurl', (message) => {
  if (message.payload.targetUserprofile === chromeInstanceId.value) {
    addLogline({
      tabId: message.payload.originaltab,
      status: TabStatusEnum.Created,
      url: message.payload.url,
      targetUserprofile: chromeInstanceId.value
  });
  chrome.tabs.create({url: message.payload.url});
  sendSignalrMessage({
    type: 'removetab',
    payload: {
      targetUserprofile: message.payload.originalUserprofile,
      tab: message.payload.originaltab
    }
  });
}
});

addHandler<any>('removetab', (message) => {
  if (message.payload.targetUserprofile === chromeInstanceId.value) {
    updateLoglineToRemovedState(message.payload.tab);
    chrome.tabs.remove(message.payload.tab);
  }
});

popupmessaging.messageHandlers.set('getlog', (message, port) => {
  popupmessaging.sendMessage({ 
    type: 'log', 
    payload: log
  });
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  if (tabs.has(tabId)) {
    tabs.delete(tabId);
  }
});

function dontthrowcodeaway(...args: any[]) {
  console.log("onUpdated:")
  console.log(args);
  console.log(`url ${args[2].url}`);
  const url = args[2].url;
  if (args[1].status === 'unloaded') {
    return;
  }
  if (url) {
    const onUpdatedArgs = args;
    chrome.windows.getAll({
      populate: true
    }, async (...args) => {
      console.log('all windows', args);
      
      sendSignalrMessage({ 
        type: 'tabUpdate', 
        payload: {
          url: url,
          status: onUpdatedArgs[2].status
        }
      });
      const hostname = new URL(url).hostname;
      if (hostname === 'www.nu.nl') {
        chrome.tabs.remove(onUpdatedArgs[0]);
      }    
    }); // async
  } // if
}

function updateLoglineToRemovedState(tabId: number) {
  const idx = log.findIndex(v => v.tabId === tabId && v.status === TabStatusEnum.Routing);
  if (idx === -1) {
    return;
  }
  log[idx].status = TabStatusEnum.Removed;
}

function addLogline(logline: ITabStatus) {
  log.push(logline);
  chrome.storage.local.set({
    'log': log
  });
  popupmessaging.sendMessage({ 
    type: 'log', 
    payload: log
  });
}

chrome.storage.local.get('log', value => {
  if (!value.log) {
    log = new Array<ITabStatus>();
  }
  else {
    log = value.log;
  }
});