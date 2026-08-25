# Chrome Tab Router Architecture

Chrome Tab Router is a small monorepo that combines a Chrome extension with a lightweight
Azure-backed web app. Its job is simple: when a tab opens in the "wrong" Chrome profile, the
extension can hand that URL off to the preferred profile based on user-defined routing rules.

This document explains how the main pieces fit together and why they exist, so a new developer
can orient themselves before reading code.

## Components

The repository is a monorepo with **3 independent npm projects**.

### `app/`

Angular 11 front-end for an **Azure Static Web App**.

Responsibilities:

- Handles login using Static Web Apps' built-in `/.auth/me`
- Displays and issues the shared **group code**
- Relays the group code to the extension through a content-script bridge

Relevant details:

- `AzureAuthentication` calls `/.auth/me` and exposes an `isLoggedIn` observable
- `GroupcodeHandler` fetches `/api/groupcode`
- `GroupcodeHandler` also relays the group code to/from a content script via `window` events, so
  a logged-in browser tab can pass the group code to the extension in the same Chrome profile
- `app/staticwebapp.config.json` rewrites non-asset routes to `index.html` for SPA routing,
  except:
  - `/images/*.{png,jpg,gif}`
  - `/css/*`

### `api/`

Azure Functions backend for the static web app.

Characteristics:

- Node/TypeScript
- webpack-bundled

Responsibilities:

- Mints the **group code**
- Validates clients before issuing SignalR connection info
- Relays messages into Azure SignalR

Key endpoints:

- `api/groupcode`
  - Builds a group code from the Azure Static Web Apps client principal (`x-ms-client-principal`)
  - Stamps it with a fresh UUID
  - Encrypts/signs it using `api/Utility/encryption.ts` and `process.env.EncryptionKey`
- `api/negotiate`
  - Validates `groupcode` / `groupcodeauthorization`
  - Decrypts the authorization payload
  - Cross-checks the embedded group code against the header
  - Returns SignalR connection info
  - Note: must stay enabled — the SignalR client cannot connect without it
- `api/messages`
  - Generic relay into the SignalR hub
  - Decrypts `groupcodeauthorization`
  - Returns a SignalR output-binding message `{ userId, target, arguments }`

### `chromeextension/`

