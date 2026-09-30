import { BackgroundChromeMessagingWithPort } from '../Messaging/BackgroundChromeMessagingPort';
import { RECENT_TAB_COUNT, urlOrigin, type IBackgroundDiagnostics } from '../Shared/DiagnosticsModels';
import { getBuildInfo } from '../Shared/buildInfo';
import { getLogEntries, getLogLevel } from '../Shared/logger';
import { badgeStatus } from './badgeStatusHandler';
import { chromeInstanceId } from './BackgroundChromeInstanceIdHandler';
import { name as profileName } from './chromeprofileNameHandler';
import { groupcode } from './BackgroundGroupcodeHandler';
import { interstitialSettings } from './interstitialSettingsHandler';
import { rules } from './rulesHandler';
import { connectionStatus } from './signalr';
import { messageStatus } from './signalrmessages';
import { getTabLog } from './tabUpdateHandler';
import { userprofiles } from './userprofilesHandler';

function collectDiagnostics(): IBackgroundDiagnostics {
  return {
    generatedAt: Date.now(),
    build: getBuildInfo(),
    logLevel: getLogLevel(),
    chromeInstanceId: chromeInstanceId.value,
    profileName,
    groupcodePresent: !!groupcode.value.signature,
    connection: connectionStatus.value,
    messages: messageStatus.value,
    badge: badgeStatus.value,
    settings: interstitialSettings.value,
    userprofiles: userprofiles.value.map(profile => ({
      name: profile.name,
      chromeInstanceId: profile.chromeInstanceId,
      lastSeen: profile.lastSeen,
      deleted: profile.deleted,
    })),
    rules: rules.map(rule => ({
      regex: String(rule.regex ?? ''),
      targetUserprofile: rule.targetUserprofile,
      deleted: rule.deleted,
    })),
    recentTabs: getTabLog()
      .slice(-RECENT_TAB_COUNT)
      .map(tab => ({ ...tab, url: urlOrigin(tab.url) })),
    log: getLogEntries(),
  };
}

export function registerDiagnosticsHandler() {
  const popupmessaging = BackgroundChromeMessagingWithPort.getInstance('popup');
  popupmessaging.messageHandlers.set('getdiagnostics', () => {
    popupmessaging.sendMessage({ type: 'diagnostics', payload: collectDiagnostics() });
  });
}
