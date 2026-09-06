import { BackgroundChromeMessagingWithPort } from '../Messaging/BackgroundChromeMessagingPort';
import { chromeInstanceId } from './BackgroundChromeInstanceIdHandler';
import { checkUrl } from './rulesHandler';
import { addHandler, sendSignalrMessage } from './signalrmessages';
import { TabStatusEnum } from '../Shared/TabStatusModels';
import type { ITabStatus } from '../Shared/TabStatusModels';
import type { IRouteTabRequest } from '../Shared/MessageModels';
import { shouldPromptInterstitial } from '../Shared/SettingsModels';
import { interstitialSettings } from './interstitialSettingsHandler';
import { userprofiles } from './userprofilesHandler';

// List that captures the handling state of a created tab
const tabs = new Set<number>();
const navigatedTabs = new Map<number, chrome.webNavigation.WebNavigationBaseCallbackDetails>();

let log: Array<ITabStatus> = [];

// getInstance() is memoized (see BackgroundChromeMessagingPort.ts), so
// calling it here just fetches the singleton created by registerTabUpdateHandler()
// below — it does not re-attach the onConnect listener.
function popupmessaging() {
  return BackgroundChromeMessagingWithPort.getInstance('popup');
}

function processTargetUrl(tabId: number, targetUrl: string, match: string | undefined, self: boolean) {
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

function otherProfileCount() {
  return userprofiles.value.filter(
    profile => !profile.deleted && profile.chromeInstanceId !== chromeInstanceId.value
  ).length;
}

// Hands the tab to the interstitial router page, which lets the user confirm,
// redirect or cancel the routing decision (see entrypoints/router).
function promptForTargetUrl(tabId: number, targetUrl: string, match: string | undefined) {
  addLogline({
    tabId: tabId,
    status: TabStatusEnum.Prompting,
    url: targetUrl,
    targetUserprofile: match
  });
  chrome.tabs.update(tabId, {
    url: `${chrome.runtime.getURL('router.html')}?url=${encodeURIComponent(targetUrl)}`
  });
}

function openTabHere(request: IRouteTabRequest) {
  addLogline({
    tabId: request.tabId,
    status: TabStatusEnum.Cancelled,
    url: request.url,
    targetUserprofile: chromeInstanceId.value
  });
  chrome.tabs.update(request.tabId, { url: request.url });
}

function handleTargetUrl(tabId: number, targetUrl: string) {
  const match = checkUrl(targetUrl);
  const self = match === chromeInstanceId.value;
  if (shouldPromptInterstitial(interstitialSettings.value, !!match, self, otherProfileCount())) {
    promptForTargetUrl(tabId, targetUrl, match);
    return;
  }
  processTargetUrl(tabId, targetUrl, match, self);
}

function updateLoglineToRemovedState(tabId: number) {
  const idx = log.findIndex(v => v.tabId === tabId && v.status === TabStatusEnum.Routing);
  if (idx === -1) {
    return;
  }
  log[idx]!.status = TabStatusEnum.Removed;
  chrome.storage.local.set({
    'log': log
  });
  popupmessaging().sendMessage({
    type: 'log',
    payload: log
  });
}

function addLogline(logline: ITabStatus) {
  log.push(logline);
  chrome.storage.local.set({
    'log': log
  });
  popupmessaging().sendMessage({
    type: 'log',
    payload: log
  });
}

export function registerTabUpdateHandler() {
  const popupmessagingInstance = popupmessaging();

  chrome.tabs.onCreated.addListener(async (tab) => {
    const targetUrl = tab.pendingUrl || tab.url;

    // if targetUrl is not set, use other APIs to fetch the url:
    if (!targetUrl) {
      tabs.add(tab.id!);
    }
    else {
      // Check whether user clicked new tab operation:
      if (targetUrl !== 'chrome://newtab/' && !targetUrl.startsWith('chrome-extension://')) {
        // If not, we will validate the incoming url and route if required:
        handleTargetUrl(tab.id!, targetUrl);
      }
    }
    popupmessagingInstance.sendMessage({
      type: 'tabcreated',
      payload: tab
    });
  });

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
        tabs.delete(tabId);
        const targetUrl = navigatedTabs.get(tabId)?.url!;
        const self = checkUrl(targetUrl) === chromeInstanceId.value;
        if (!self && !changeInfo.url?.startsWith('chrome-extension://')) {
          handleTargetUrl(tabId, targetUrl);
        }
      }
    }
  }); // chrome tabs onUpdated

  addHandler<any>('openurl', (message) => {
    if (message.payload.targetUserprofile === chromeInstanceId.value) {
      addLogline({
        tabId: message.payload.originaltab,
        status: TabStatusEnum.Created,
        url: message.payload.url,
        targetUserprofile: chromeInstanceId.value
      });
      chrome.tabs.create({ url: message.payload.url });
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

  // Decisions taken by the user on the interstitial router page:
  popupmessagingInstance.messageHandlers.set('routetab', (message) => {
    const request = message.payload as IRouteTabRequest;
    if (request.targetUserprofile === chromeInstanceId.value) {
      openTabHere(request);
      return;
    }
    processTargetUrl(request.tabId, request.url, request.targetUserprofile, false);
  });

  popupmessagingInstance.messageHandlers.set('opentabhere', (message) => {
    openTabHere(message.payload as IRouteTabRequest);
  });

  popupmessagingInstance.messageHandlers.set('getlog', (message, port) => {
    popupmessagingInstance.sendMessage({
      type: 'log',
      payload: log
    });
  });

  chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    if (tabs.has(tabId)) {
      tabs.delete(tabId);
    }
  });

  chrome.storage.local.get<{ log?: Array<ITabStatus> }>('log', value => {
    if (value.log) {
      log = value.log;
    }
  });

  chrome.webNavigation.onBeforeNavigate.addListener((details) => {
    navigatedTabs.set(details.tabId, details);
  });
}
