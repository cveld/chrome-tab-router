# AGENTS.md

Guidance for AI coding agents working with code in this repository.

## Project overview

Chrome Tab Router is a Chrome extension that routes incoming links to a preferred Chrome user
profile: when a URL is opened in the "wrong" profile, it's handed off to the profile configured
to own it. Published at the Chrome Web Store (see README.md).

The repo is a monorepo of three independent npm projects, orchestrated from the root:

- `app/` — Vite + React single-page app for an Azure Static Web App. Handles login (via Static
  Web Apps' built-in `/.auth/me`) and issuing/displaying the shared group code, and hands the
  group code to the extension through a window-event bridge.
- `api/` — Azure Functions (TypeScript, v4 programming model, Node 22+/LTS) backing the static web app:
  SignalR negotiate + message relay, group code issuance, AES encryption of the auth payload.
- `chromeextension/` — the extension itself: Manifest V3, built with WXT (Vite-based). React
  19 background/content/options/router entrypoints under `entrypoints/`; shared logic under `src/`
  (`src/UI/` holds the React code both extension pages share).

The extension's management UI (rules, user profiles, tab log, connection status) is a React app
in `chromeextension/entrypoints/options/`, opened as a full tab via
`chrome.action.onClicked` → `chrome.runtime.openOptionsPage()` — it is **not** a browser-action
dropdown. The old separate Angular popup app (`chromeextension/popup/`) has been removed; its
functionality now lives in the React options page.

## Commands

Root (orchestrates all three projects via `npm-run-all`):
- `npm run install:all` — install dependencies for all three projects.
- `npm run watch:all` — run the Functions host, the extension dev build (`wxt`), and the Vite
  `app` in parallel.
- `npm run chromeextension:prod` — production zip of the extension (WXT build + zip).
- `npm run chromeextension:build:dev` / `:build:azure` / `:build:localfunc` — forward to the
  matching `chromeextension/` unpacked builds.

`api/` (requires the Azure Functions Core Tools `func` on PATH; copy
`local.settings.sample.json` to `local.settings.json` and fill in `AzureSignalRConnectionString`
and `EncryptionKey` first):
- `npm run build` — tsc compile to `dist/`.
- `npm run watch` — `tsc --watch`; a running host picks up changes via `watchDirectories`.
- `npm start` — rebuild + `func start` on http://localhost:7071.
- `npm test` — no-op; there are no real tests for `api/`.

`app/` (Vite + React):
- `npm run dev` — dev server on port 4200 with `/api` proxied to a local Functions host.
- `npm run build` — production build to `dist/app` (the path the SWA workflow expects).
- `npm run typecheck`.

`chromeextension/` (WXT + React + vitest):
- `npm run dev` — dev server with HMR against `.env` URLs; writes a `-serve` folder.
- `npm run dev:azure` / `npm run dev:localfunc` — same, against `.env.azure` /
  `.env.localfunc` URLs.
- `npm run build:dev` / `npm run build:localfunc` / `npm run build:azure` — self-contained
  unpacked builds (`.output/chrome-mv3-dev`, `-localfunc`, `-azure`) for those backends.
- Non-production builds are named `Chrome Tab Router (<mode>)` (`(<mode> serve)` for the dev
  server) so side-by-side unpacked installs can be told apart; production keeps the plain name.
- Never load a `-serve` folder by hand: it needs the running dev server (a `config:resolved`
  hook in `wxt.config.ts` adds the suffix so `wxt` and `wxt build` never share a folder).
- `.env.azure` targets production; for a pre-prod or PR staging backend set
  `WXT_API_BASE_URL` / `WXT_CONFIG_URL` in gitignored `.env.azure.local`.
- `npm run build` — production build to `.output/chrome-mv3`.
- `npm run zip` — production build + zip (pre-publish).
- `npm test` / `npx vitest run` — run all tests; `npx vitest run path/to/file.test.ts` for a
  single file.
- `npx tsc --noEmit` — typecheck (the generated `.wxt/tsconfig.json` lacks `jsx`; the project
  tsconfig adds it).
- `npm run style` — prettier over the source files.

Every extension context logs a build stamp at startup (`src/Shared/buildInfo.ts`: version, mode,
build time, git commit with `-dirty` flag, API base URL), so a console shows which build is loaded.

Log through `createLogger(scope)` from `src/Shared/logger.ts` rather than `console.*` (the content
script is the exception). It filters by the log level (storage key `logLevel`, picked on the
Settings tab, followed by every context via `registerLogLevelSync()` in `logStorage.ts`) and keeps
the last 500 entries in a ring buffer with tokens and group code signatures redacted; the service
worker's buffer is mirrored to `chrome.storage.session` so it survives worker restarts. Never log
a raw group code or full tab URL (use `urlOrigin()`); the buffer ends up in bug reports.

After building `chromeextension/`, load `chromeextension/.output/chrome-mv3` as an unpacked
extension via `chrome://extensions` (Developer mode).

## Architecture

### Cross-profile routing flow

1. In the options page UI, a user defines **rules** (regex → target Chrome profile name) and
   registers each Chrome profile as a **user profile**. Both are persisted to
   `chrome.storage.local` per-profile and synced across profiles over an Azure SignalR hub
   (`chat`), scoped by a shared **group code**.
2. When a new tab opens, `handleTargetUrl()` in `tabUpdateHandler.ts` matches the URL against the
   rules (`checkUrl()` in `rulesHandler.ts`). If `shouldPromptInterstitial()` allows it, the tab is
   redirected to `router.html?url=<encoded>` and logged as `Prompting`; otherwise the URL is routed
   straight away with an `openurl` SignalR message, as before. Prompting is skipped when the mode is
   `off`, when the matching rule targets the current profile, or when no other user profiles are
   registered.
3. The target profile's background script receives `openurl`, opens the tab locally, and sends
   `removetab` back so the source profile closes the original tab — which is also how the router
   page's own tab disappears once a hand-over succeeds. All of this is coordinated in
   `chromeextension/src/Background/tabUpdateHandler.ts`, which also keeps a status log
   (`ITabStatus[]`) shown in the Log tab.
4. Group codes are minted server-side (`api/src/functions/groupcode`) from the Static Web Apps client
   principal, AES-encrypted (`api/Utility/encryption.ts`), and used both as the SignalR `userId`
   and as a shared secret so only extension instances in the same group can talk to each other.
   `api/negotiate` decrypts the `groupcodeauthorization` header and cross-checks it against the
   `groupcode` header before issuing SignalR connection info.

### `chromeextension/src/Background/*`

There is no central orchestrator — each module exposes a `register*()` function called
synchronously from `defineBackground()` in `entrypoints/background.ts`. When tracing a feature,
start from the relevant handler module rather than `background.ts`. Constraint: WXT evaluates
the background entrypoint in Node to read its config, so no `chrome.*` call may run outside
`main()`/`register*()`.

- `signalr.ts` — owns the `HubConnection` lifecycle (`connectionStatus`, `connection`
  `BehaviorSubject`s), rebuilds the connection whenever `groupcode` changes, reconnects with
  backoff (`[0, 5, 15, 30, 60]`s, resetting after 5 minutes idle), and keeps the service worker
  alive via WebSocket traffic (15s keepAlive; Chrome 116+).
- `signalrmessages.ts` — pub/sub (`addHandler` / `sendSignalrMessage`) layered on the raw hub
  connection; all cross-profile messages go through this.
- `rulesHandler.ts` / `rulesHandlerUtility.ts` — owns the `rules` array; `mergeRules()`
  reconciles local vs. remote rule sets by `updated` timestamp and honors soft-deletes for
  3 months before dropping them.
- `userprofilesHandler.ts` / `userprofileHandlerUtility.ts` — the same merge pattern for
  `userprofiles`, keyed by `chromeInstanceId`.
- `BackgroundGroupcodeHandler.ts` / `BackgroundChromeInstanceIdHandler.ts` /
  `chromeprofileNameHandler.ts` — identity/config plumbing (group code, per-install instance id,
  resolved profile display name).
- `chromestorage.ts` — a `listeners` map most handlers use to react to `chrome.storage.local`
  changes instead of a shared store.
- `interstitialSettingsHandler.ts` — owns the router page settings under storage key `settings`
  (`{ mode: 'off' | 'matched' | 'always', countdownSeconds }`). Machine-local by design: unlike
  rules and userprofiles they are never synced over SignalR.
- `badgeStatusHandler.ts` — derives the red `!` icon badge (`computeBadgeStatus()` in
  `src/Shared/BadgeStatusModels.ts`: missing group code > message error > not connected). A first
  attempt (`init`/`connecting` without error) is `connecting`, not a problem: the banner shows a
  blue "Connecting…" and then a short green "Connected"; a backoff retry keeps the previous error
  so a failing connection stays red. It broadcasts the status as `badgestatus`; the options page (opened by clicking the icon) explains it in
  `BadgeStatusBanner` with a button to the matching tab.
- `devMenuHandler.ts` — non-production builds only: a "Development" item in the icon's context
  menu opens `entrypoints/dev/` (`dev.html`), a hub listing dev-only tools (`DEV_TOOLS` in
  `DevPage.tsx`) plus build info. Tools: `entrypoints/badge-preview/`, a simulator for every
  badge state, and `entrypoints/groupcode-scenario/`, a timed replay of pasting a group code
  (connecting, then success or failure); both share the mocks in `badge-preview/MockChrome.tsx`.
  `DEV_ENTRYPOINTS` in `wxt.config.ts` drops these pages, and the manifest drops the
  `contextMenus` permission, in `production` mode; register a new dev page in both lists.
- `diagnosticsHandler.ts` — answers `getdiagnostics` with `diagnostics` (`IBackgroundDiagnostics`
  in `src/Shared/DiagnosticsModels.ts`): status, profiles, rules, recent tabs (origins only) and
  the log buffer. The Settings tab's "Copy diagnostics" button (`src/UI/diagnostics.ts`) merges
  it with the page's own log into a text report; without an answer within 3s it copies the page
  state alone.

### Messaging layers

Two distinct channels, in `chromeextension/src/Messaging/`:
- `ChromeMessaging.ts` — background ↔ content script, via `chrome.runtime.sendMessage`.
- `BackgroundChromeMessagingPort.ts` / `ScriptChromeMessagingPort.ts` — background ↔ extension
  pages (options page and router page), via a long-lived `chrome.runtime.connect` port on channel
  `'popup'` (historical name); singletons per channel name. Background→page messages are broadcast
  to every connected port. The UI side's stores/handlers live in `src/UI/backgroundStores.ts`.
  The page side reconnects with backoff when the port drops (service worker restarted or never
  started), queues outgoing messages meanwhile, and re-sends the initial `get*` requests via
  `onReconnect`; `backgroundConnectionStore` drives the "background not reachable" banner.

The web app ↔ content script bridge (`DocumentEventing.ts`) reports a failed
`chrome.runtime.sendMessage` to the page as a `backgroundunreachable { error }` event instead
of an empty answer. A fresh Chrome Web Store install has been seen to leave the service worker
permanently inactive until the extension is toggled off/on at chrome://extensions.

The content script only runs on the web app's own origin: `contentScriptMatches()`
(`src/Shared/contentScriptMatches.ts`) derives its match pattern from `WXT_CONFIG_URL` at build
time (port dropped, so localhost builds match any port), plus the comma-separated
`WXT_CONTENT_SCRIPT_EXTRA_URLS` (production whitelists the custom domain
`chrome-tab-router.carlintveld.nl` this way). Never widen it to
`*.azurestaticapps.net`: any Static Web App could then read or overwrite the group code.

Shared message/data contracts live in `chromeextension/src/Shared/*Models.ts` (`IRule`,
`IUserProfileStatus`, `ITabStatus`, SignalR message types) — check these first when changing any
cross-context message shape.

### Extension UI (`entrypoints/options/`, `entrypoints/router/`, `src/UI/`)

React 19 function components; state comes from small external stores (`src/UI/stores.ts`) fed by
the port messaging layer (`src/UI/backgroundStores.ts`). Everything both pages share — those two
stores modules, `components/Modal.tsx`, `components/RuleDialog.tsx` and the dependency-free
`main.css` (no Bootstrap/UI kit) — lives in `src/UI/`; only page-specific code stays under
`entrypoints/`.

Options page tabs: Welcome, Groupcode, Connection, User profiles, Rules, Log, Settings.

The router page (`entrypoints/router/`, built as `router.html`) is the interstitial a routed tab
lands on. It reads the original URL from the `url` query parameter, re-runs `findMatchingRule()`
locally, and either counts down before routing or waits for a manual choice. It sends two messages
of its own over the `'popup'` port: `routetab` (hand the URL to another profile) and `opentabhere`
(load the original URL in this tab, logged as `Cancelled`). Adding or editing a rule from the page
goes through the same `addRule()` / `changeRule()` commands the Rules tab uses, so a new match
re-arms the countdown.

### `api/`

Azure Functions v4 programming model: every function registers itself via
`app.http(...)` in `src/functions/<name>.ts`, compiled by plain `tsc` to
`dist/functions/*.js` (matched by the `main` glob in package.json). No webpack,
no `function.json`; bindings are declared in code:

- `groupcode` — reads the Static Web Apps `x-ms-client-principal` header, stamps a fresh
  groupcode (uuid) onto it, signs it via `encrypt()`, returns
  `{ clientprincipalname, signature, encoded }`. Responds 401 if the header is absent.
- `negotiate` — signalRConnectionInfo input binding (hub `chat`, userId from the
  `groupcode` header) plus validation of `groupcode` / `groupcodeauthorization`
  (error codes A0/A1/A2/A3). Must stay enabled (it was disabled 2021-2026 and
  broke everything). Like in v1, requests without those headers fail inside the
  binding resolution itself with a bare 500.
- `messages` — decrypts `groupcodeauthorization` and returns a SignalR output-binding message
  (`userId`, `target`, `arguments`), which is how one client's rules/userprofiles/`openurl`
  messages get relayed to the rest of the group.
- `src/utility/encryption.ts` — AES (`crypto-js`) encrypt/decrypt using `process.env.EncryptionKey`;
  both directions throw synchronously if the key is unset.

### `app/`

Thin React shell (no router): `stores/authStore.ts` calls `/.auth/me` and exposes the login
state; `stores/groupcodeStore.ts` fetches `/api/groupcode` and relays the group code to/from a
content script via `window` CustomEvents (`src/messaging/documentEventing.ts`, contract shared
with the extension's `DocumentEventing.ts`), so a logged-in browser tab can hand the group code
to the extension running in that same Chrome profile. `app/public/staticwebapp.config.json`
rewrites all non-asset routes to `index.html` (SPA fallback).

### Deployment

`.github/workflows/azure-static-web-apps-*.yml` builds and deploys `app/` and `api/` together as
one Azure Static Web App on push to `main` / PRs. `chromeextension/` is not part of this
pipeline — it is built/published to the Chrome Web Store manually (`npm run zip`).

## Local end-to-end test against a locally running Function App

The extension talks straight to the Functions host over SignalR (`{apiBaseUrl}/api`),
so no web app or Static Web App EasyAuth is needed to exercise the backend:

1. `cd api`: copy `local.settings.sample.json` to `local.settings.json` and fill in
   `AzureSignalRConnectionString` + `EncryptionKey` (the deployed values live in the
   Static Web App's app settings). Then run `func start` on http://localhost:7071
   from the `api` dir. A supported Node LTS is fine (Node 22/24 work; the old note
   that the worker rejects Node 24 is outdated). `npm run watch:all` starts `func` for you.
2. `node scripts/mint-groupcode.cjs` mints a test group code blob (same AES scheme as
   `api/src/functions/groupcode`). Paste the printed one-liner into the extension service-worker
   console; setting `chrome.storage.local` triggers an immediate SignalR reconnect.
3. `cd chromeextension && npm run build:localfunc` builds `.output/chrome-mv3-localfunc`
   with `WXT_API_BASE_URL=http://localhost:7071` (from `.env.localfunc`; `dev:localfunc`
   exists too). Load it via chrome://extensions > Load unpacked.
4. Optional, for the groupcode flow: `cd app && npm run dev` serves the webapp on
   http://localhost:4200 (plain Node is fine; no version pinning needed since the Vite
   migration). `vite.config.ts` injects a fake `x-ms-client-principal` header on `/api`
   so Generate works without Static Web Apps EasyAuth; the content script matches
   `http://localhost/*`, so a generated group code is handed to the extension automatically.
5. `node scripts/smoke-test.js [groupcode-uuid]` verifies negotiate + messages without
   a browser.

Caveats: `negotiate` must stay enabled, and host.json needs extension bundle `[4.*, 5.0.0)`
on the v4 runtime. A locally minted group code has a unique uuid, so local tests don't crosstalk
with instances connected against the deployed backend sharing the same SignalR hub.
