// Match patterns for the content script that bridges the web app and the
// extension (group code hand-over). Restricted to the web app's own origin
// (WXT_CONFIG_URL), so no other site - in particular no other Azure Static
// Web App - can read or overwrite the group code through the bridge.
//
// The port is dropped: WXT's dev-mode content-script reload logic rejects a
// port in a match pattern, and a pattern without one matches any port, so a
// localhost build still matches whichever port the app dev server ends up on.
//
// extraUrls (WXT_CONTENT_SCRIPT_EXTRA_URLS, comma-separated) whitelists further
// origins the same web app is served from, such as a custom domain.
export function contentScriptMatches(configUrl: string | undefined, extraUrls?: string): string[] {
  if (!configUrl) {
    throw new Error('WXT_CONFIG_URL is not set; cannot derive content script matches');
  }
  const extras = (extraUrls ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(s => s !== '');
  const patterns = [configUrl, ...extras].map(toMatchPattern);
  return [...new Set(patterns)];
}

function toMatchPattern(rawUrl: string): string {
  const url = new URL(rawUrl);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`Content script url must be http(s), got ${rawUrl}`);
  }
  if (url.protocol === 'http:' && !isLocalHost(url.hostname)) {
    throw new Error(`Content script url must use https outside localhost, got ${rawUrl}`);
  }
  return `${url.protocol}//${url.hostname}/*`;
}

function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}
