import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { BehaviorSubject } from "rxjs";
import { configUrl } from "../Background/settings";
import { IConnectionStatus } from "../Shared/signalrModels";
import { connectionStatus$, reconnect } from './popupSignalrConnectionHandler';
import { ScriptChromeMessagingWithPort } from '../Messaging/ScriptChromeMessagingPort';

const Popup = () => {
  const [count, setCount] = useState(0);
  const [currentURL, setCurrentURL] = useState<string>();
  const [connectionStatus, setConnectionStatus] = useState<IConnectionStatus>();

  useEffect(() => {
    chrome.browserAction.setTitle({ title: 'some hover text'  })
    chrome.browserAction.setBadgeText({ 
      text: "TEXT"
      //text: count.toString() 
    });
  }, [count]);



  useEffect(() => {
    console.log('this is hitting only once');
    const subscription = connectionStatus$.subscribe(value => {
      setConnectionStatus(value);
    });
    return () => {
      subscription.unsubscribe();
    }
  }, []);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      setCurrentURL(tabs[0].url);
    });
  }, []);

  const changeBackground = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const tab = tabs[0];
      if (tab.id) {
        chrome.tabs.sendMessage(
          tab.id,
          {
            color: "#555555",
          },
          (msg) => {
            console.log("result message:", msg);
          }
        );
      }
    });
  };

  return (
    <>
      <ul style={{ minWidth: "700px" }}>
        <li>Current URL: {currentURL}</li>
        <li>Current Time: {new Date().toLocaleTimeString()}</li>
      </ul>
      <button
        onClick={() => {
          setCount(count + 1);
          myObservable.next(count);
        }}
        style={{ marginRight: "5px" }}
      >
        count up
      </button>
      <button onClick={changeBackground}>change background</button>
      <button onClick={reconnect}>Reconnect</button>
      <button onClick={generateGroupcode}>Generate Groupcode</button>
      <p>
        { JSON.stringify(connectionStatus) }
      </p>
    </>
  );

  function generateGroupcode() {
    chrome.tabs.create({ url: configUrl });
  }
};

ReactDOM.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
  document.getElementById("root")
);

const myObservable = new BehaviorSubject<number>(0);
const messaging = ScriptChromeMessagingWithPort.getInstance('popup');
messaging.sendMessage({
  type: 'observable',
  payload: myObservable
})
