# Chrome Tab Router

A Chrome extension that routes incoming links to a preferred Chrome user profile. When a link
opens in the "wrong" profile, it is handed over to the profile you configured for it.

You can install it from the
[Chrome Web Store](https://chrome.google.com/webstore/detail/chrome-tab-router/mdagoleaelpaicldokjcpelifdgmiglg).

## How it works

1. Open the extension's options page (click the toolbar icon).
2. Register each Chrome profile as a **user profile** and define **rules**: a regular expression
   for a URL and the profile that should open it.
3. Connect your profiles with each other (see below).
4. When a link opens in the wrong profile, the extension shows a short router page, then moves
   the link to the right profile and closes the original tab.

The profiles have to be able to talk to each other for this. You choose how, per profile, on the
extension's **Connection** tab. All profiles that should work together must use the same option.

## Connecting your profiles

### Option 1: Cloud

An Azure-hosted service relays the messages between your profiles. It works across machines and
needs nothing installed. A **groupcode** connects your profiles.

1. In your first profile, open the **Connection** tab, choose **Cloud** and click
   **Generate a groupcode**. You sign in on the web app, and the groupcode is handed to the
   extension automatically.
2. In every other profile, choose **Cloud**, then copy the groupcode from the first profile (the
   **Copy** button) and enter it. Do not generate a new one.

### Option 2: Local relay

A small program on your own machine relays the messages. Nothing leaves your computer and you
do not need an account. It only connects profiles on the same machine, and the relay has to be
running. A **pairing code** connects your profiles.

You need Node.js 20 or newer.

1. Start the relay and leave it running:

   ```bash
   npx chrome-tab-router-localsync start
   ```

2. In a second terminal, print the pairing code:

   ```bash
   npx chrome-tab-router-localsync pair
   ```

3. In each profile, open the **Connection** tab, choose **Local relay** and paste the pairing
   code (it looks like `ctr-local:48731:…`). Use the same code in every profile.

The relay only listens on `127.0.0.1`, and a connection needs the secret in the pairing code.
More in [localsync/README.md](localsync/README.md).

### Which one?

| | Cloud | Local relay |
| --- | --- | --- |
| Works across machines | yes | no, one machine |
| Needs an install | no | Node.js, and the relay running |
| Account | sign in to generate the groupcode | none |
| Where your data goes | through the Azure service | stays on your machine |

Both options are described in the [privacy policy](https://chrome-tab-router.carlintveld.nl/privacy.html).

## Architecture

The solution has four parts:

* Azure Static Web App with two parts:
  * Front-end (Vite + React): `app`, used to generate a groupcode
  * Functions back-end: `api`
* Azure SignalR Service, which relays messages across profiles for the cloud option
* Chrome extension (Manifest V3, built with WXT): `chromeextension`
  * Background and content script
  * Management UI (connection, user profiles, rules, log, settings): React options page in
    `chromeextension/entrypoints/options`
  * Router page: interstitial in `chromeextension/entrypoints/router` that shows where a link is
    headed, counts down before routing, and lets you pick another profile or edit the rule
* Local relay: `localsync`, a Node WebSocket relay published to npm as
  `chrome-tab-router-localsync`, for the local option

The extension talks to the other profiles through a transport, either the cloud service or the
local relay, picked per profile on the Connection tab. See
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the details.

## Development

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for the full guide. In short:

* install the `func` global tool: `winget upgrade --id Microsoft.Azure.FunctionsCoreTools --accept-package-agreements --accept-source-agreements` (or `winget install` if not yet installed). It must stay on the v4 line, matching the v4 programming model and Node 22+ requirement
* start a local Azure Storage emulator (for example the Azurite VS Code extension) and set `AzureWebJobsStorage` to `UseDevelopmentStorage=true` in `api/local.settings.json`. The Functions host needs it even though `api/` only exposes HTTP triggers
* `npm install` (installs root tooling, such as npm-run-all, needed to run `install:all`)
* `npm run install:all`
* `npm run watch:all`
* add the `chromeextension/.output/chrome-mv3` folder as an unpacked Chrome extension

To work on the local relay, without the cloud:

* `npm run localsync:install`, then `npm run localsync:start` and `npm run localsync:pair`
* `npm run chromeextension:build:localsync`, then add `chromeextension/.output/chrome-mv3-localsync`
  as an unpacked extension. It defaults to the local relay; you can still switch on the
  Connection tab.
