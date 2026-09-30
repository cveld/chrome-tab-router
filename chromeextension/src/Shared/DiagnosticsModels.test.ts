import { describe, expect, it } from 'vitest';
import { formatDiagnosticsReport, urlOrigin, type IPageDiagnostics } from './DiagnosticsModels';
import { ConnectionStatusEnum } from './signalrModels';
import { MessageStatusEnum } from './MessageStatusModels';
import { TabStatusEnum } from './TabStatusModels';

const build = { version: '1.2.3', mode: 'development', builtAt: 'now', commit: 'abc', apiBaseUrl: 'http://api' };

const page: IPageDiagnostics = {
  context: 'options page',
  build,
  userAgent: 'test-agent',
  backgroundConnected: false,
  backgroundError: 'Receiving end does not exist.',
  log: [{ time: 0, level: 'warn', scope: 'ui', message: 'page warning' }],
};

describe('urlOrigin', () => {
  it('drops path and query', () => {
    expect(urlOrigin('https://example.com/private/path?token=1')).toBe('https://example.com');
  });

  it('handles opaque and invalid urls', () => {
    expect(urlOrigin('mailto:someone@example.com')).toBe('mailto://…');
    expect(urlOrigin('not a url')).toBe('<invalid url>');
  });
});

describe('formatDiagnosticsReport', () => {
  it('reports page state only when the service worker did not answer', () => {
    const report = formatDiagnosticsReport(page, undefined);
    expect(report).toContain('Background reachable: no (Receiving end does not exist.)');
    expect(report).toContain('did not answer');
    expect(report).toContain('WARN  [ui] page warning');
  });

  it('includes background state', () => {
    const report = formatDiagnosticsReport(
      { ...page, backgroundConnected: true, backgroundError: undefined },
      {
        generatedAt: 0,
        build,
        logLevel: 'debug',
        chromeInstanceId: 'instance-1',
        profileName: 'Work',
        groupcodePresent: true,
        connection: { status: ConnectionStatusEnum.error, error: 'Failed to negotiate' },
        messages: { status: MessageStatusEnum.success },
        badge: { problem: 'connection', title: 'Not connected' },
        settings: { mode: 'always', countdownSeconds: 5 },
        userprofiles: [{ name: 'Home', chromeInstanceId: 'instance-2', lastSeen: 0 }],
        rules: [{ regex: 'github\\.com', targetUserprofile: 'instance-2' }],
        recentTabs: [{ tabId: 7, status: TabStatusEnum.Routing, url: 'https://github.com', targetUserprofile: 'instance-2' }],
        log: [{ time: 0, level: 'error', scope: 'signalr', message: 'connect failed' }],
      },
    );
    expect(report).toContain('Background reachable: yes');
    expect(report).toContain('Group code set: yes');
    expect(report).toContain('SignalR connection: error - Failed to negotiate');
    expect(report).toContain('- github\\.com -> instance-2');
    expect(report).toContain('- tab 7 | Routing | https://github.com | instance-2');
    expect(report).toContain('ERROR [signalr] connect failed');
  });
});
