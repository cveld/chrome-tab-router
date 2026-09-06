import { BehaviorSubject } from 'rxjs';
import { BackgroundChromeMessagingWithPort } from '../Messaging/BackgroundChromeMessagingPort';
import {
  defaultInterstitialSettings,
  normalizeInterstitialSettings,
  type IInterstitialSettings,
} from '../Shared/SettingsModels';
import { listeners } from './chromestorage';

// Machine-local: settings describe how this profile prompts, so they are
// deliberately not synced over SignalR like rules and userprofiles are.
export const interstitialSettings = new BehaviorSubject<IInterstitialSettings>(
  defaultInterstitialSettings,
);

export function registerInterstitialSettingsHandler() {
  const popupmessaging = BackgroundChromeMessagingWithPort.getInstance('popup');

  chrome.storage.local.get<{ settings?: Partial<IInterstitialSettings> }>('settings', value => {
    interstitialSettings.next(normalizeInterstitialSettings(value.settings));
  });

  listeners.set('settings', (oldValue, newValue) => {
    interstitialSettings.next(normalizeInterstitialSettings(newValue));
  });

  interstitialSettings.subscribe(next => {
    popupmessaging.sendMessage({
      type: 'settings',
      payload: next
    });
  });

  popupmessaging.messageHandlers.set('getsettings', () => {
    popupmessaging.sendMessage({
      type: 'settings',
      payload: interstitialSettings.value
    });
  });

  popupmessaging.messageHandlers.set('settings', message => {
    chrome.storage.local.set({
      'settings': normalizeInterstitialSettings(message.payload)
    });
  });
}
