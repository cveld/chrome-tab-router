# Chrome Tab Router
A Chrome extension that routes incoming links to preferred Chrome user profiles.
You can install it through https://chrome.google.com/webstore/detail/chrome-tab-router/mdagoleaelpaicldokjcpelifdgmiglg

# Architecture
The solution comprises two parts:
* Azure static web app with two parts:
- Angular front-end: app
- Functions back-end: api
* Chrome extension, with two parts:
- Scripts: background and content script: chromeextension
- Angular extension page: chromeextension/popup
* Azure SignalR Service
- Connected with the background script in order to communicate messages across Chrome user profiles
- Utilizes Azure Active Directory authentication to ensure fair use

# Implementation
Execute the following steps to run the solution locally:
* install func global tool
* npm run install:all
* npm run watch:all
* add chromeextension/dist folder as an unpacked chrome extension
