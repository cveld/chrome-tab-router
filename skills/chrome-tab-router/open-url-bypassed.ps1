<#
.SYNOPSIS
    Opens a url via chrome-relay in a given Chrome profile, bypassing Chrome
    Tab Router's routing entirely.

.DESCRIPTION
    chrome-relay's own `navigate` always does a plain chrome.tabs.create()/
    chrome.tabs.update(), which Chrome Tab Router's chrome.tabs.onCreated
    listener intercepts like any other new tab. This script instead drives
    Chrome Tab Router's own web-app bridge (the content script it injects on
    its configured bridge host - see chromeextension/src/Shared/
    contentScriptMatches.ts and chromeextension/src/Content/
    ContentOpenUrlHandler.ts):

      1. Navigate a tab to the bridge host. That host is explicitly excluded
         from routing (isBridgeUrl() in contentScriptMatches.ts), so this
         load never shows the router.html interstitial.
      2. Dispatch a 'chrome-tab-router-content' CustomEvent on that page
         with { type: 'openUrlHere', payload: { url } }. The content script
         forwards it to the background via a normal (same-extension)
         chrome.runtime.sendMessage.
      3. The background identifies the tab via the message's sender.tab and
         calls chrome.tabs.update(tabId, { url }) directly - an update on an
         already-existing tab never raises chrome.tabs.onCreated, so routing
         never runs for the final destination either.

    Requires: chrome-relay CLI (https://chromewebstore.google.com/detail/chrome-relay/cpdiapbifblhlcpnmlmfpgfjlacebokb)
    with the target Chrome profile already connected (see `chrome-relay profile list`),
    and a build of this extension with the bridge handler loaded and reachable
    at -BridgeUrl in that profile.

.PARAMETER Url
    The destination url to open, bypassing routing.

.PARAMETER Profile
    The chrome-relay profile label to act on (see `chrome-relay profile list`).
    Omit when only one profile is connected.

.PARAMETER TabId
    Reuse this existing tab instead of opening a new one for the bridge step.
    The tab ends up showing -Url, same as a fresh one would.

.PARAMETER BridgeUrl
    The bridge host to navigate to. Defaults to the production bridge
    (https://chrome-tab-router.carlintveld.nl/); override for a build using a
    different host (e.g. azurestaticapps.net, or a localhost dev build).

.EXAMPLE
    ./open-url-bypassed.ps1 -Profile cloudnation -Url "https://outlook.office.com/mail/"

.EXAMPLE
    ./open-url-bypassed.ps1 -Profile personal -TabId 696016187 -Url "https://example.com/"
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$Url,

    [string]$Profile,

    [int]$TabId,

    [string]$BridgeUrl = "https://chrome-tab-router.carlintveld.nl/"
)

$ErrorActionPreference = "Stop"

function Invoke-ChromeRelay {
    param([string[]]$Arguments)

    $allArgs = @()
    if ($Profile) {
        $allArgs += @("--profile", $Profile)
    }
    $allArgs += $Arguments

    # chrome-relay writes its "[chrome-relay] profile: ..." diagnostic (when
    # -Profile is set) to stderr and the actual JSON result to stdout, but the
    # two streams can interleave in either order once merged - so stderr is
    # captured separately (for the error message on failure) rather than
    # merged with 2>&1, keeping stdout pure JSON to parse.
    $errFile = [System.IO.Path]::GetTempFileName()
    try {
        $output = & chrome-relay @allArgs 2>$errFile | Out-String
        if ($LASTEXITCODE -ne 0) {
            $errText = Get-Content $errFile -Raw
            throw "chrome-relay $($Arguments -join ' ') failed:`n$output$errText"
        }
        return $output
    } finally {
        Remove-Item $errFile -ErrorAction SilentlyContinue
    }
}

function ConvertFrom-ChromeRelayJson {
    param([string]$Raw)

    return $Raw | ConvertFrom-Json
}

Write-Host "Navigating to the bridge host..."
if ($TabId) {
    $navArgs = @("navigate", $BridgeUrl, "--tab", $TabId, "--wait", "load")
} else {
    $navArgs = @("navigate", $BridgeUrl, "--new", "--wait", "load")
}
$navResult = ConvertFrom-ChromeRelayJson (Invoke-ChromeRelay -Arguments $navArgs)
$bridgeTabId = $navResult.tabId

if (-not $navResult.ready) {
    Write-Warning "Bridge page did not report ready; continuing anyway (readyState: $($navResult.readyState))."
}

Write-Host "Dispatching openUrlHere for '$Url' on tab $bridgeTabId..."
# Build the JS as a single-quoted PowerShell string so $-prefixed tokens in
# the url (if any) are never expanded; the url itself is passed through
# ConvertTo-Json so embedded quotes/backslashes survive intact.
$encodedUrl = $Url | ConvertTo-Json
$dispatchJs = @"
document.dispatchEvent(new CustomEvent('chrome-tab-router-content', {
  detail: { type: 'openUrlHere', payload: { url: $encodedUrl } }
}));
return 'dispatched';
"@
Invoke-ChromeRelay -Arguments @("js", "--tab", $bridgeTabId, $dispatchJs) | Out-Null

Write-Host "Waiting for the tab to land on the destination url..."
Invoke-ChromeRelay -Arguments @("wait", "--url", $Url, "--tab", $bridgeTabId) | Out-Null

Write-Host "Done: tab $bridgeTabId now shows $Url"
return $bridgeTabId
