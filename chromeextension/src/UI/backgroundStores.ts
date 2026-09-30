// Singleton stores for the state the background script owns, wired to the
// shared 'popup' runtime port. This is the React replacement of the old
// Angular services in popup/src/app/services/*: one handler per message type,
// an initial "get*" request on load, and command functions with the same
// semantics (local optimistic update + notify background).
import { ScriptChromeMessagingWithPort } from '../Messaging/ScriptChromeMessagingPort';
import type { IRule } from '../Shared/RuleModels';
import type { IUserProfileStatus } from '../Shared/UserprofileModels';
import type { ITabStatus } from '../Shared/TabStatusModels';
import { ConnectionStatusEnum, type IConnectionStatus } from '../Shared/signalrModels';
import type { IRouteTabRequest } from '../Shared/MessageModels';
import {
  defaultInterstitialSettings,
  normalizeInterstitialSettings,
  type IInterstitialSettings,
} from '../Shared/SettingsModels';
import { okBadgeStatus, type IBadgeStatus } from '../Shared/BadgeStatusModels';
import type { IBackgroundDiagnostics } from '../Shared/DiagnosticsModels';
import { createStore } from './stores';

const messaging = ScriptChromeMessagingWithPort.getInstance('popup');

export const rulesStore = createStore<IRule[]>([]);
export const userProfilesStore = createStore<IUserProfileStatus[]>([]);
export const connectionStatusStore = createStore<IConnectionStatus>({
  status: ConnectionStatusEnum.init,
});
export const groupcodeStore = createStore<string>('');
export const chromeInstanceIdStore = createStore<string>('');
export const tabLogStore = createStore<ITabStatus[]>([]);
export const settingsStore = createStore<IInterstitialSettings>(defaultInterstitialSettings);
export const badgeStatusStore = createStore<IBadgeStatus>(okBadgeStatus);

messaging.setHandler<IRule[]>('rules', message => {
  rulesStore.set(message.payload ?? []);
});

messaging.setHandler<IUserProfileStatus[]>('userprofiles', message => {
  userProfilesStore.set(message.payload ?? []);
});

messaging.setHandler<IConnectionStatus>('ConnectionStatus', message => {
  if (message.payload) {
    connectionStatusStore.set(message.payload);
  }
});

// The encoded group code blob is what gets copied between profiles; it is the
// payload of both the initial getgroupcode response and subsequent broadcasts.
messaging.setHandler<{ encoded?: string }>('groupcode', message => {
  groupcodeStore.set(message.payload?.encoded ?? '');
});

messaging.setHandler<string>('chromeinstanceid', message => {
  chromeInstanceIdStore.set(message.payload ?? '');
});

messaging.setHandler<ITabStatus[]>('log', message => {
  tabLogStore.set(message.payload ?? []);
});

messaging.setHandler<IInterstitialSettings>('settings', message => {
  settingsStore.set(normalizeInterstitialSettings(message.payload));
});

messaging.setHandler<IBadgeStatus>('badgestatus', message => {
  badgeStatusStore.set(message.payload ?? okBadgeStatus);
});

// The answer is broadcast to every open page, so whoever is waiting takes it.
let pendingDiagnostics: Array<(diagnostics: IBackgroundDiagnostics) => void> = [];
messaging.setHandler<IBackgroundDiagnostics>('diagnostics', message => {
  const waiting = pendingDiagnostics;
  pendingDiagnostics = [];
  if (message.payload) {
    waiting.forEach(resolve => resolve(message.payload!));
  }
});

// --- Initial state requests ------------------------------------------------

// Each get* request makes the background answer with the matching message
// above. They are re-sent after every reconnect, because a restarted service
// worker only pushes updates, not the state the page already missed.
function requestInitialState(): void {
  messaging.sendMessage({ type: 'getrules' });
  messaging.sendMessage({ type: 'getuserprofiles' });
  messaging.sendMessage({ type: 'getconnectionstatus' });
  messaging.sendMessage({ type: 'getgroupcode' });
  messaging.sendMessage({ type: 'getchromeinstanceid' });
  messaging.sendMessage({ type: 'getlog' });
  messaging.sendMessage({ type: 'getsettings' });
  messaging.sendMessage({ type: 'getbadgestatus' });
}
requestInitialState();
messaging.onReconnect(requestInitialState);

