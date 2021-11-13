import { IRule } from "../Shared/RuleModels";
import { BackgroundChromeMessagingWithPort } from '../Messaging/BackgroundChromeMessagingPort';
import { listeners } from "./chromestorage";
import { sendSignalrMessage, addHandler, ISignalrMessage } from './signalrmessages';
import {v4 as uuidv4} from 'uuid';
import { mergeRules } from "./rulesHandlerUtility";

export let rules = new Array<IRule>();
export function checkUrl(url: string): string | undefined {
    const index = rules.findIndex(value => {
      if (!value.deleted && value.regex) {
        const regex = new RegExp(value.regex)     
        return regex.test(url);
      }
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
  const result = mergeRules(rules, message.payload);
  if (result.haschanges) {
      sendSignalrMessage({
          type: 'rules',
          payload: result.merged
      });            
  }
  chrome.storage.local.set({
      'rules': result.merged
  });
  popupmessaging.sendMessage({
    type: 'rules',
    payload: result.merged
  });
});