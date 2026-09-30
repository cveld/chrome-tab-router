// Leveled logger shared by every extension context. Besides writing to the
// console it keeps the most recent entries in a ring buffer, which the
// "Copy diagnostics" button on the options page includes in its report.
// No chrome.* in here: see logStorage.ts for the storage wiring.
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export const LOG_LEVELS: LogLevel[] = ['error', 'warn', 'info', 'debug'];
export const defaultLogLevel: LogLevel = 'info';
export const MAX_LOG_ENTRIES = 500;

const MAX_LOG_ARG_LENGTH = 2000;

export interface ILogEntry {
  time: number;
  level: LogLevel;
  scope: string;
  message: string;
}

type LogListener = (entry: ILogEntry) => void;
type LogMethod = (...args: unknown[]) => void;
export type Logger = Record<LogLevel, LogMethod>;

let currentLogLevel: LogLevel = defaultLogLevel;
let logEntries: ILogEntry[] = [];
const listeners = new Set<LogListener>();

export function normalizeLogLevel(value: unknown): LogLevel {
  if (typeof value === 'string' && LOG_LEVELS.includes(value as LogLevel)) {
    return value as LogLevel;
  }
  return defaultLogLevel;
}

export function setLogLevel(level: LogLevel): void {
  currentLogLevel = level;
}

export function getLogLevel(): LogLevel {
  return currentLogLevel;
}

export function getLogEntries(): ILogEntry[] {
  return logEntries.map(entry => ({ ...entry }));
}

export function clearLogEntries(): void {
  logEntries = [];
}

/** Puts entries persisted by an earlier service worker instance before the current ones. */
export function restoreLogEntries(entries: ILogEntry[]): void {
  const restoredEntries = entries.map(entry => ({ ...entry }));
  logEntries = [...restoredEntries, ...logEntries].slice(-MAX_LOG_ENTRIES);
}

export function onLogEntry(listener: LogListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function truncateLogArg(value: string): string {
  if (value.length <= MAX_LOG_ARG_LENGTH) {
    return value;
  }
  return `${value.slice(0, MAX_LOG_ARG_LENGTH - 1)}…`;
}

export function formatLogArg(arg: unknown): string {
  let formatted: string;

  if (typeof arg === 'string') {
    formatted = arg;
  } else if (arg instanceof Error) {
    // A V8 stack already starts with "name: message".
    formatted = arg.stack || `${arg.name}: ${arg.message}`;
  } else if (arg === undefined) {
    formatted = 'undefined';
  } else if (arg === null) {
    formatted = 'null';
  } else if (typeof arg === 'object') {
    try {
      formatted = JSON.stringify(arg) ?? String(arg);
    } catch {
      formatted = String(arg);
    }
  } else {
    formatted = String(arg);
  }

  return truncateLogArg(formatted);
}

// The buffer ends up in a report users paste into issues, so strip what would
// let someone join their group: SignalR access tokens and group code signatures.
export function redactSecrets(text: string): string {
  return text
    .replace(/\baccess_token=[^&\s"']*/gi, 'access_token=<redacted>')
    .replace(/("groupcodeauthorization"\s*:\s*")(?:\\.|[^"\\])*"/gi, '$1<redacted>"')
    .replace(/("signature"\s*:\s*")(?:\\.|[^"\\])*"/gi, '$1<redacted>"')
    .replace(/\bBearer\s+[^\s"']+/gi, 'Bearer <redacted>');
}

export function createLogger(scope: string): Logger {
  const log = (level: LogLevel, args: unknown[]): void => {
    if (LOG_LEVELS.indexOf(level) > LOG_LEVELS.indexOf(currentLogLevel)) {
      return;
    }

    const entry: ILogEntry = {
      time: Date.now(),
      level,
      scope,
      message: redactSecrets(args.map(formatLogArg).join(' ')),
    };

    logEntries.push(entry);
    if (logEntries.length > MAX_LOG_ENTRIES) {
      logEntries.splice(0, logEntries.length - MAX_LOG_ENTRIES);
    }

    for (const listener of [...listeners]) {
      listener(entry);
    }

    console[level](`[${scope}]`, ...args);
  };

  return {
    error: (...args: unknown[]) => log('error', args),
    warn: (...args: unknown[]) => log('warn', args),
    info: (...args: unknown[]) => log('info', args),
    debug: (...args: unknown[]) => log('debug', args),
  };
}
