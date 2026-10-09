import { connectionStatus } from './signalr';
import { activeTransport } from './transport';
import { ConnectionStatusEnum } from '../Shared/signalrModels';
import { createLogger } from '../Shared/logger';

const logger = createLogger('watchdog');

const ALARM_NAME = 'signalr-watchdog';

// Defense-in-depth only: the SignalR connection in signalr.ts is expected to
// keep the service worker alive by itself (Chrome 116+ resets the 30s idle
// timer on WebSocket traffic — see signalr.ts's keepAliveIntervalInMilliseconds).
// This alarm is a backstop for cases that don't self-heal on their own, e.g.
// a reconnect attempt that silently failed, or the worker being woken for an
// unrelated event before the socket had a chance to (re)connect.
export function registerWatchdogAlarm() {
  // 30s is the floor for alarm periods as of Chrome 120; 0.5 minutes = 30s.
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: 0.5 });

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name !== ALARM_NAME) {
      return;
    }
    const transport = activeTransport();
    // Nothing to reconnect before a backend is chosen and its groupcode or pairing is set.
    if (!transport?.canConnect()) {
      return;
    }
    if (connectionStatus.value.status !== ConnectionStatusEnum.connected) {
      logger.info('connection not healthy, reconnecting', connectionStatus.value);
      transport.reconnectIfDisconnected();
    }
  });
}
