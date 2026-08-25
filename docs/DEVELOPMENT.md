# Development

This repository is a Chrome extension monorepo with three npm projects:

- `app/`
- `api/`
- `chromeextension/`

This guide is for setting up the repo locally for the first time and running the projects during
development.

## Prerequisites

Before you start, make sure you have:

- **Node.js and npm**
- **Azure Functions Core Tools** (`func` CLI)
  Required to run `api/` locally via `func start`
- **An Azure SignalR Service instance and connection string**
  Required if you want real-time sync features to work locally
- **Google Chrome**
  Required to load the extension as an unpacked extension

## First-time setup

1. Install dependencies for all three projects from the repo root:

   ```bash
   npm run install:all
   ```

   This installs dependencies in this order:

   1. `chromeextension`
   2. `api`
   3. `app`

2. Create the local API settings file:

   ```bash
   cp api/local.settings.sample.json api/local.settings.json
   ```

3. Edit `api/local.settings.json` and fill in:

   - `AzureSignalRConnectionString` — the connection string for your Azure SignalR Service
     instance
   - `EncryptionKey` — any secret string

   `EncryptionKey` is used by `api/Utility/encryption.ts` to AES-encrypt/decrypt group-code/auth
   payloads. Both `encrypt()` and `decrypt()` throw immediately if `process.env.EncryptionKey`
   is unset.

4. Review the CORS settings in `api/local.settings.json`.

   The sample file sets:

   - `Host.CORS = http://localhost:8080,https://azure-samples.github.io`
   - `CORSCredentials = true`

   This looks like leftover starter-template configuration and may need updating for local
   browser testing, since the Angular app runs on `http://localhost:4200`.

## Running everything at once

From the repo root:

```bash
npm run watch:all
```

This runs the following in parallel:

- the Azure Functions host for `api/`
- `chromeextension` dev build (`wxt`, watch mode with HMR)
- `app` dev server (Vite, http://localhost:4200)

Typical local development flow:

1. Run `npm run install:all` once
2. Configure `api/local.settings.json`
3. Run `npm run watch:all`
4. Load `chromeextension/.output/chrome-mv3` as an unpacked extension in Chrome
5. Reload the extension in `chrome://extensions` after background/content script changes

Notes:

- The WXT dev build rebuilds automatically on file changes; the options page reloads via HMR
- Chrome does **not** automatically pick up background/content script changes; you must
  manually reload the extension

## Running a single piece

### `api/`

Setup:

1. Copy the sample settings file:

   ```bash
   cp api/local.settings.sample.json api/local.settings.json
   ```

2. Set `AzureSignalRConnectionString` and `EncryptionKey`.

Commands:

- Build (webpack production build):

  ```bash
  npm run build
  ```

- Watch (webpack dev watch mode):

  ```bash
  npm run watch
  ```

- Start locally:

  ```bash
  npm start
  ```

  This runs `func start`. There is also a `prestart` step that runs `npm run build` first.

- Test:

  ```bash
  npm test
  ```

  Currently a no-op placeholder; there are no real tests in `api/`.

### `app/`

`app/` is a Vite + React single-page app.

Commands:

- Start:

  ```bash
  npm run dev
  ```

  Serves the app at `http://localhost:4200`. Port 4200 is load-bearing: the extension's content
  script matches `http://localhost/*`. `/api` requests are proxied to `http://localhost:7071`
  with a fake `x-ms-client-principal` header so `/api/groupcode` works against a locally running
  Functions host.

- Build:

  ```bash
  npm run build
  ```

  Production build to `dist/app` — the output path the Azure Static Web Apps workflow expects.

- Typecheck:

  ```bash
  npm run typecheck
  ```

Important local behavior:

- The app depends on the `api/` functions being reachable through the dev-server proxy for
  `/api/groupcode`
- `/.auth/me` is an Azure Static Web Apps platform feature and is **not** available when running
  only the Vite dev server or `func start` locally; the auth card will report an error by design
- The full auth flow only works once deployed to Azure Static Web Apps, or when using the Azure
  Static Web Apps CLI (`swa`), which is **not** part of this repo's current tooling

### `chromeextension/`

`chromeextension/` uses [WXT](https://wxt.dev) (Vite-based), React and vitest.

The backend/API base URL is selected per mode via env files (`WXT_API_BASE_URL`,
`WXT_CONFIG_URL` in `.env`, `.env.azure`, `.env.production`):

Commands:

- Dev build with HMR, against localhost (`.env`):

  ```bash
  npm run dev
  ```

- Dev build against the deployed Azure backend (`.env.azure`):

  ```bash
  npm run dev:azure
  ```

- Dev build against a locally running Functions host (`.env.localfunc`):

  ```bash
  npm run dev:localfunc
  ```

- Production build:

  ```bash
  npm run build
  ```

- Production build + zip (used before publishing to the Chrome Web Store):

  ```bash
  npm run zip
  ```

- Run all tests:

  ```bash
  npm test
  # or
  npx vitest run
  ```

- Run a single test file:

  ```bash
  npx vitest run path/to/file.test.ts
  ```

- Typecheck:

  ```bash
  npx tsc --noEmit
  ```

- Format TypeScript files:

  ```bash
  npm run style
  ```

Build output note:

- Builds are written to `.output/chrome-mv3` (production) or `.output/chrome-mv3` during dev;
  load that folder as an unpacked extension

## Loading the extension in Chrome

After starting a dev or production build:

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select `chromeextension/.output/chrome-mv3`

During development:

- Reload the extension manually in `chrome://extensions` after background/content script
  changes
- For options page changes made while `wxt` is running, the page picks up updates via HMR

## Known rough edges

- **CORS settings may not match the local app origin.**
  `api/local.settings.sample.json` uses `http://localhost:8080,https://azure-samples.github.io`,
  but the app runs on `http://localhost:4200`. You may need to update CORS for local browser
  testing against the Functions host.

- **Auth does not fully work with `func start` alone.**
  The app expects `/.auth/me`, which is an Azure Static Web Apps platform feature. That endpoint
  is not available when only running the local Functions host. The full auth flow works once
  deployed to Azure Static Web Apps, or via the Azure Static Web Apps CLI (`swa`), which is not
  part of the current repo tooling.