export interface IBackgroundConnection {
  connected: boolean;
  /** chrome.runtime.lastError of the last failed attempt, e.g. "Receiving end does not exist." */
  error?: string;
}

export const backgroundConnectionStore = createStore<IBackgroundConnection>({
  connected: messaging.connected,
  error: messaging.lastError,
});
messaging.onConnectionChange((connected, error) => {
  backgroundConnectionStore.set({ connected, error: connected ? undefined : error ?? messaging.lastError });
});

// --- Commands (UI -> background) -------------------------------------------

export function addRule(rule: Pick<IRule, 'regex' | 'targetUserprofile'>): void {
  const rules = [...rulesStore.get(), { ...rule, id: crypto.randomUUID(), updated: Date.now() }];
  rulesStore.set(rules);
  messaging.sendMessage({ type: 'rules', payload: rules });
}

export function deleteRule(rule: IRule): void {
  const rules = rulesStore.get();
  const target = rules.find(r => r === rule || (!!rule.id && r.id === rule.id));
  if (!target) {
    return;
  }
  // Soft delete: the merge logic on the background side keeps deleted rules
  // around so deletions propagate to profiles that were offline.
  target.deleted = true;
  rulesStore.set([...rules]);
  messaging.sendMessage({ type: 'rules', payload: rules });
}

export function changeRule(
  oldRule: IRule,
  patch: Pick<IRule, 'regex' | 'targetUserprofile'>,
): void {
  const rules = rulesStore.get();
  const target = rules.find(r => r === oldRule || (!!oldRule.id && r.id === oldRule.id));
  if (!target) {
    return;
  }
  target.regex = patch.regex;
  target.targetUserprofile = patch.targetUserprofile;
  target.updated = Date.now();
  rulesStore.set([...rules]);
  messaging.sendMessage({ type: 'rules', payload: rules });
}

export function updateUserProfile(profile: IUserProfileStatus): void {
  const profiles = userProfilesStore.get();
  const index = profiles.findIndex(p => p.chromeInstanceId === profile.chromeInstanceId);
  if (index === -1) {
    return;
  }
  const updated = [...profiles];
  updated[index] = { ...profile, updated: Date.now() };
  userProfilesStore.set(updated);
  messaging.sendMessage({ type: 'userprofiles', payload: updated });
}

export function deleteUserProfile(profile: IUserProfileStatus): void {
  const profiles = userProfilesStore.get();
  const index = profiles.findIndex(p => p.chromeInstanceId === profile.chromeInstanceId);
  if (index === -1) {
    return;
  }
  const updated = [...profiles];
  updated[index] = { ...updated[index]!, deleted: true, updated: Date.now() };
  userProfilesStore.set(updated);
  messaging.sendMessage({ type: 'userprofiles', payload: updated });
}

export function reconnectSignalr(): void {
  messaging.sendMessage({ type: 'reconnect' });
}

export function submitGroupcode(encoded: string): void {
  messaging.sendMessage({ type: 'groupcode', payload: { encoded } });
}

export function saveSettings(settings: IInterstitialSettings): void {
  const normalized = normalizeInterstitialSettings(settings);
  settingsStore.set(normalized);
  messaging.sendMessage({ type: 'settings', payload: normalized });
}

/** Resolves undefined when the service worker does not answer in time. */
export function requestBackgroundDiagnostics(
  timeoutMs = 3000,
): Promise<IBackgroundDiagnostics | undefined> {
  return new Promise(resolve => {
    const done = (diagnostics: IBackgroundDiagnostics | undefined) => {
      clearTimeout(timer);
      pendingDiagnostics = pendingDiagnostics.filter(pending => pending !== done);
      resolve(diagnostics);
    };
    const timer = setTimeout(() => done(undefined), timeoutMs);
    pendingDiagnostics.push(done);
    messaging.sendMessage({ type: 'getdiagnostics' });
  });
}

/** Hand the url to another profile; the background closes this tab afterwards. */
export function routeTab(request: IRouteTabRequest): void {
  messaging.sendMessage({ type: 'routetab', payload: request });
}

/** Abandon routing and load the original url in this tab. */
export function openTabHere(request: IRouteTabRequest): void {
  messaging.sendMessage({ type: 'opentabhere', payload: request });
}
