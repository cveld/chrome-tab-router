import { describe, expect, it } from 'vitest';
import { TAB_KEYS, hashForTab, tabFromHash } from './tabs';

describe('tabFromHash', () => {
  it('maps every tab key, with or without the leading hash', () => {
    for (const key of TAB_KEYS) {
      expect(tabFromHash(`#${key}`)).toBe(key);
      expect(tabFromHash(key)).toBe(key);
    }
  });

  it('is case-insensitive and tolerates a #/ prefix', () => {
    expect(tabFromHash('#Connection')).toBe('connection');
    expect(tabFromHash('#/rules')).toBe('rules');
  });

  it('keeps links to the merged groupcode tab working', () => {
    expect(tabFromHash('#groupcode')).toBe('connection');
  });

  it('falls back to the welcome tab', () => {
    expect(tabFromHash('')).toBe('welcome');
    expect(tabFromHash('#')).toBe('welcome');
    expect(tabFromHash('#nonsense')).toBe('welcome');
  });
});

describe('hashForTab', () => {
  it('round-trips through tabFromHash', () => {
    for (const key of TAB_KEYS) {
      expect(tabFromHash(hashForTab(key))).toBe(key);
    }
  });
});
