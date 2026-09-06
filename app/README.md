# Chrome Tab Router web app

Small Vite + React single-page app that runs on an Azure Static Web App next to the
`api/` Functions backend.

Responsibilities:

- Show EasyAuth status (`/.auth/me`) with login/logout links
- Mint a shared group code via `/api/groupcode` (or accept a pasted one)
- Hand the group code to the Chrome Tab Router extension through a window-event bridge
  to the extension's content script (see `src/messaging/documentEventing.ts`; the
  extension-side counterpart lives in `chromeextension/src/Messaging/DocumentEventing.ts`)

## Commands

- `npm run dev` — dev server on http://localhost:4200 (port is load-bearing: the
  extension content script matches `http://localhost/*` and `chromeextension/.env`
  points `WXT_CONFIG_URL` here). `/api` is proxied to a locally running Functions host
  with a fake `x-ms-client-principal` header.
- `npm run build` — production build to `dist/app` (the path the Static Web Apps
  workflow expects).
- `npm run typecheck`

Note: `/.auth/me` only works when served by Azure Static Web Apps (or the SWA CLI);
against a bare dev server it will report an error by design.
