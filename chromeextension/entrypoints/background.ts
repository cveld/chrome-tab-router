import { registerChromeMessaging } from '../src/Messaging/ChromeMessaging';
import { registerChromeStorageListener } from '../src/Background/chromestorage';
import { registerBackgroundChromeInstanceIdHandler } from '../src/Background/BackgroundChromeInstanceIdHandler';
import { registerBackgroundGroupcodeHandler } from '../src/Background/BackgroundGroupcodeHandler';
import { registerSignalr } from '../src/Background/signalr';
import { registerSignalrMessages } from '../src/Background/signalrmessages';
import { registerSyncBackendHandler } from '../src/Background/syncBackendHandler';
import { registerLocalSync } from '../src/Background/localsync';
import { registerTransport } from '../src/Background/transport';
import { registerUserprofilesHandler } from '../src/Background/userprofilesHandler';
import { registerRulesHandler } from '../src/Background/rulesHandler';
import { registerChromeProfileNameHandler } from '../src/Background/chromeprofileNameHandler';
import { registerInterstitialSettingsHandler } from '../src/Background/interstitialSettingsHandler';
import { registerTabUpdateHandler } from '../src/Background/tabUpdateHandler';
import { registerBadgeStatusHandler } from '../src/Background/badgeStatusHandler';
import { registerWatchdogAlarm } from '../src/Background/watchdogAlarm';
import { registerDevMenuHandler } from '../src/Background/devMenuHandler';
import { registerDiagnosticsHandler } from '../src/Background/diagnosticsHandler';
import { logBuildInfo } from '../src/Shared/buildInfo';
import { registerLogLevelSync, registerLogPersistence } from '../src/Shared/logStorage';

// WXT imports this file in a NodeJS environment to read the config passed to
// defineBackground(), so no chrome.* (or anything that transitively touches
// chrome.*) may run outside main() — see https://wxt.dev/guide/essentials/entrypoints.html#background
// This is also why every Background/* module exposes a register*() function
// instead of registering its listeners at its own module top level: each one
// is only called from here, synchronously, so listeners are attached before
// Chrome delivers whatever event woke this worker up.
export default defineBackground(() => {
  // Registered first so the toolbar icon keeps opening the options page even
  // if a later register*() call throws; that page is also where a broken or
  // not-yet-established connection gets explained.
  chrome.action.onClicked.addListener(() => {
    chrome.runtime.openOptionsPage();
  });

  registerLogLevelSync();
  registerLogPersistence();
  logBuildInfo('service worker');
  // Order matters: signalr/signalrmessages/chromestorage must be registered
  // before anything that calls addHandler()/listeners.set() against them.
  registerChromeMessaging();
  registerChromeStorageListener();
  registerBackgroundChromeInstanceIdHandler();
  registerBackgroundGroupcodeHandler();
  registerSyncBackendHandler();
  // Before registerSignalr(): see the note in registerLocalSync().
  registerLocalSync();
  registerSignalr();
  registerTransport();
  registerSignalrMessages();
  registerUserprofilesHandler();
  registerRulesHandler();
  registerChromeProfileNameHandler();
  registerInterstitialSettingsHandler();
  registerTabUpdateHandler();
  registerBadgeStatusHandler();
  registerWatchdogAlarm();
  registerDevMenuHandler();
  registerDiagnosticsHandler();

  // Required to bootstrap chrome.runtime.connect() from content scripts —
  // without an onConnect listener already attached, a content script
  // calling connect() can fail with "Could not establish connection.
  // Receiving end does not exist." (BackgroundChromeMessagingPort.ts already
  // registers its own onConnect listener for the 'popup'/options-page port;
  // this one covers the ad-hoc port opened in entrypoints/content.ts.)
  chrome.runtime.onConnect.addListener(function (port) {
    port.onMessage.addListener(function (msg, port) {
      // May be empty.
    });
  });
});
