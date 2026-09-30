import {
  getLogEntries,
  normalizeLogLevel,
  onLogEntry,
  restoreLogEntries,
  setLogLevel,
  type ILogEntry,
  type LogLevel,
} from './logger';

// chrome.storage.local key of the log level. Machine-local like the router
// page settings: every context of this profile follows it, it is not synced.
export const LOG_LEVEL_STORAGE_KEY = 'logLevel';
// chrome.storage.session key of the background log buffer. Session storage
// survives service worker restarts but is cleared when the browser closes.
const LOG_BUFFER_STORAGE_KEY = 'diagnosticsLog';
const PERSIST_DELAY_MS = 1000;

/** Makes this context follow the log level chosen on the Settings tab. */
export function registerLogLevelSync(): void {
  chrome.storage.local.get<{ logLevel?: LogLevel }>(LOG_LEVEL_STORAGE_KEY, value => {
    setLogLevel(normalizeLogLevel(value.logLevel));
  });
  chrome.storage.onChanged.addListener((changes, areaName) => {
    const change = changes[LOG_LEVEL_STORAGE_KEY];
    if (areaName === 'local' && change) {
      setLogLevel(normalizeLogLevel(change.newValue));
    }
  });
}

export function saveLogLevel(level: LogLevel): Promise<void> {
  return chrome.storage.local.set({ [LOG_LEVEL_STORAGE_KEY]: level });
}

/**
 * Background only: keeps the log buffer across service worker restarts, so a
 * report still shows what happened before the worker was terminated.
 */
export function registerLogPersistence(): void {
  let restored = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const schedulePersist = () => {
    if (timer) {
      return;
    }
    timer = setTimeout(() => {
      timer = undefined;
      // Writing before the restore landed would overwrite the earlier entries.
      if (!restored) {
        schedulePersist();
        return;
      }
      chrome.storage.session.set({ [LOG_BUFFER_STORAGE_KEY]: getLogEntries() });
    }, PERSIST_DELAY_MS);
  };

  chrome.storage.session.get<{ diagnosticsLog?: ILogEntry[] }>(LOG_BUFFER_STORAGE_KEY, value => {
    if (Array.isArray(value.diagnosticsLog)) {
      restoreLogEntries(value.diagnosticsLog);
    }
    restored = true;
  });

  onLogEntry(schedulePersist);
}
