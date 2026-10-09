/** The options page tabs, in display order. The key is also the url hash: options.html#connection. */
export const TAB_KEYS = ['welcome', 'connection', 'userprofiles', 'rules', 'log', 'settings'] as const;

export type TabKey = (typeof TAB_KEYS)[number];

export const DEFAULT_TAB: TabKey = 'welcome';

// Tabs that were merged into another one keep working for old links.
const ALIASES: Record<string, TabKey> = { groupcode: 'connection' };

/** The tab a url hash such as `#connection` points at; the default for an empty or unknown one. */
export function tabFromHash(hash: string): TabKey {
  const key = hash.replace(/^#\/?/, '').toLowerCase();
  const tab = TAB_KEYS.find(candidate => candidate === key) ?? ALIASES[key];
  return tab ?? DEFAULT_TAB;
}

export function hashForTab(tab: TabKey): string {
  return `#${tab}`;
}
