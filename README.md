# Chrome Tab Router
A Chrome extension that routes incoming links to preferred Chrome user profiles.
You can install it through https://chrome.google.com/webstore/detail/chrome-tab-router/mdagoleaelpaicldokjcpelifdgmiglg

# Architecture
The solution comprises two parts:
* Azure static web app with two parts:
  - Angular front-end: app
  - Functions back-end: api
* Chrome extension (Manifest V3, built with WXT):
  - Background and content script: chromeextension
  - Management UI (rules, user profiles, log): React options page in chromeextension/entrypoints/options
* Azure SignalR Service
  - Connected with the background script in order to communicate messages across Chrome user profiles

# Implementation
Execute the following steps to run the solution locally:
* install func global tool
* npm run install:all
* npm run watch:all
* add chromeextension/.output/chrome-mv3 folder as an unpacked chrome extension
