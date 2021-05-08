import { chromeInstanceId } from "./BackgroundChromeInstanceIdHandler";
import './BackgroundGroupcodeHandler';

chrome.tabs.onCreated.addListener(async (...args) => {
  console.log("onCreated:")
  console.log(args);
  // chrome.runtime.sendMessage({greeting: "hello"}, function(response) {
  //   console.log(response.farewell);
  // });
  
  // Make a simple request:
  chrome.runtime.sendMessage({getTargetData: true},
    function(response) {    
      console.log('background sendMessage', response);
      // if (targetInRange(response.targetData))
      //   chrome.runtime.sendMessage(laserExtensionId, {activateLasers: true});
    }
  );
});

chrome.tabs.onUpdated.addListener(async (...args) => {
  console.log("onUpdated:")
  console.log(args);
  console.log(`url ${args[2].url}`);
  const url = args[2].url;
  if (args[1].status === 'unloaded') {
    return;
  }
  if (url) {
    const onUpdatedArgs = args;
    chrome.windows.getAll({
      populate: true
    }, async (...args) => {
      console.log('all windows', args);
      
      sendSignalrMessage({ 
        type: 'tabUpdate', 
        payload: {
          url: url,
          status: onUpdatedArgs[2].status
        }
      });
      const hostname = new URL(url).hostname;
      if (hostname === 'www.nu.nl') {
        chrome.tabs.remove(onUpdatedArgs[0]);
      }    
    }); // async
  } // if
}); // chrome tabs onUpdated

const data = {
  accesstoken: '',
  username: '',
  newMessage: '',
  messages: [] as Array<IMessage>,
  ready: false
};

let counter = 0;
interface IMessage {
  id: number
}

chrome.windows.onFocusChanged.addListener((...args) => {
  console.log('onFocusChanged', args);
});

var redirectUrl = chrome.identity.getRedirectURL()
console.log('redirectUrl', redirectUrl);
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

import { connection } from './signalr';
//connection.on('newMessage', newMessage);

import './signalrmessages';
import { sendSignalrMessage } from "./signalrmessages";

import './UserprofilesHandler';
import './tabUpdateHandler';