import { IRule } from "../Shared/RuleModels";
import { BackgroundChromeMessagingWithPort } from '../Messaging/BackgroundChromeMessagingPort';
import { listeners } from "./chromestorage";
import { sendSignalrMessage, addHandler, ISignalrMessage } from './signalrmessages';
import {v4 as uuidv4} from 'uuid';

export let rules = new Array<IRule>();
export function checkUrl(url: string): string | undefined {
    const index = rules.findIndex(value => {
        return value.regex!.test(url);
    });
    if (index === -1) {
        return undefined;
    }
    return rules[index].targetUserprofile;
}

const popupmessaging = BackgroundChromeMessagingWithPort.getInstance('popup');

popupmessaging.messageHandlers.set('getrules', (message, port) => {
    popupmessaging.sendMessage({ 
      type: 'rules', 
      payload: rules
    });
  });
  
chrome.storage.local.get('rules', value => {
  if (!value.rules) {
    rules = new Array<IRule>();
  }
  else {
    rules = value.rules;
  }
});

popupmessaging.messageHandlers.set('rules', (message, port) => {
  chrome.storage.local.set({
    'rules': message.payload
  });
  sendSignalrMessage({
    type: 'rules',
    payload: message.payload
});
});

listeners.set('rules', (oldValue, newValue) => {
  rules = newValue;
});

// merge incoming signalr message
addHandler<Array<IRule>>('rules', (message) => {
  const mergedMap = new Map<string, IRule>();  
    message.payload?.forEach(u => {
      if (!u.id) {
        u.id = uuidv4();
      }
        mergedMap.set(u.id, u); 
    });
    let haschanges = false;
    rules.forEach(u => {
      if (!u.id) {
        u.id = uuidv4();
      }
      if (mergedMap.has(u.id)) {
        const found = mergedMap.get(u.id)!;            
        if (u?.updated && (!found.updated || found?.updated < u.updated)) {
            haschanges = true;
            found.regex = u.regex;
            found.targetUserprofile = u.targetUserprofile;
            found.deleted = u.deleted;
        }
      }
      else {
          haschanges = true;
          mergedMap.set(u.id, u);
      }        
    });

    const merged = Array.from(mergedMap, ([_, value]) => value);

    if (haschanges) {
        sendSignalrMessage({
            type: 'rules',
            payload: merged
        });            
    }
    chrome.storage.local.set({
        'rules': merged
    });
    popupmessaging.sendMessage({
      type: 'rules',
      payload: merged
  });
});