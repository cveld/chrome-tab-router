//import { eventHandlers } from '../Messaging/DocumentEventing';
import { dispatchEventToPage } from '../Messaging/DocumentEventing';
import './ContentChromeInstanceIdHandler';
import './ContentGroupcodeHandler';

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.color) {
    console.log("Receive color = " + msg.color);
    document.body.style.backgroundColor = msg.color;
    sendResponse("Change color to " + msg.color);
  } else {
    sendResponse("Color message is none.");
  }
});

chrome.runtime.onConnect.addListener((...args) => {
  console.log('onConnect listener', args);
});
const port = chrome.runtime.connect();
port.onDisconnect.addListener(function() {
   // clean up when content script gets disconnected
   console.log('Contentscript disconnected from runtime');
});

dispatchEventToPage({ type: 'contentscriptready' });