import { map } from 'rxjs/operators';
import { ConnectionStatusEnum } from '../Shared/signalrModels';
import { connectionStatus } from './signalr';
import { groupcode } from './BackgroundGroupcodeHandler';
import { messageStatus } from './signalrmessages';
import { combineLatest } from 'rxjs';
import { MessageStatusEnum } from '../Shared/MessageStatusModels';

function ok() {
  chrome.action.setTitle({ title: 'Chrome tab router' });
  chrome.action.setBadgeText({
    text: ''
  });
  chrome.action.setBadgeBackgroundColor({
    color: '#44F'
  });
}

function error(text: string) {
  chrome.action.setTitle({ title: text });
  chrome.action.setBadgeText({
    text: '!'
  });
  chrome.action.setBadgeBackgroundColor({
    color: '#F00'
  });
}

export function registerBadgeStatusHandler() {
  combineLatest([connectionStatus, groupcode, messageStatus]).pipe(map(value => {
    return {
      connectionStatus: value[0],
      groupcode: value[1],
      messageStatus: value[2]
    };
  })).subscribe(value => {
    if (!value.groupcode.signature) {
      error('Groupcode not set');
      return;
    }
    if (value.messageStatus.status === MessageStatusEnum.error) {
      error(`Messages error: ${value.messageStatus.error}`);
      return;
    }
    if (value.connectionStatus.status !== ConnectionStatusEnum.connected) {
      error(`Connection error: ${value.connectionStatus.error}`);
      return;
    }
    ok();
  });
}
