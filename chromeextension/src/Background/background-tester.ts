chrome.runtime.onMessage.addListener((...args) => {
    console.log('background:', args);
});

chrome.runtime.sendMessage('message', response => {
    console.log('runtime.lastError', chrome.runtime.lastError);
    console.log('response', response);
})