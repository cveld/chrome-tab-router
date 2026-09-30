import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MAX_LOG_ENTRIES,
  clearLogEntries,
  createLogger,
  defaultLogLevel,
  formatLogArg,
  getLogEntries,
  normalizeLogLevel,
  redactSecrets,
  restoreLogEntries,
  setLogLevel,
  type ILogEntry,
} from './logger';

describe('logger', () => {
  beforeEach(() => {
    clearLogEntries();
    setLogLevel(defaultLogLevel);

    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    vi.spyOn(console, 'debug').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('filters messages according to the current log level', () => {
    setLogLevel('warn');
    const logger = createLogger('test');

    logger.error('error message');
    logger.warn('warn message');
    logger.info('info message');
    logger.debug('debug message');

    expect(getLogEntries().map(entry => entry.level)).toEqual(['error', 'warn']);
    expect(console.error).toHaveBeenCalledWith('[test]', 'error message');
    expect(console.warn).toHaveBeenCalledWith('[test]', 'warn message');
    expect(console.info).not.toHaveBeenCalled();
    expect(console.debug).not.toHaveBeenCalled();
  });

  it('keeps only the newest entries when the ring buffer reaches its cap', () => {
    const logger = createLogger('ring');

    for (let index = 0; index < MAX_LOG_ENTRIES + 10; index += 1) {
      logger.info(index);
    }

    const entries = getLogEntries();
    expect(entries).toHaveLength(MAX_LOG_ENTRIES);
    expect(entries[0]?.message).toBe('10');
    expect(entries[MAX_LOG_ENTRIES - 1]?.message).toBe(String(MAX_LOG_ENTRIES + 9));
  });

  it('prepends restored entries and keeps the newest entries within the cap', () => {
    const logger = createLogger('current');
    logger.info('current-0');
    logger.info('current-1');

    const persisted = Array.from(
      { length: MAX_LOG_ENTRIES },
      (_, index): ILogEntry => ({
        time: index,
        level: 'info',
        scope: 'persisted',
        message: `persisted-${index}`,
      }),
    );
    restoreLogEntries(persisted);

    const entries = getLogEntries();
    expect(entries).toHaveLength(MAX_LOG_ENTRIES);
    expect(entries[0]?.message).toBe('persisted-2');
    expect(entries[MAX_LOG_ENTRIES - 3]?.message).toBe(`persisted-${MAX_LOG_ENTRIES - 1}`);
    expect(entries[MAX_LOG_ENTRIES - 2]?.message).toBe('current-0');
    expect(entries[MAX_LOG_ENTRIES - 1]?.message).toBe('current-1');
  });

  it('formats errors using their stack when available', () => {
    const error = new Error('boom');
    error.stack = 'Error: boom\n    at example.ts:1:1';
    expect(formatLogArg(error)).toBe('Error: boom\n    at example.ts:1:1');

    const errorWithoutStack = new Error('broken');
    errorWithoutStack.name = 'TypeError';
    errorWithoutStack.stack = undefined;
    expect(formatLogArg(errorWithoutStack)).toBe('TypeError: broken');
  });

  it('redacts access tokens, bearer tokens, signatures and authorization values', () => {
    const text =
      'access_token=secret&next=1 Bearer abc.def ' +
      '{"groupcodeauthorization":"group-secret","signature":"sig-secret"}';

    expect(redactSecrets(text)).toBe(
      'access_token=<redacted>&next=1 Bearer <redacted> ' +
        '{"groupcodeauthorization":"<redacted>","signature":"<redacted>"}',
    );

    const logger = createLogger('auth');
    logger.info(text);

    expect(getLogEntries()[0]?.message).not.toContain('secret');
    expect(getLogEntries()[0]?.message).not.toContain('abc.def');
    expect(console.info).toHaveBeenCalledWith('[auth]', text);
  });

  it('normalizes valid levels and falls back for invalid values', () => {
    expect(normalizeLogLevel('error')).toBe('error');
    expect(normalizeLogLevel('debug')).toBe('debug');
    expect(normalizeLogLevel('verbose')).toBe(defaultLogLevel);
    expect(normalizeLogLevel('DEBUG')).toBe(defaultLogLevel);
    expect(normalizeLogLevel(undefined)).toBe(defaultLogLevel);
    expect(normalizeLogLevel(null)).toBe(defaultLogLevel);
  });
});
