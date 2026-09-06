import { registerChromeMessaging } from '../src/Messaging/ChromeMessaging';
import { registerChromeStorageListener } from '../src/Background/chromestorage';
import { registerBackgroundChromeInstanceIdHandler } from '../src/Background/BackgroundChromeInstanceIdHandler';
import { registerBackgroundGroupcodeHandler } from '../src/Background/BackgroundGroupcodeHandler';
import { registerSignalr } from '../src/Background/signalr';
import { registerSignalrMessages } from '../src/Background/signalrmessages';
import { registerUserprofilesHandler } from '../src/Background/userprofilesHandler';
import { registerRulesHandler } from '../src/Background/rulesHandler';
import { registerChromeProfileNameHandler } from '../src/Background/chromeprofileNameHandler';
import { registerInterstitialSettingsHandler } from '../src/Background/interstitialSettingsHandler';
import { registerTabUpdateHandler } from '../src/Background/tabUpdateHandler';
import { registerBadgeStatusHandler } from '../src/Background/badgeStatusHandler';
import { registerWatchdogAlarm } from '../src/Background/watchdogAlarm';

// WXT imports this file in a NodeJS environment to read the config passed to
// defineBackground(), so no chrome.* (or anything that transitively touches
// chrome.*) may run outside main() — see https://wxt.dev/guide/essentials/entrypoints.html#background
// This is also why every Background/* module exposes a register*() function
// instead of registering its listeners at its own module top level: each one
// is only called from here, synchronously, so listeners are attached before
// Chrome delivers whatever event woke this worker up.
export default defineBackground(() => {
  // Order matters: signalr/signalrmessages/chromestorage must be registered
  // before anything that calls addHandler()/listeners.set() against them.
  registerChromeMessaging();
  registerChromeStorageListener();
  registerBackgroundChromeInstanceIdHandler();
  registerBackgroundGroupcodeHandler();
  registerSignalr();
  registerSignalrMessages();
  registerUserprofilesHandler();
  registerRulesHandler();
  registerChromeProfileNameHandler();
  registerInterstitialSettingsHandler();
  registerTabUpdateHandler();
  registerBadgeStatusHandler();
  registerWatchdogAlarm();

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

  chrome.action.onClicked.addListener(() => {
    chrome.runtime.openOptionsPage();
  });
});
