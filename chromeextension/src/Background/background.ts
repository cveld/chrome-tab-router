import './BackgroundChromeInstanceIdHandler';
import './BackgroundGroupcodeHandler';
import './userprofilesHandler';
import './rulesHandler';
import './tabUpdateHandler';
import './badgeStatusHandler';
import { BackgroundChromeMessagingWithPort } from '../Messaging/BackgroundChromeMessagingPort';
import { Observable } from 'rxjs';
// chrome.windows.onFocusChanged.addListener((...args) => {
//   console.log('onFocusChanged', args);
// });

//var redirectUrl = chrome.identity.getRedirectURL()
//console.log('redirectUrl', redirectUrl);
/*global chrome*/
// chrome.identity.launchWebAuthFlow(
//   {
//     url: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?' +
//       'response_type=token' +
//       '&response_mode=fragment' +
//       `&client_id=354c5608-6f41-49a7-aac9-15d4bbbab4d6` +
//       `&redirect_uri=${redirectUrl}` +
//       '&scope=openid profile',
//     interactive: true
//   },
//   (responseWithToken) => {
//       // the access token needs to be extracted from the response.
//       console.log('responseWithToken', responseWithToken);
//       var url = new URL(responseWithToken!);
//       data.accesstoken = new URLSearchParams(url.hash.substring(1)).get('access_token')!;
//       console.log('accesstoken', data.accesstoken)
//   }
// );

// the following listener is required to bootstrap the communication to content scripts
// or else content scripts cannot call chrome.runtime.connect(). This will fail with the error:
// Could not establish connection. Receiving end does not exist.
chrome.runtime.onConnect.addListener(function(port) {
  console.log('background onConnect listener', port);
  port.onMessage.addListener(function(msg, port) {
      // May be empty.
      console.log('background onMessage listener', msg, port);
  });
});

chrome.browserAction.onClicked.addListener((tab) => {
  const url = chrome.extension.getURL('popup/index.html');
  chrome.tabs.create({
    url: url
  });
});

