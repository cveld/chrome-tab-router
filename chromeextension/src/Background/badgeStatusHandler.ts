import { BehaviorSubject, combineLatest } from 'rxjs';
import { connectionStatus } from './signalr';
import { groupcode } from './BackgroundGroupcodeHandler';
import { messageStatus } from './signalrmessages';
import { BackgroundChromeMessagingWithPort } from '../Messaging/BackgroundChromeMessagingPort';
import { computeBadgeStatus, okBadgeStatus, type IBadgeStatus } from '../Shared/BadgeStatusModels';

export const badgeStatus = new BehaviorSubject<IBadgeStatus>(okBadgeStatus);

function applyBadge(status: IBadgeStatus) {
  chrome.action.setTitle({ title: status.problem ? `${status.title} (click for details)` : status.title });
  chrome.action.setBadgeText({
    text: status.problem ? '!' : ''
  });
  chrome.action.setBadgeBackgroundColor({
    color: status.problem ? '#F00' : '#44F'
  });
}

export function registerBadgeStatusHandler() {
  combineLatest([connectionStatus, groupcode, messageStatus]).subscribe(([connection, code, messages]) => {
    badgeStatus.next(computeBadgeStatus(connection, !!code.signature, messages));
  });

  // Clicking the icon opens the options page, which shows the reason behind
  // the "!" badge from these messages.
  const popupmessaging = BackgroundChromeMessagingWithPort.getInstance('popup');
  badgeStatus.subscribe(status => {
    applyBadge(status);
    popupmessaging.sendMessage({ type: 'badgestatus', payload: status });
  });
  popupmessaging.messageHandlers.set('getbadgestatus', () => {
    popupmessaging.sendMessage({ type: 'badgestatus', payload: badgeStatus.value });
  });
}
