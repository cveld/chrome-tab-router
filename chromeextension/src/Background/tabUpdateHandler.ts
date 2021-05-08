import { chromeInstanceId } from './BackgroundChromeInstanceIdHandler';
import { addHandler, sendSignalrMessage } from './signalrmessages';

addHandler('tabUpdate', message => {
    console.log(`tabUpdate received in chromeprofile ${chromeInstanceId.value}`, message);
})