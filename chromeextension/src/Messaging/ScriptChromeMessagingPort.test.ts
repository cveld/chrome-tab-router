import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Minimal stand-in for chrome.runtime.Port / chrome.runtime.connect.
class FakePort {
  posted: unknown[] = [];
  dead = false;
  private messageListeners: ((m: any, p: FakePort) => void)[] = [];
  private disconnectListeners: (() => void)[] = [];
  onMessage = { addListener: (l: (m: any, p: FakePort) => void) => this.messageListeners.push(l) };
  onDisconnect = { addListener: (l: () => void) => this.disconnectListeners.push(l) };
  postMessage(m: unknown) {
    if (this.dead) {
      throw new Error('Attempting to use a disconnected port object');
    }
    this.posted.push(m);
  }
  disconnect() {
    this.dead = true;
  }
  receive(m: any) {
    this.messageListeners.forEach(l => l(m, this));
  }
  drop(error?: string) {
    this.dead = true;
    runtime.lastError = error ? { message: error } : undefined;
    this.disconnectListeners.forEach(l => l());
    runtime.lastError = undefined;
  }
}

const runtime: { lastError?: { message: string }; connect: ReturnType<typeof vi.fn> } = {
  connect: vi.fn(),
};
let created: FakePort[];

async function freshInstance(name = 'popup') {
  vi.resetModules();
  const { ScriptChromeMessagingWithPort } = await import('./ScriptChromeMessagingPort');
  return ScriptChromeMessagingWithPort.getInstance(name);
}

beforeEach(() => {
  vi.useFakeTimers();
  created = [];
  runtime.connect = vi.fn(() => {
    const port = new FakePort();
    created.push(port);
    return port;
  });
  vi.stubGlobal('chrome', { runtime });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('ScriptChromeMessagingWithPort', () => {
  it('only reports connected after the first inbound message', async () => {
    const messaging = await freshInstance();
    const changes: boolean[] = [];
    messaging.onConnectionChange(c => changes.push(c));

    expect(messaging.connected).toBe(false);
    created[0]!.receive({ type: 'rules', payload: [] });
    expect(messaging.connected).toBe(true);
    expect(changes).toEqual([true]);
  });

  it('dispatches inbound messages to the registered handler', async () => {
    const messaging = await freshInstance();
    const handler = vi.fn();
    messaging.setHandler('rules', handler);
    created[0]!.receive({ type: 'rules', payload: [1] });
    expect(handler).toHaveBeenCalledWith({ type: 'rules', payload: [1] }, created[0]);
  });

  it('reports the lastError when the worker never answers', async () => {
    const messaging = await freshInstance();
    const errors: (string | undefined)[] = [];
    messaging.onConnectionChange((_c, e) => errors.push(e));

    created[0]!.drop('Could not establish connection. Receiving end does not exist.');
    expect(errors).toEqual(['Could not establish connection. Receiving end does not exist.']);
    expect(messaging.lastError).toMatch(/Receiving end does not exist/);
  });

  it('queues while disconnected, then reconnects with backoff and flushes in order', async () => {
    const messaging = await freshInstance();
    const reconnects = vi.fn();
    messaging.onReconnect(reconnects);

    created[0]!.drop('gone');
    expect(() => messaging.sendMessage({ type: 'a' })).not.toThrow();
    messaging.sendMessage({ type: 'b' });
    expect(created).toHaveLength(1);

    vi.advanceTimersByTime(1000);
    expect(created).toHaveLength(2);
    expect(created[1]!.posted).toEqual([{ type: 'a' }, { type: 'b' }]);
    expect(reconnects).toHaveBeenCalledTimes(1);

    // A second failure before any message arrived backs off further.
    created[1]!.drop('gone');
    vi.advanceTimersByTime(1999);
    expect(created).toHaveLength(2);
    vi.advanceTimersByTime(1);
    expect(created).toHaveLength(3);
  });

  it('resets the backoff once the background answered', async () => {
    const messaging = await freshInstance();
    created[0]!.drop('gone');
    vi.advanceTimersByTime(1000);
    created[1]!.drop('gone');
    vi.advanceTimersByTime(2000);
    created[2]!.receive({ type: 'log' });
    expect(messaging.connected).toBe(true);

    created[2]!.drop();
    expect(messaging.connected).toBe(false);
    vi.advanceTimersByTime(1000);
    expect(created).toHaveLength(4);
  });

  it('recovers when postMessage throws on a port that just died', async () => {
    const messaging = await freshInstance();
    created[0]!.dead = true;
    expect(() => messaging.sendMessage({ type: 'x' })).not.toThrow();
    vi.advanceTimersByTime(1000);
    expect(created[1]!.posted).toEqual([{ type: 'x' }]);
  });

  it('ignores a late disconnect from a replaced port', async () => {
    const messaging = await freshInstance();
    const old = created[0]!;
    old.drop('gone');
    vi.advanceTimersByTime(1000);
    created[1]!.receive({ type: 'log' });

    old.drop('late');
    expect(messaging.connected).toBe(true);
    expect(created).toHaveLength(2);
  });

  it('retries when connect() itself throws', async () => {
    runtime.connect = vi.fn(() => {
      throw new Error('Extension context invalidated.');
    });
    const messaging = await freshInstance();
    expect(messaging.lastError).toBe('Extension context invalidated.');
    runtime.connect = vi.fn(() => {
      const port = new FakePort();
      created.push(port);
      return port;
    });
    vi.advanceTimersByTime(1000);
    expect(created).toHaveLength(1);
  });
});
