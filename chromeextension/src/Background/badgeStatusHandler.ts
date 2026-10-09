import { BehaviorSubject, combineLatest } from 'rxjs';
import { connectionStatus } from './signalr';
import { groupcode, groupcodeLoaded } from './BackgroundGroupcodeHandler';
import { messageStatus } from './signalrmessages';
import { localPairing, localPairingLoaded, syncBackend, syncBackendChosen } from './syncBackendHandler';
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
  combineLatest([
    connectionStatus,
    groupcode,
    messageStatus,
    groupcodeLoaded,
    syncBackend,
    syncBackendChosen,
    localPairing,
    localPairingLoaded,
  ]).subscribe(([connection, code, messages, groupcodeRead, backend, chosen, pairing, pairingRead]) => {
    // Until storage has been read, an empty credential means "unknown", not
    // "missing"; judging it now flashes a false "Groupcode not set" at startup.
    if (backend === null) return;
    const loaded = backend === 'local' ? pairingRead : groupcodeRead;
    if (!loaded) return;
    const hasCredential = backend === 'local' ? !!pairing : !!code.signature;
    badgeStatus.next(computeBadgeStatus(connection, hasCredential, messages, backend, chosen));
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
