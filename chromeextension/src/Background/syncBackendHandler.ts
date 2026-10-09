import { BehaviorSubject, combineLatest } from 'rxjs';
import { BackgroundChromeMessagingWithPort } from '../Messaging/BackgroundChromeMessagingPort';
import {
  LOCAL_PAIRING_STORAGE_KEY,
  SYNC_BACKEND_STORAGE_KEY,
  isSyncBackend,
  normalizeSyncBackend,
  parsePairing,
  type ILocalPairing,
  type ISyncBackendState,
  type SyncBackend,
} from '../Shared/SyncBackendModels';
import { createLogger } from '../Shared/logger';
import { listeners } from './chromestorage';

const logger = createLogger('syncbackend');

// Build-time default (WXT_DEFAULT_SYNC_BACKEND, set by the localsync mode);
// the user's own choice in storage always wins.
export const defaultSyncBackend: SyncBackend = normalizeSyncBackend(
  import.meta.env.WXT_DEFAULT_SYNC_BACKEND,
  'cloud',
);

/** null until storage has been read: a default flashed at startup would start the wrong transport. */
export const syncBackend = new BehaviorSubject<SyncBackend | null>(null);

/**
 * Whether the user has picked a backend. Until then `syncBackend` is only the
 * build default, and a missing credential means "not configured yet" rather
 * than "the chosen backend is broken".
 */
export const syncBackendChosen = new BehaviorSubject<boolean>(false);

export const localPairing = new BehaviorSubject<ILocalPairing | null>(null);
/** `localPairing` is empty until the first storage read; "not paired" is only meaningful once this is true. */
export const localPairingLoaded = new BehaviorSubject<boolean>(false);

function state(): ISyncBackendState {
  return {
    backend: syncBackend.value ?? defaultSyncBackend,
    chosen: syncBackendChosen.value,
    localPort: localPairing.value?.port,
  };
}

export function registerSyncBackendHandler() {
  chrome.storage.local.get<Record<string, unknown>>(
    [SYNC_BACKEND_STORAGE_KEY, LOCAL_PAIRING_STORAGE_KEY],
    value => {
      localPairing.next(parsePairing(value[LOCAL_PAIRING_STORAGE_KEY]) ?? null);
      localPairingLoaded.next(true);
      syncBackendChosen.next(isSyncBackend(value[SYNC_BACKEND_STORAGE_KEY]));
      syncBackend.next(normalizeSyncBackend(value[SYNC_BACKEND_STORAGE_KEY], defaultSyncBackend));
    },
  );

  listeners.set(SYNC_BACKEND_STORAGE_KEY, (_oldValue, newValue) => {
    syncBackendChosen.next(isSyncBackend(newValue));
    syncBackend.next(normalizeSyncBackend(newValue, defaultSyncBackend));
    logger.info('sync backend changed to', syncBackend.value);
  });

  listeners.set(LOCAL_PAIRING_STORAGE_KEY, (_oldValue, newValue) => {
    localPairing.next(parsePairing(newValue) ?? null);
    logger.info('local pairing changed');
  });

  const popupmessaging = BackgroundChromeMessagingWithPort.getInstance('popup');

  combineLatest([syncBackend, syncBackendChosen, localPairing]).subscribe(() => {
    popupmessaging.sendMessage({ type: 'syncbackend', payload: state() });
  });

  popupmessaging.messageHandlers.set('getsyncbackend', () => {
    popupmessaging.sendMessage({ type: 'syncbackend', payload: state() });
  });

  popupmessaging.messageHandlers.set('setsyncbackend', message => {
    chrome.storage.local.set({
      [SYNC_BACKEND_STORAGE_KEY]: normalizeSyncBackend(message.payload, defaultSyncBackend),
    });
  });

  popupmessaging.messageHandlers.set('setlocalpairing', message => {
    // The secret is deliberately not logged, here or anywhere else.
    if (!parsePairing(message.payload)) {
      logger.warn('ignoring an invalid local pairing code');
      return;
    }
    chrome.storage.local.set({ [LOCAL_PAIRING_STORAGE_KEY]: String(message.payload).trim() });
  });

  popupmessaging.messageHandlers.set('clearlocalpairing', () => {
    chrome.storage.local.remove(LOCAL_PAIRING_STORAGE_KEY);
    // storage.onChanged reports a removal with an undefined newValue; the
    // listener above turns that into "not paired".
  });
}
