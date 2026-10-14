---
name: chrome-tab-router
description: 'Use together with the chrome-relay skill (or any tool that drives Chrome tabs) whenever a URL has to be opened in a Chrome profile that has the Chrome Tab Router extension installed. Chrome Tab Router intercepts every new tab, so a plain chrome-relay `navigate --new` can be redirected to its interstitial or handed to another profile. This skill opens a URL without routing, through the extension''s own bridge.'
---

# Chrome Tab Router

Chrome Tab Router routes links to the Chrome profile that owns them. It listens to
`chrome.tabs.onCreated`, so any tab created by an automation tool (`chrome-relay navigate --new`,
`chrome.tabs.create`) is routed like a link the user clicked: it can be redirected to
`router.html`, closed, or reopened in another profile. Updating an existing tab never raises
`onCreated`.

## When to use which

- **Open a URL exactly where you say, no routing** → `open-url-bypassed.ps1` (below).
- **Navigate a tab that already exists** (`chrome-relay navigate <url> --tab <id>`) → plain
  chrome-relay is fine; this is a tab update, not a creation.
- **Routing is wanted** (testing the router itself) → plain `chrome-relay navigate --new`.

## Open a URL without routing

`open-url-bypassed.ps1` sits next to this file. Run it with PowerShell:

```powershell
./open-url-bypassed.ps1 -Profile <chrome-relay profile label> -Url "https://example.com/"
```

| Parameter | Meaning |
|---|---|
| `-Url` | Destination (required). |
| `-Profile` | chrome-relay profile label (`chrome-relay profile list`). Omit when only one profile is connected. |
| `-TabId` | Reuse this tab for the bridge step instead of opening a new one. |
| `-BridgeUrl` | Bridge host. Defaults to `https://chrome-tab-router.carlintveld.nl/`; override for builds using another host (azurestaticapps.net, `http://localhost`). |

It prints progress and returns the tab id that now shows the destination; continue with
`chrome-relay snapshot --tab <id>`.

## How it works

1. `chrome-relay navigate <bridge host> --new` — the bridge host is excluded from routing
   (`isBridgeUrl()` in `chromeextension/src/Shared/contentScriptMatches.ts`), so it loads without
   the interstitial.
2. `chrome-relay js` dispatches on that page:
   `document.dispatchEvent(new CustomEvent('chrome-tab-router-content', { detail: { type: 'openUrlHere', payload: { url } } }))`.
3. The extension's content script forwards it to the background
   (`src/Content/ContentOpenUrlHandler.ts`, `src/Background/openUrlHandler.ts`), which calls
   `chrome.tabs.update(senderTabId, { url })`.
4. The script waits for the tab URL to match.

## Requirements and failure modes

- The target profile is connected to chrome-relay and has a Chrome Tab Router build **with the
  bridge handler** (extension 0.9.0 or later) whose content-script match covers `-BridgeUrl`.
- No answer after dispatch, or `wait --url` times out: the extension is missing, too old, or the
  bridge host does not match that build's `WXT_CONFIG_URL` / `WXT_CONTENT_SCRIPT_EXTRA_URLS`.
- `wait --url` compares against the given URL; if the destination redirects, the wait can time
  out although the tab did navigate. Check with `chrome-relay tabs`.
- Never widen the extension's content-script match to get around a host mismatch; use `-BridgeUrl`.
