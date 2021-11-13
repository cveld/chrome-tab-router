import { BackgroundChromeMessagingWithPort } from '../Messaging/BackgroundChromeMessagingPort';
import { chromeInstanceId } from './BackgroundChromeInstanceIdHandler';
import { checkUrl } from './rulesHandler';
import { addHandler, sendSignalrMessage } from './signalrmessages';
import { ITabStatus, TabStatusEnum } from '../Shared/TabStatusModels';

// List that captures the handling state of a created tab
const tabs = new Set<number>();
const navigatedTabs = new Map<number, chrome.webNavigation.WebNavigationParentedCallbackDetails>();

let log: Array<ITabStatus>;

const popupmessaging = BackgroundChromeMessagingWithPort.getInstance('popup');
chrome.tabs.onCreated.addListener(async (tab) => {  
  const targetUrl = tab.pendingUrl || tab.url;
  
  // if targetUrl is not set, use other APIs to fetch the url:
  if (!targetUrl) {    
    //console.log('target url cannot be fetched from tab: ', tab);    
    tabs.add(tab.id!);
  }
  else {
    // Check whether user clicked new tab operation:
    if (targetUrl !== 'chrome://newtab/' && !targetUrl.startsWith('chrome-extension://')) {
      // If not, we will validate the incoming url and route if required:
      const match = checkUrl(targetUrl);
      const self = match === chromeInstanceId.value;
      processTargetUrl(tab.id!, targetUrl, match);
    }
  }
  popupmessaging.sendMessage({
    type: 'tabcreated',
    payload: tab
  });  
});

function processTargetUrl(tabId: number, targetUrl: string, match: string | undefined) {
  addLogline({
    tabId: tabId,
    status: match ? (self ? TabStatusEnum.Self : TabStatusEnum.Routing) : TabStatusEnum.Unmatched,
    url: targetUrl,
    targetUserprofile: match
  });
  if (match) {
    sendSignalrMessage({
      type: 'openurl',
      payload: {
        url: targetUrl,
        originaltab: tabId,
        originalUserprofile: chromeInstanceId.value,
        targetUserprofile: match
      }
    });
  }

}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {  
  if (changeInfo.status === 'unloaded') {
    return;
  }
  if (changeInfo.url === 'chrome://newtab/') {
    if (tabs.has(tabId)) {
      tabs.delete(tabId);
    }
  }
  else {
    if (tabs.has(tabId)) {
      console.log('tabUpdated:', tabId, changeInfo, tab);
      tabs.delete(tabId);
      const targetUrl = navigatedTabs.get(tabId)?.url!;
      const match = checkUrl(targetUrl);
      const self = match === chromeInstanceId.value;
      if (!self && !changeInfo.url?.startsWith('chrome-extension://')) {
        processTargetUrl(tabId, targetUrl, match)
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

addHandler<{ targetUserprofile: string, tab: number }>('removetab', (message) => {
  if (message.payload!.targetUserprofile === chromeInstanceId.value) {
    updateLoglineToRemovedState(message.payload!.tab);
    chrome.tabs.remove(message.payload!.tab);
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

function updateLoglineToRemovedState(tabId: number) {
  const idx = log.findIndex(v => v.tabId === tabId && v.status === TabStatusEnum.Routing);
  if (idx === -1) {
    return;
  }
  log[idx].status = TabStatusEnum.Removed;
  chrome.storage.local.set({
    'log': log
  });
  popupmessaging.sendMessage({ 
    type: 'log', 
    payload: log
  });
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

chrome.webNavigation.onBeforeNavigate.addListener((details) => {  
  navigatedTabs.set(details.tabId, details);
})