import { defineConfig } from 'wxt';

// See https://wxt.dev/guide/essentials/config/manifest.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Chrome Tab Router',
    description: 'Routes urls to desired user profiles',
    // Required for the WebSocket-keeps-service-worker-alive behavior the
    // background script's SignalR connection relies on (Chrome 116+).
    minimum_chrome_version: '116',
    permissions: ['storage', 'tabs', 'webNavigation', 'alarms'],
    // Rule routing must be able to inspect the URL of any tab, not just the
    // two content-script origins below, so this can't be narrowed further.
    host_permissions: ['<all_urls>'],
    action: {},
    // options_ui.open_in_tab is set via a <meta> tag on
    // entrypoints/options/index.html instead (WXT's documented mechanism
    // for per-entrypoint manifest config), not duplicated here.
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'",
    },
  },
  // Local dev only. Vite/HMR binds to localhost:3001, but the extension's
  // bundled runtime code (options page, HMR client) is told to reach it via
  // http://chrome-tab-router.localhost instead, proxied through Caddy —
  // see Caddyfile route below. `*.localhost` resolves to 127.0.0.1 without
  // any hosts-file edits.
  dev: {
    server: {
      port: 3001,
      origin: 'http://chrome-tab-router.localhost',
    },
  },
});
