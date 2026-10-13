import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { messageHandlers } from '../Messaging/ChromeMessaging';
import { registerOpenUrlHandler } from './openUrlHandler';

function stubChromeTabs() {
  const update = vi.fn(
    (tabId: number, _opts: { url: string }, cb: (tab: chrome.tabs.Tab | undefined) => void) => {
      cb({ id: tabId } as chrome.tabs.Tab);
    },
  );
  vi.stubGlobal('chrome', { tabs: { update }, runtime: { lastError: undefined } });
  return update;
}

describe('registerOpenUrlHandler', () => {
  beforeEach(() => {
    messageHandlers.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('updates the sender tab to the requested url', async () => {
    const update = stubChromeTabs();
    registerOpenUrlHandler();

    const sendResponse = vi.fn();
    const handler = messageHandlers.get('openUrlHere')!;
    const sender = { tab: { id: 42 } } as chrome.runtime.MessageSender;

    const kept = handler({ type: 'openUrlHere', payload: { url: 'https://example.com/' } }, sender, sendResponse);

    expect(kept).toBe(true); // channel kept open for the async sendResponse
    expect(update).toHaveBeenCalledWith(42, { url: 'https://example.com/' }, expect.any(Function));
    expect(sendResponse).toHaveBeenCalledWith({ ok: true });
  });

  it('rejects a message with no sender tab', () => {
    const update = stubChromeTabs();
    registerOpenUrlHandler();

    const sendResponse = vi.fn();
    const handler = messageHandlers.get('openUrlHere')!;
    const sender = {} as chrome.runtime.MessageSender;

    handler({ type: 'openUrlHere', payload: { url: 'https://example.com/' } }, sender, sendResponse);

    expect(update).not.toHaveBeenCalled();
    expect(sendResponse).toHaveBeenCalledWith({ ok: false, error: 'missing tab id or url' });
  });

  it('rejects a message with no url', () => {
    const update = stubChromeTabs();
    registerOpenUrlHandler();

    const sendResponse = vi.fn();
    const handler = messageHandlers.get('openUrlHere')!;
    const sender = { tab: { id: 42 } } as chrome.runtime.MessageSender;

    handler({ type: 'openUrlHere', payload: undefined as unknown as { url: string } }, sender, sendResponse);

    expect(update).not.toHaveBeenCalled();
    expect(sendResponse).toHaveBeenCalledWith({ ok: false, error: 'missing tab id or url' });
  });

  it('reports a chrome.runtime.lastError from tabs.update', () => {
    vi.stubGlobal('chrome', {
      tabs: {
        update: vi.fn((_tabId: number, _opts: { url: string }, cb: (tab: chrome.tabs.Tab | undefined) => void) =>
          cb(undefined),
        ),
      },
      runtime: { lastError: { message: 'No tab with id: 42.' } },
    });
    registerOpenUrlHandler();

    const sendResponse = vi.fn();
    const handler = messageHandlers.get('openUrlHere')!;
    const sender = { tab: { id: 42 } } as chrome.runtime.MessageSender;

    handler({ type: 'openUrlHere', payload: { url: 'https://example.com/' } }, sender, sendResponse);

    expect(sendResponse).toHaveBeenCalledWith({ ok: false, error: 'No tab with id: 42.' });
  });
});