The Chrome extension itself, using **Manifest V3**, built with [WXT](https://wxt.dev)
(Vite-based).

Responsibilities:

- Watches navigation events
- Matches URLs against routing rules
- Coordinates cross-profile handoff through SignalR
- Hosts the background script, content script, and the management UI

Layout:

- `entrypoints/background.ts` — service worker entrypoint; calls the `register*()` function of
  every module under `src/Background/*`
- `entrypoints/content.ts` — content script entrypoint
- `entrypoints/options/` — the management UI: a React app opened in a full tab when the toolbar
  icon is clicked (`chrome.action.onClicked` → `chrome.runtime.openOptionsPage()`)
- `src/Background/*`, `src/Messaging/*`, `src/Shared/*` — shared logic, messaging layers and
  message contracts used by both background and UI

Environment variables (`WXT_API_BASE_URL`, `WXT_CONFIG_URL`) are defined per mode in `.env`,
`.env.azure` and `.env.production`; see `src/Background/settings.ts`.

## Core concepts

### Rule

A rule maps a URL pattern to a target Chrome profile.

Shape:

```ts
{ regex, targetUserprofile, id, updated, deleted }
```

Meaning:

- `regex`: URL match pattern
- `targetUserprofile`: instance id of the Chrome profile that should handle matching URLs
- `id`: stable identifier for merge/sync
- `updated`: timestamp used during conflict resolution
- `deleted`: soft-delete marker

### User profile

A user profile represents one installed instance of the extension, which in practice means one
Chrome profile.

Shape:

```ts
{ name, chromeInstanceId, connectionId, lastSeen, updated, deleted }
```

Meaning:

- `name`: human-readable profile name
- `chromeInstanceId`: per-install/profile identifier
- `connectionId`: current SignalR connection identifier
- `lastSeen`: liveness timestamp
- `updated`: timestamp used during merge
- `deleted`: soft-delete marker

### Group code

The group code is the mechanism that scopes which extension instances may talk to each other.

It acts as both:

- a shared identifier for a group of related Chrome profiles
- a shared secret used to authorize SignalR-related operations

How it is created:

- Minted server-side in `api/groupcode`
- Derived from the Azure Static Web Apps client principal in the `x-ms-client-principal` header
- Stamped with a fresh UUID
- AES-encrypted in `api/Utility/encryption.ts` using `process.env.EncryptionKey`

How it is used:

- As the SignalR `userId`
- As the authorization secret proving a client belongs to the same group

Only extension instances with the same group code can exchange routing messages.

## How a tab gets routed

The routing flow is:

1. **User sets up state**
   - The user defines rules and registers each Chrome profile as a user profile in the extension's
     options page (opened from the toolbar icon).

2. **State is stored and synchronized**
   - Rules and user profiles are persisted per profile in `chrome.storage.local`.
   - They are synced across profiles over an Azure SignalR hub named `"chat"`, scoped by the
     shared group code.

3. **Navigation is observed**
   - The background script watches `chrome.tabs` and `chrome.webNavigation`.
   - When a tab navigates, `chromeextension/src/Background/tabUpdateHandler.ts` checks the URL
     against rules via `checkUrl()` in `rulesHandler.ts`.

4. **A handoff request is sent**
   - If a rule matches and the target profile is not the current profile, the source profile
     sends an `"openurl"` SignalR message.

5. **The target profile opens the tab**
   - The target profile's background script receives `"openurl"` and opens the tab locally.

6. **The original tab is removed**
   - After opening the replacement tab, the target profile sends `"removetab"` back to the
     source profile.
   - The source profile closes the original tab.

7. **Status is recorded**
   - `tabUpdateHandler.ts` keeps a status log (`ITabStatus[]`) that is displayed in the Log tab of
     the options page.

Server-side message flow involved in this process:

- `api/messages` relays client messages into SignalR as `{ userId, target, arguments }`
- `api/negotiate` validates `groupcode` and `groupcodeauthorization` before issuing SignalR
  connection info

## Background script design

The background code under `chromeextension/src/Background/*` is intentionally decentralized.

### Explicit registration at startup

There is no central orchestrator.

- `entrypoints/background.ts` imports every handler module
- Each module exports a `register*()` function that attaches its own `chrome.*` listeners or RxJS
  subscriptions
- `defineBackground(() => { ... })` calls them all synchronously, so listeners are attached
  before Chrome delivers whatever event woke the service worker up

Important constraint: WXT evaluates the background entrypoint in Node to read its config, so no
`chrome.*` call may run outside `main()` — this is why handlers do nothing at their module top
level.

### Connection ownership: `signalr.ts`

`signalr.ts` owns the SignalR `HubConnection` lifecycle.

It exposes/maintains:

- `connectionStatus`
- `connection`

as `BehaviorSubject`s.

Behavior:

- Rebuilds the connection whenever the group code changes
- Reconnects with backoff:
  - `0`
  - `5`
  - `15`
  - `30`
  - `60` seconds
- Resets the backoff after 5 minutes of stable connection
- Keeps the service worker alive via WebSocket traffic (15s keepAlive; Chrome 116+ requirement,
  see `minimum_chrome_version` in `wxt.config.ts`)

### SignalR message abstraction: `signalrmessages.ts`

`signalrmessages.ts` provides a pub/sub layer over the raw SignalR connection.

Main role:

- `addHandler(...)` for subscribing to message types
- `sendSignalrMessage(...)` for sending messages

All cross-profile messages go through this layer.

### Rules state: `rulesHandler.ts` and `rulesHandlerUtility.ts`

These modules own the in-memory `rules` array.

Important behavior:

- `mergeRules()` reconciles local and remote rule sets
- Conflict resolution is based on `updated` timestamps
- Most recent value wins per field
- Soft-deleted rules (`deleted: true`) are kept for **3 months**
- After that, they can be dropped from the merge set

Keeping deleted rules around allows deletions to propagate to profiles that were offline.

### User profile state: `userprofilesHandler.ts` and `userprofileHandlerUtility.ts`

These follow the same merge pattern as rules, but keyed differently.

Key point:

- User profiles are merged by `chromeInstanceId`, not by rule `id`

### Identity/config plumbing

A few modules exist mainly to establish local identity and configuration:

- `BackgroundGroupcodeHandler.ts`
  - manages the current group code
- `BackgroundChromeInstanceIdHandler.ts`
  - manages a per-install random instance id
- `chromeprofileNameHandler.ts`
  - resolves the human-readable profile display name from `userprofiles` using
    `chromeInstanceId`

### Storage reaction model: `chromestorage.ts`

Most handlers react to `chrome.storage.local` changes through `chromestorage.ts`.

Instead of a single shared store, this module exposes:

- a `listeners` map

Handlers register there and respond to storage changes independently.

## Messaging

There are three distinct messaging layers in the extension.

### 1. Background ↔ content script

Implemented by:

- `chromeextension/src/Messaging/ChromeMessaging.ts`

Mechanism:

- `chrome.runtime.sendMessage`

Style:

- fire-and-forget style request/response

### 2. Background ↔ options page UI

Implemented by:

- `chromeextension/src/Messaging/BackgroundChromeMessagingPort.ts` (background side)
- `chromeextension/src/Messaging/ScriptChromeMessagingPort.ts` (UI side)

Mechanism:

- long-lived `chrome.runtime.connect` port, channel name `'popup'` (a historical name)

Notable details:

- `getInstance(channelName)` is a singleton per channel name on both sides
- The UI side keeps one store per background-owned dataset in
  `entrypoints/options/lib/backgroundStores.ts`; each store subscribes to a broadcast message
  type (`rules`, `userprofiles`, `ConnectionStatus`, `groupcode`, `chromeinstanceid`, `log`) and
  issues the matching `get*` request when the page loads

### 3. Cross-profile messaging over SignalR

Implemented primarily by:

- `chromeextension/src/Background/signalr.ts`
- `chromeextension/src/Background/signalrmessages.ts`
- `api/messages`

This layer carries messages such as:

- rules synchronization
- user profile synchronization
- `openurl`
- `removetab`

The SignalR scope is the shared **group code**, which ensures only extension instances in the
same group exchange state and routing commands.

### Shared contracts

Shared TypeScript models for these layers live under:

- `chromeextension/src/Shared/*Models.ts`

Examples:

- `IRule`
- `IUserProfileStatus`
- `ITabStatus`
- SignalR message types

Check these first when changing any cross-context message shape.

## Deployment

### Static web app and API

`app/` and `api/` are built and deployed together as one Azure Static Web App.

GitHub Actions workflow:

- `.github/workflows/azure-static-web-apps-*.yml`

Triggers:

- push to `main`
- pull requests

### Chrome extension

`chromeextension/` is separate from the Azure deployment path.

Publishing model:

- production build via `npm run zip` (WXT build + zip) in `chromeextension/`
- published to the Chrome Web Store manually
