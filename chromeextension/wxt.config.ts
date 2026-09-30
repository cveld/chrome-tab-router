import { execSync } from 'node:child_process';
import { defineConfig } from 'wxt';

// Short commit hash (+ "-dirty" with uncommitted changes) for the build stamp
// logged by src/Shared/buildInfo.ts.
function gitCommit(): string {
  try {
    const hash = execSync('git rev-parse --short HEAD').toString().trim();
    const dirty = execSync('git status --porcelain').toString().trim() !== '';
    return dirty ? `${hash}-dirty` : hash;
  } catch {
    return 'unknown';
  }
}

// Dev-only pages, reachable via the "Development" item in the extension
// icon's context menu (src/Background/devMenuHandler.ts). Dropped, together
// with the contextMenus permission, from production builds.
const DEV_ENTRYPOINTS = ['dev', 'badge-preview', 'groupcode-scenario'];

// Computed once so every entrypoint of one build logs the same stamp.
const buildTime = new Date().toISOString();
const buildCommit = gitCommit();

// See https://wxt.dev/guide/essentials/config/manifest.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    define: {
      __BUILD_TIME__: JSON.stringify(buildTime),
      __BUILD_COMMIT__: JSON.stringify(buildCommit),
    },
  }),
  manifest: ({ mode, command }) => ({
    // Non-production builds carry their mode (and "serve" for the dev server)
    // in the name, so side-by-side unpacked installs are told apart on
    // chrome://extensions and in the toolbar tooltip.
    name:
      mode === 'production'
        ? 'Chrome Tab Router'
        : `Chrome Tab Router (${mode}${command === 'serve' ? ' serve' : ''})`,
    description: 'Routes urls to desired user profiles',
    // Required for the WebSocket-keeps-service-worker-alive behavior the
    // background script's SignalR connection relies on (Chrome 116+).
    minimum_chrome_version: '116',
    permissions: [
      'storage',
      'tabs',
      'webNavigation',
      'alarms',
      ...(mode === 'production' ? [] : ['contextMenus']),
    ],
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
  }),
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
  hooks: {
    // WXT names the output folder after the mode only, so `wxt` (dev server)
    // and `wxt build` in the same mode would overwrite each other's files.
    // Give the dev server its own folder: chrome-mv3-dev-serve,
    // chrome-mv3-azure-serve, ... Built folders keep their names.
    'config:resolved': wxt => {
      if (wxt.config.command === 'serve') {
        wxt.config.outDir = `${wxt.config.outDir}-serve`;
      }
    },
    // Keep the dev-only pages out of the production build that `npm run zip`
    // ships to the Chrome Web Store.
    'entrypoints:resolved': (wxt, entrypoints) => {
      if (wxt.config.mode !== 'production') {
        return;
      }
      for (let i = entrypoints.length - 1; i >= 0; i--) {
        if (DEV_ENTRYPOINTS.includes(entrypoints[i]!.name)) {
          entrypoints.splice(i, 1);
        }
      }
    },
  },
});