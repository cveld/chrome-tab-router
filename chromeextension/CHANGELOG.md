# Changelog

## [0.8.0](https://github.com/cveld/chrome-tab-router/compare/extension-v0.7.0...extension-v0.8.0) (2026-10-09)


### Features

* **chromeextension:** choose between cloud sync and a local relay ([a84ce7e](https://github.com/cveld/chrome-tab-router/commit/a84ce7e6b53b541063ca5b991e3d61c7c0df193e))
* **localsync:** add a local sync relay for profiles on one machine ([29022dd](https://github.com/cveld/chrome-tab-router/commit/29022dd79b566f43091043df2b3fb1b55f3bd536))


### Bug Fixes

* **badge:** don't flag a missing group code before storage is read ([f7e8244](https://github.com/cveld/chrome-tab-router/commit/f7e8244062bb7a1955267d33298c31a85ce89366))

## [0.7.0](https://github.com/cveld/chrome-tab-router/compare/extension-v0.6.0...extension-v0.7.0) (2026-10-01)


### Features

* explain the icon badge, show connecting progress, add dev pages ([295dfef](https://github.com/cveld/chrome-tab-router/commit/295dfef8959ed4f749a7b2cc531f3c5cca656ea7))
* **extension:** confirm groupcode copy with a status message ([cda2125](https://github.com/cveld/chrome-tab-router/commit/cda2125ac44f6fc80826a82400e7f61db6e09d7d))
* scoped logger, build stamp and copyable diagnostics ([27f8a5a](https://github.com/cveld/chrome-tab-router/commit/27f8a5a2a703cfd336dbb49329a6d54acd7c8610))


### Bug Fixes

* limit the content script to the web app's own origin ([45a2c84](https://github.com/cveld/chrome-tab-router/commit/45a2c84732c46111089bb0c9f1c903b60b80d384))
* recover extension pages when the background service worker is unreachable ([e46342d](https://github.com/cveld/chrome-tab-router/commit/e46342d0bed6edbe999bac5d451b030c6ab4c5c9))
* register the icon click handler before the other background handlers ([04da749](https://github.com/cveld/chrome-tab-router/commit/04da749df6a18e8e2ea929f204f75374cd9d7f0e))
* **router:** recover when a hand-over is never confirmed ([530d2af](https://github.com/cveld/chrome-tab-router/commit/530d2af4287018255dcbea870227674eab723f2e))

## [0.6.0](https://github.com/cveld/chrome-tab-router/compare/extension-v0.5.5...extension-v0.6.0) (2026-09-06)


### Features

* add interstitial router page with configurable prompting ([#11](https://github.com/cveld/chrome-tab-router/issues/11)) ([f5f92cb](https://github.com/cveld/chrome-tab-router/commit/f5f92cb58168e2c0bc0909ecc6562ffecd9f3179))
* add profile picker with inline rename to the rule dialog ([#10](https://github.com/cveld/chrome-tab-router/issues/10)) ([3ba6ad8](https://github.com/cveld/chrome-tab-router/commit/3ba6ad83a8dca75f17128af71a8f4ad456c17dee))


### Bug Fixes

* correct release-please baseline to match published extension version ([8b3bb98](https://github.com/cveld/chrome-tab-router/commit/8b3bb98c4551c12399eec128986c8b6eab18b2d0))
