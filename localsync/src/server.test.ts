import { afterEach, describe, expect, it } from 'vitest';
import WebSocket from 'ws';
import { PROTOCOL, SECRET_PROTOCOL_PREFIX } from './protocol.js';
import { isOriginAllowed, startRelay, type IRelay } from './server.js';

const SECRET = 'test-secret';
let relay: IRelay | undefined;
const sockets: WebSocket[] = [];

afterEach(async () => {
  sockets.splice(0).forEach(socket => socket.terminate());
  await relay?.close();
  relay = undefined;
});

async function start(allowedExtensionIds?: string[]): Promise<IRelay> {
  relay = await startRelay({ port: 0, secret: SECRET, allowedExtensionIds });
  return relay;
}

/** Resolves with the socket and a queue of the frames it receives. */
function connect(port: number, secret = SECRET, origin?: string) {
  const socket = new WebSocket(`ws://127.0.0.1:${port}`, [PROTOCOL, SECRET_PROTOCOL_PREFIX + secret], {
    origin,
  });
  sockets.push(socket);
  const frames: Array<Record<string, unknown>> = [];
  const waiters: Array<() => void> = [];
  socket.on('message', data => {
    frames.push(JSON.parse(data.toString()));
    waiters.splice(0).forEach(wake => wake());
  });
  const next = async (): Promise<Record<string, unknown>> => {
    while (frames.length === 0) {
      await new Promise<void>(resolve => waiters.push(resolve));
    }
    return frames.shift()!;
  };
  const opened = new Promise<void>((resolve, reject) => {
    socket.once('open', () => resolve());
    socket.once('error', reject);
    socket.once('unexpected-response', (_req, res) => reject(new Error(`HTTP ${res.statusCode}`)));
  });
  return { socket, next, opened };
}

describe('relay', () => {
  it('greets a client with its connection id', async () => {
    const { port } = await start();
    const client = connect(port);
    await client.opened;
    expect(await client.next()).toMatchObject({ type: 'welcome', connectionId: expect.any(String) });
  });

  it('forwards a message to every other client but not back to the sender', async () => {
    const { port } = await start();
    const a = connect(port);
    const b = connect(port);
    const c = connect(port);
    await Promise.all([a.opened, b.opened, c.opened]);
    const [welcomeA] = await Promise.all([a.next(), b.next(), c.next()]);

    a.socket.send(JSON.stringify({ type: 'rules', chromeinstanceid: 'a', payload: [1, 2] }));

    for (const peer of [b, c]) {
      expect(await peer.next()).toMatchObject({
        type: 'rules',
        chromeinstanceid: 'a',
        payload: [1, 2],
        connectionid: welcomeA.connectionId,
      });
    }
    // The sender's next frame is the pong to its own ping, not an echo.
    a.socket.send(JSON.stringify({ type: 'ping' }));
    expect(await a.next()).toEqual({ type: 'pong' });
  });

  it('overrides a connectionid claimed by the client', async () => {
    const { port } = await start();
    const a = connect(port);
    const b = connect(port);
    await Promise.all([a.opened, b.opened]);
    const [welcomeA] = await Promise.all([a.next(), b.next()]);

    a.socket.send(JSON.stringify({ type: 'live', connectionid: 'forged' }));

    expect(await b.next()).toMatchObject({ connectionid: welcomeA.connectionId });
  });

  it('does not forward control frames or malformed input', async () => {
    const { port } = await start();
    const a = connect(port);
    const b = connect(port);
    await Promise.all([a.opened, b.opened]);
    await Promise.all([a.next(), b.next()]);

    a.socket.send('not json');
    a.socket.send(JSON.stringify([1, 2]));
    a.socket.send(JSON.stringify({ type: 'welcome', connectionId: 'forged' }));
    a.socket.send(JSON.stringify({ type: 'live' }));

    // The only frame that reaches b is the valid one.
    expect(await b.next()).toMatchObject({ type: 'live' });
  });

  it('rejects a wrong secret', async () => {
    const { port } = await start();
    await expect(connect(port, 'wrong').opened).rejects.toThrow('HTTP 401');
  });

  it('rejects a web page origin but accepts an extension origin', async () => {
    const { port } = await start();
    await expect(connect(port, SECRET, 'https://evil.example').opened).rejects.toThrow('HTTP 403');
    await expect(connect(port, SECRET, 'chrome-extension://abc').opened).resolves.toBeUndefined();
  });

  it('can be limited to specific extension ids', async () => {
    const { port } = await start(['abc']);
    await expect(connect(port, SECRET, 'chrome-extension://other').opened).rejects.toThrow('HTTP 403');
    await expect(connect(port, SECRET, 'chrome-extension://abc').opened).resolves.toBeUndefined();
  });

  it('counts connected clients', async () => {
    const started = await start();
    const a = connect(started.port);
    await a.opened;
    await a.next();
    expect(started.clientCount).toBe(1);
  });
});

describe('isOriginAllowed', () => {
  it('allows a missing origin (non-browser client; the secret still applies)', () => {
    expect(isOriginAllowed(undefined)).toBe(true);
  });
  it('rejects non-extension origins', () => {
    expect(isOriginAllowed('http://localhost:4200')).toBe(false);
  });
});
