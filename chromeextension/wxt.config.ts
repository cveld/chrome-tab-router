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
  // Local dev only. WXT injects `dev.server.origin` into the extension's
  // manifest CSP (script-src) so the HMR client can load. Chrome's MV3
  // validator only allows 'self'/'wasm-unsafe-eval' there plus one carve-out
  // for unpacked extensions: the literal http://localhost or http://127.0.0.1
  // host (any port) — no other scheme or hostname passes, so this can't be
  // routed through a Caddy `*.localhost` HTTPS proxy. Pin the port so it's
  // predictable across restarts.
  dev: {
    server: {
      port: 3001,
    },
  },
});