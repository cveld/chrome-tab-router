import axios from 'axios';
import { groupcode } from './BackgroundGroupcodeHandler';
import { apiBaseUrl } from './settings';
import { connection, reconnectCloud, reconnectIfDisconnected } from './signalr';
import type { ISyncTransport } from './transport';

// The Azure backend: messages are POSTed to the Functions app, which relays
// them over the SignalR hub that signalr.ts keeps connected.
export const cloudTransport: ISyncTransport = {
  backend: 'cloud',
  async send(message) {
    const signature = groupcode.value.signature;
    if (!signature) {
      return { delivered: false };
    }
    const result = await axios.post(`${apiBaseUrl}/api/messages`, message, {
      headers: {
        groupcodeauthorization: signature
      }
    });
    return { delivered: true, data: result.data };
  },
  canConnect: () => !!groupcode.value.signature,
  connectionId: () => connection.value?.connectionId,
  reconnect: reconnectCloud,
  reconnectIfDisconnected,
};
