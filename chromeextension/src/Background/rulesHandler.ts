import type { IRule } from '../Shared/RuleModels';
import { BackgroundChromeMessagingWithPort } from '../Messaging/BackgroundChromeMessagingPort';
import { listeners } from './chromestorage';
import { sendSignalrMessage, addHandler } from './signalrmessages';
import { mergeRules, syncedRules } from './rulesHandlerUtility';
import { findMatchingRule } from '../Shared/ruleMatching';

export let rules = new Array<IRule>();

export function checkUrl(url: string): string | undefined {
  const rule = findMatchingRule(rules, url);
  return rule?.action === 'current-profile'
    ? undefined
    : rule?.targetUserprofile;
}

export function matchingRule(url: string): IRule | undefined {
  return findMatchingRule(rules, url);
}

export function registerRulesHandler() {
  const popupmessaging = BackgroundChromeMessagingWithPort.getInstance('popup');

  popupmessaging.messageHandlers.set('getrules', (message, port) => {
    popupmessaging.sendMessage({
      type: 'rules',
      payload: rules,
    });
  });

  chrome.storage.local.get<{ rules?: IRule[] }>('rules', value => {
    if (!value.rules) {
      rules = new Array<IRule>();
    } else {
      rules = value.rules;
    }
  });

  popupmessaging.messageHandlers.set('rules', (message, port) => {
    rules = message.payload;
    chrome.storage.local.set({
      rules: message.payload,
    });
    sendSignalrMessage({
      type: 'rules',
      payload: syncedRules(rules),
    });
  });

  listeners.set('rules', (oldValue, newValue) => {
    rules = newValue;
  });

  // merge incoming signalr message
  addHandler<Array<IRule>>('rules', message => {
    const result = mergeRules(rules, message.payload);
    if (result.haschanges) {
      sendSignalrMessage({
        type: 'rules',
        payload: syncedRules(result.merged),
      });
    }
    rules = result.merged;
    chrome.storage.local.set({
      rules: result.merged,
    });
    popupmessaging.sendMessage({
      type: 'rules',
      payload: result.merged,
    });
  });
}
