import { BehaviorSubject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConnectionStatusEnum, type IConnectionStatus } from '../Shared/signalrModels';
import { LocalTransport, type ISocketLike } from './localsync';

class FakeSocket implements ISocketLike {
  onmessage: ISocketLike['onmessage'] = null;
  onclose: ISocketLike['onclose'] = null;
  onerror: ISocketLike['onerror'] = null;
  sent: Array<Record<string, unknown>> = [];
  closed = false;
  constructor(
    readonly url: string,
    readonly protocols: string[],
  ) {}
  send(data: string) {
    this.sent.push(JSON.parse(data));
  }
  close() {
    this.closed = true;
  }
  /** Relay → client */
  receive(frame: Record<string, unknown>) {
    this.onmessage?.({ data: JSON.stringify(frame) });
  }
  /** The connection drops (or never gets established). */
  drop() {
    this.onclose?.();
  }
}

const pairing = { port: 48731, secret: 'sec_ret-1' };

describe('LocalTransport', () => {
  let sockets: FakeSocket[];
  let status: BehaviorSubject<IConnectionStatus>;
  let transport: LocalTransport;

  beforeEach(() => {
    vi.useFakeTimers();
    sockets = [];
    status = new BehaviorSubject<IConnectionStatus>({ status: ConnectionStatusEnum.init });
    transport = new LocalTransport(status, (url, protocols) => {
      const socket = new FakeSocket(url, protocols);
      sockets.push(socket);
      return socket;
    });
  });

  afterEach(() => {
    transport.stop();
    vi.useRealTimers();
  });

  const last = () => sockets[sockets.length - 1]!;

  it('connects to loopback and offers the secret as a subprotocol, not in the url', () => {
    transport.start(pairing);

    expect(last().url).toBe('ws://127.0.0.1:48731');
    expect(last().protocols).toEqual(['ctr-v1', 'ctr-secret.sec_ret-1']);
    expect(status.value.status).toBe(ConnectionStatusEnum.connecting);
  });

  it('is connected once the relay has said welcome, with the relay-assigned id', () => {
    transport.start(pairing);
    last().receive({ type: 'welcome', connectionId: 'c1' });

    expect(status.value).toEqual({ status: ConnectionStatusEnum.connected, connectionId: 'c1' });
    expect(transport.connectionId()).toBe('c1');
  });

  it('does not send before the welcome', async () => {
    transport.start(pairing);

    expect(await transport.send({ type: 'rules' })).toEqual({ delivered: false });
    expect(last().sent).toEqual([]);
  });

  it('sends messages as frames once connected', async () => {
    transport.start(pairing);
    last().receive({ type: 'welcome', connectionId: 'c1' });

    expect(await transport.send({ type: 'rules', chromeinstanceid: 'me', payload: [1] })).toEqual({
      delivered: true,
    });
    expect(last().sent).toEqual([{ type: 'rules', chromeinstanceid: 'me', payload: [1] }]);
  });

  it('hands other frames to onMessage but swallows control frames', () => {
    const received: unknown[] = [];
    transport.onMessage = message => received.push(message);
    transport.start(pairing);

    last().receive({ type: 'welcome', connectionId: 'c1' });
    last().receive({ type: 'pong' });
    last().receive({ type: 'openurl', chromeinstanceid: 'other', payload: { url: 'https://x' } });

    expect(received).toEqual([
      { type: 'openurl', chromeinstanceid: 'other', payload: { url: 'https://x' } },
    ]);
  });

  it('pings every 15s and reconnects when the relay goes silent', () => {
    transport.start(pairing);
    const socket = last();
    socket.receive({ type: 'welcome', connectionId: 'c1' });

    vi.advanceTimersByTime(15_000);
    expect(socket.sent).toEqual([{ type: 'ping' }]);
    socket.receive({ type: 'pong' });

    vi.advanceTimersByTime(15_000);
    expect(socket.sent).toHaveLength(2);
    expect(socket.closed).toBe(false);

    // No pong this time: after 30s of silence the next tick gives up.
    vi.advanceTimersByTime(30_000);
    expect(socket.closed).toBe(true);
  });

  it('reports a drop and retries with backoff, keeping the error while retrying', () => {
    transport.start(pairing);
    last().receive({ type: 'welcome', connectionId: 'c1' });

    last().drop();
    expect(status.value).toEqual({ status: ConnectionStatusEnum.disconnected, error: 'Disconnected' });
    expect(transport.connectionId()).toBeNull();

    vi.advanceTimersByTime(1_000);
    expect(sockets).toHaveLength(2);
    expect(status.value).toEqual({ status: ConnectionStatusEnum.connecting, error: 'Disconnected' });
  });

  it('explains an unreachable relay and backs off further on repeated failure', () => {
    transport.start(pairing);
    last().drop();

    expect(status.value.status).toBe(ConnectionStatusEnum.error);
    expect(status.value.error).toContain('ws://127.0.0.1:48731');

    vi.advanceTimersByTime(1_000);
    expect(sockets).toHaveLength(2);
    last().drop();

    vi.advanceTimersByTime(4_999);
    expect(sockets).toHaveLength(2);
    vi.advanceTimersByTime(1);
    expect(sockets).toHaveLength(3);
  });

  it('starts over with the shortest backoff after a successful connection', () => {
    transport.start(pairing);
    last().drop();
    vi.advanceTimersByTime(1_000);
    last().drop();
    vi.advanceTimersByTime(5_000);
    last().receive({ type: 'welcome', connectionId: 'c1' });

    last().drop();
    vi.advanceTimersByTime(1_000);

    expect(sockets).toHaveLength(4);
  });

  it('ignores events of a socket it already replaced', () => {
    transport.start(pairing);
    const old = last();
    transport.reconnect();

    old.drop();
    old.receive({ type: 'welcome', connectionId: 'stale' });

    expect(sockets).toHaveLength(2);
    expect(transport.connectionId()).toBeNull();
    expect(status.value.status).toBe(ConnectionStatusEnum.connecting);
  });

  it('reconnects at once on a manual reconnect', () => {
    transport.start(pairing);
    last().receive({ type: 'welcome', connectionId: 'c1' });

    transport.reconnect();

    expect(sockets).toHaveLength(2);
    expect(status.value.status).toBe(ConnectionStatusEnum.connecting);
  });

  it('lets the watchdog start an attempt while waiting for a retry, but not during one', () => {
    transport.start(pairing);
    last().drop();

    transport.reconnectIfDisconnected();
    expect(sockets).toHaveLength(2);

    transport.reconnectIfDisconnected();
    expect(sockets).toHaveLength(2);
  });

  it('stays quiet when stopped', () => {
    transport.start(pairing);
    last().receive({ type: 'welcome', connectionId: 'c1' });
    const socket = last();

    transport.stop();
    vi.advanceTimersByTime(120_000);

    expect(socket.closed).toBe(true);
    expect(transport.running).toBe(false);
    expect(sockets).toHaveLength(1);
    transport.reconnect();
    transport.reconnectIfDisconnected();
    expect(sockets).toHaveLength(1);
  });

  it('knows which pairing it runs with', () => {
    transport.start(pairing);

    expect(transport.isPairedWith({ ...pairing })).toBe(true);
    expect(transport.isPairedWith({ ...pairing, secret: 'other' })).toBe(false);
  });
});
