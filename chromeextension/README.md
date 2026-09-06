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
Caddy; see the `Caddyfile`). Load `.output/chrome-mv3-dev` as an unpacked
extension in Chrome.

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

## Project Structure

* `entrypoints/` — WXT entrypoints: `background.ts`, `content.ts`, and the React
  `options/` page.
* `entrypoints/options/components/` — React UI components for the options page.
* `src/Background/` — background service-worker logic (rules, user profiles,
  SignalR, tab routing, badge/watchdog handlers).
* `src/Content/` — content-script logic.
* `src/Messaging/` — messaging between background and content scripts.
* `src/Shared/` — shared models shared across background/content/options.
