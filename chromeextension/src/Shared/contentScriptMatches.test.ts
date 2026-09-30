import { describe, expect, it } from 'vitest';
import { contentScriptMatches } from './contentScriptMatches';

describe('contentScriptMatches', () => {
  it('restricts to the exact production host', () => {
    expect(contentScriptMatches('https://salmon-flower-0b5657e03.azurestaticapps.net')).toEqual([
      'https://salmon-flower-0b5657e03.azurestaticapps.net/*',
    ]);
  });

  it('never produces a wildcard host', () => {
    const [pattern] = contentScriptMatches('https://salmon-flower-0b5657e03-4.westeurope.azurestaticapps.net/some/path');
    expect(pattern).toBe('https://salmon-flower-0b5657e03-4.westeurope.azurestaticapps.net/*');
    expect(pattern).not.toContain('*.');
  });

  it('drops the port for localhost', () => {
    expect(contentScriptMatches('http://localhost:4200')).toEqual(['http://localhost/*']);
  });

  it('rejects plain http outside localhost', () => {
    expect(() => contentScriptMatches('http://example.azurestaticapps.net')).toThrow();
  });

  it('adds extra comma-separated urls, deduplicated', () => {
    expect(
      contentScriptMatches(
        'https://salmon-flower-0b5657e03.azurestaticapps.net',
        ' https://chrome-tab-router.carlintveld.nl , https://salmon-flower-0b5657e03.azurestaticapps.net,',
      ),
    ).toEqual([
      'https://salmon-flower-0b5657e03.azurestaticapps.net/*',
      'https://chrome-tab-router.carlintveld.nl/*',
    ]);
  });

  it('rejects an extra plain http url outside localhost', () => {
    expect(() => contentScriptMatches('https://a.azurestaticapps.net', 'http://evil.example')).toThrow();
  });

  it('rejects a missing url', () => {
    expect(() => contentScriptMatches(undefined)).toThrow();
    expect(() => contentScriptMatches('')).toThrow();
  });
});
