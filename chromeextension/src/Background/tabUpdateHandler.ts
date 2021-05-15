import { chromeInstanceId } from './BackgroundChromeInstanceIdHandler';
import { addHandler, sendSignalrMessage } from './signalrmessages';

addHandler('tabUpdate', message => {
    console.log(`tabUpdate received in chromeprofile ${chromeInstanceId.value}`, message);
})

chrome.tabs.onCreated.addListener(async (...args) => {
    //console.log("onCreated:")
    //console.log(args);
    // chrome.runtime.sendMessage({greeting: "hello"}, function(response) {
    //   console.log(response.farewell);
    // });
    
    // Make a simple request:
    // chrome.runtime.sendMessage({getTargetData: true},
    //   (response) => {    
    //     console.log('chrome.runtime.lastError', chrome.runtime.lastError);
    //     console.log('background sendMessage response callback', response);
    //   }
    // );
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