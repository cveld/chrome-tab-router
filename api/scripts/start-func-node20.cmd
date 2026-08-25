@echo off
rem Runs the Azure Functions host pinned to a portable Node 20 install, so the
rem Functions Node worker doesn't pick up the machine default (Node 24, which
rem the worker rejects) without touching nvm's global default.
rem Usage: scripts\start-func-node18.cmd
set "PATH=C:\Users\CarlintVeld\AppData\Local\jcode\tools\node-v20.19.5-win-x64;%PATH%"
where node
node -v
cd /d "%~dp0.."
call npm start
