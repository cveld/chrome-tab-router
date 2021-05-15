# chrome-tab-router
Routes incoming links to preferred Chrome user profiles

# Architecture
The solution comprises two parts:
* Azure static web app with two parts:
- Angular front-end: app
- Functions back-end: api
* Chrome extension, with two parts:
- Scripts: background and content script: chromeextension
- Angular extension page: chromeextension/popup
# Implementation
Execute the following steps to run the solution locally:
* npm run install:all
* npm run watch:all