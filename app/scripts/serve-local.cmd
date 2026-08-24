@echo off
rem Serves the Angular webapp on http://localhost:4200 pinned to a portable
rem Node 16 (Angular 11 bundles webpack 4, whose md4 hashing breaks on Node
rem 17+). The proxy injects a fake EasyAuth client principal so api/groupcode
rem works without a real Static Web App login.
rem Usage: scripts\serve-local.cmd
set "PATH=C:\Users\CarlintVeld\AppData\Local\jcode\tools\node-v16.20.2-win-x64;%PATH%"
where node
node -v
cd /d "%~dp0.."
if not exist node_modules (
  echo Installing dependencies...
  call npm install
)
call npm start
