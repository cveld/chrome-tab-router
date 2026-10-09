import { describe, expect, it } from 'vitest';
import { localRelayUrl, normalizeSyncBackend, parsePairing } from './SyncBackendModels';

describe('parsePairing', () => {
  it('parses the string printed by the daemon', () => {
    expect(parsePairing('ctr-local:48731:abc_DEF-123')).toEqual({ port: 48731, secret: 'abc_DEF-123' });
  });

  it('tolerates surrounding whitespace from a paste', () => {
    expect(parsePairing('  ctr-local:1:s\n')).toEqual({ port: 1, secret: 's' });
  });

  it.each([
    undefined,
    '',
    'abc',
    'ctr-local:48731',
    'ctr-local:48731:',
    'ctr-local:0:secret',
    'ctr-local:70000:secret',
    'ctr-local:12.5:secret',
    'ctr-local:abc:secret',
    'other:48731:secret',
    'ctr-local:48731:se cret',
    'ctr-local:48731:a:b',
  ])('rejects %j', value => {
    expect(parsePairing(value)).toBeUndefined();
  });
});

describe('normalizeSyncBackend', () => {
  it('keeps a valid value and falls back otherwise', () => {
    expect(normalizeSyncBackend('local', 'cloud')).toBe('local');
    expect(normalizeSyncBackend('cloud', 'local')).toBe('cloud');
    expect(normalizeSyncBackend('azure', 'local')).toBe('local');
    expect(normalizeSyncBackend(undefined, 'cloud')).toBe('cloud');
  });
});

describe('localRelayUrl', () => {
  it('always targets loopback', () => {
    expect(localRelayUrl(48731)).toBe('ws://127.0.0.1:48731');
  });
});
