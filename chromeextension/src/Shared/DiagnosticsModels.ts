import type { IBadgeStatus } from './BadgeStatusModels';
import type { IBuildInfo } from './buildInfo';
import type { ILogEntry, LogLevel } from './logger';
import type { IMessageStatus } from './MessageStatusModels';
import type { IInterstitialSettings } from './SettingsModels';
import type { IConnectionStatus } from './signalrModels';
import type { ITabStatus } from './TabStatusModels';

/** State the background owns, answered to a `getdiagnostics` request as `diagnostics`. */
export interface IBackgroundDiagnostics {
  generatedAt: number;
  build: IBuildInfo;
  logLevel: LogLevel;
  chromeInstanceId: string;
  profileName?: string;
  /** Presence only: the group code itself is a shared secret. */
  groupcodePresent: boolean;
  connection: IConnectionStatus;
  messages: IMessageStatus;
  badge: IBadgeStatus;
  settings: IInterstitialSettings;
  userprofiles: Array<{
    name?: string;
    chromeInstanceId?: string;
    lastSeen?: number;
    deleted?: boolean;
  }>;
  rules: Array<{ regex: string; targetUserprofile?: string; deleted?: boolean }>;
  /** Most recent tab log lines, with urls reduced to their origin. */
  recentTabs: ITabStatus[];
  log: ILogEntry[];
}

/** What the page copying the report knows itself, also when the background is down. */
export interface IPageDiagnostics {
  context: string;
  build: IBuildInfo;
  userAgent: string;
  backgroundConnected: boolean;
  backgroundError?: string;
  log: ILogEntry[];
}

export const RECENT_TAB_COUNT = 25;

/** Keeps where a link was headed without its path or query, which may be private. */
export function urlOrigin(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.origin === 'null' ? `${parsed.protocol}//…` : parsed.origin;
  } catch {
    return '<invalid url>';
  }
}

function formatTime(time: number | undefined): string {
  return time ? new Date(time).toISOString() : '-';
}

function formatLog(entries: ILogEntry[]): string[] {
  if (entries.length === 0) {
    return ['(empty)'];
  }
  return entries.map(
    entry => `${formatTime(entry.time)} ${entry.level.toUpperCase().padEnd(5)} [${entry.scope}] ${entry.message}`,
  );
}

function formatBuild(build: IBuildInfo): string {
  return `v${build.version} | mode ${build.mode} | built ${build.builtAt} | commit ${build.commit} | api ${build.apiBaseUrl}`;
}

export function formatDiagnosticsReport(
  page: IPageDiagnostics,
  background: IBackgroundDiagnostics | undefined,
): string {
  const lines: string[] = [
    '# Chrome Tab Router diagnostics',
    '',
    `Generated: ${formatTime(background?.generatedAt ?? Date.now())}`,
    `Copied from: ${page.context}`,
    `Build (${page.context}): ${formatBuild(page.build)}`,
    `User agent: ${page.userAgent}`,
    `Background reachable: ${page.backgroundConnected ? 'yes' : `no (${page.backgroundError ?? 'no answer'})`}`,
  ];

  if (background) {
    lines.push(
      `Build (service worker): ${formatBuild(background.build)}`,
      `Log level: ${background.logLevel}`,
      '',
      '## Status',
      `Chrome instance id: ${background.chromeInstanceId || '-'}`,
      `Profile name: ${background.profileName ?? '-'}`,
      `Group code set: ${background.groupcodePresent ? 'yes' : 'no'}`,
      `SignalR connection: ${background.connection.status}` +
        (background.connection.connectionId ? ` (id ${background.connection.connectionId})` : '') +
        (background.connection.error ? ` - ${background.connection.error}` : ''),
      `Messages: ${background.messages.status}` +
        (background.messages.error ? ` - ${background.messages.error}` : ''),
      `Badge: ${background.badge.problem ?? 'ok'} - ${background.badge.title}`,
      `Router page: mode ${background.settings.mode}, countdown ${background.settings.countdownSeconds}s`,
      '',
      `## User profiles (${background.userprofiles.length})`,
      ...background.userprofiles.map(
        profile =>
          `- ${profile.name ?? '(unnamed)'} | ${profile.chromeInstanceId ?? '-'} | last seen ${formatTime(profile.lastSeen)}` +
          (profile.deleted ? ' | deleted' : ''),
      ),
      '',
      `## Rules (${background.rules.length})`,
      ...background.rules.map(
        rule => `- ${rule.regex} -> ${rule.targetUserprofile ?? '-'}` + (rule.deleted ? ' | deleted' : ''),
      ),
      '',
      `## Recent tabs (last ${RECENT_TAB_COUNT})`,
      ...(background.recentTabs.length === 0
        ? ['(empty)']
        : background.recentTabs.map(
            tab => `- tab ${tab.tabId} | ${tab.status} | ${tab.url} | ${tab.targetUserprofile ?? '-'}`,
          )),
      '',
      '## Service worker log',
      ...formatLog(background.log),
    );
  } else {
    lines.push('', '(The service worker did not answer; only this page\'s own state is included.)');
  }

  lines.push('', `## ${page.context} log`, ...formatLog(page.log), '');
  return lines.join('\n');
}
