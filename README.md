# Chrome Tab Router
A Chrome extension that routes incoming links to preferred Chrome user profiles.
You can install it through https://chrome.google.com/webstore/detail/chrome-tab-router/mdagoleaelpaicldokjcpelifdgmiglg

# Architecture
The solution comprises two parts:
* Azure static web app with two parts:
  - Front-end (Vite + React): app
  - Functions back-end: api
* Chrome extension (Manifest V3, built with WXT):
  - Background and content script: chromeextension
  - Management UI (rules, user profiles, log): React options page in chromeextension/entrypoints/options
* Azure SignalR Service
  - Connected with the background script in order to communicate messages across Chrome user profiles

# Implementation
Execute the following steps to run the solution locally:
* install func global tool: `winget upgrade --id Microsoft.Azure.FunctionsCoreTools --accept-package-agreements --accept-source-agreements` (or `winget install` if not yet installed) — must stay on the v4 line, matching the v4 programming model / Node 22+ requirement
* start a local Azure Storage emulator (e.g. the Azurite VSCode extension) and set `AzureWebJobsStorage` to `UseDevelopmentStorage=true` in `api/local.settings.json` — the Functions host needs it (the health check otherwise reports `azure.functions.webjobs.storage` as Unhealthy) even though `api/` only exposes HTTP triggers
* npm install (installs root tooling, e.g. npm-run-all, needed to run install:all)
* npm run install:all
* npm run watch:all
* add chromeextension/.output/chrome-mv3 folder as an unpacked chrome extension
