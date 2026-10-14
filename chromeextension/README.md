# Chrome Tab Router Chrome Extension

MV3 extension (built with [WXT](https://wxt.dev)) that routes URLs to the desired
user profiles.

## Prerequisites

* [node + npm](https://nodejs.org/) (Current / LTS version)

## Setup

```
npm install
```

## Develop

Run WXT in watch mode with HMR:

```
npm run dev
```

The dev server runs on `http://chrome-tab-router.localhost:3001` (proxied through
Caddy; see the `Caddyfile`). It writes `.output/chrome-mv3-dev-serve` and opens it in its
own Chrome instance with a temporary profile. To load the extension into your own Chrome
profiles, run `npm run build:dev` and load `.output/chrome-mv3-dev` as an unpacked extension.

## Build

```
npm run build
```

Output is written to `.output/chrome-mv3`, which can be loaded as an unpacked
extension. Use `npm run zip` to produce a distributable `.zip`.

There are also variants that target the remote Azure backend (`npm run dev:azure`
/ `npm run build:azure`) and the local Function App (`npm run dev:localfunc` /
`npm run build:localfunc`).

## Test

```
npm test
```

Unit tests run with Vitest. Formatting is handled by Prettier (`npm run style`).

## Driving tabs from automation tools (e.g. chrome-relay)

A tool that drives tabs directly (`chrome.tabs.create`/`chrome.tabs.update` over
`chrome.debugger`, for example) goes through routing like any other new tab - there is no way to
tell it apart from a user opening a link. To open a url without that happening, drive the
extension's own web-app bridge instead of the Tabs API:

1. Navigate a tab to the web app's origin (the host configured for your build - see
   `contentScriptMatches()` in `src/Shared/contentScriptMatches.ts`, e.g.
   `https://chrome-tab-router.carlintveld.nl/`). That host is excluded from routing (see
   `isBridgeUrl()` in the same file), so it loads straight away, interstitial-free.
2. On that page, dispatch:
   ```js
   document.dispatchEvent(new CustomEvent('chrome-tab-router-content', {
     detail: { type: 'openUrlHere', payload: { url: 'https://example.com/' } },
   }))
   ```
   The content script (`src/Content/ContentOpenUrlHandler.ts`) forwards this to the background
   (`src/Background/openUrlHandler.ts`) via a normal same-extension message; the background
   identifies "this tab" from the message's own sender and swaps it to the requested url with
   `chrome.tabs.update()`, which never raises `chrome.tabs.onCreated` and so never re-enters
   routing either.

`../skills/chrome-tab-router/open-url-bypassed.ps1` wraps both steps for the
[chrome-relay](https://chromewebstore.google.com/detail/chrome-relay/cpdiapbifblhlcpnmlmfpgfjlacebokb)
CLI:

```powershell
./skills/chrome-tab-router/open-url-bypassed.ps1 -Profile <chrome-relay profile> -Url "https://example.com/"
```

The same folder is an agent skill (`SKILL.md`) that teaches agents to combine chrome-relay with
this bypass; see "AI agent skills" in `docs/DEVELOPMENT.md`.

## Project Structure

* `entrypoints/` — WXT entrypoints: `background.ts`, `content.ts`, and the React
  `options/` page.
* `entrypoints/options/components/` — React UI components for the options page.
* `src/Background/` — background service-worker logic (rules, user profiles,
  SignalR, tab routing, badge/watchdog handlers).
* `src/Content/` — content-script logic.
* `src/Messaging/` — messaging between background and content scripts.
* `src/Shared/` — shared models shared across background/content/options.
