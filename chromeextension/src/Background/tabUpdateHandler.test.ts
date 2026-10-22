import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BehaviorSubject } from 'rxjs';
import type { IRule } from '../Shared/RuleModels';
import { findMatchingRule } from '../Shared/ruleMatching';
import { registerTabUpdateHandler } from './tabUpdateHandler';

const mocks = vi.hoisted(() => ({
  rules: [] as IRule[],
  send: vi.fn(),
  pageSend: vi.fn(),
  pageHandlers: new Map(),
}));
vi.mock('./rulesHandler', () => ({
  matchingRule: (url: string) => findMatchingRule(mocks.rules, url),
  checkUrl: (url: string) => {
    const match = findMatchingRule(mocks.rules, url);
    return match?.action === 'current-profile'
      ? undefined
      : match?.targetUserprofile;
  },
}));
vi.mock('./signalrmessages', () => ({
  addHandler: vi.fn(),
  sendSignalrMessage: mocks.send,
}));
vi.mock('./BackgroundChromeInstanceIdHandler', () => ({
  chromeInstanceId: new BehaviorSubject('self'),
}));
vi.mock('./userprofilesHandler', () => ({
  userprofiles: new BehaviorSubject([{ chromeInstanceId: 'other' }]),
}));
vi.mock('./interstitialSettingsHandler', () => ({
  interstitialSettings: new BehaviorSubject({
    mode: 'always',
    countdownSeconds: 5,
  }),
}));
vi.mock('../Messaging/BackgroundChromeMessagingPort', () => ({
  BackgroundChromeMessagingWithPort: {
    getInstance: () => ({
      sendMessage: mocks.pageSend,
      messageHandlers: mocks.pageHandlers,
    }),
  },
}));
vi.mock('../Shared/logger', () => ({
  createLogger: () => ({ debug: vi.fn(), error: vi.fn() }),
}));

function event() {
  return { addListener: vi.fn() };
}

describe('current-profile tab handling', () => {
  let api: any;
  const url =
    'https://terraform-resource-viewer.localhost/connect?requestid=test';
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rules = [
      { regex: 'localhost', targetUserprofile: 'other' },
      {
        regex:
          '^https://terraform-resource-viewer\\.localhost/connect(?:[/?#]|$)',
        action: 'current-profile',
      },
    ];
    api = {
      tabs: {
        onCreated: event(),
        onUpdated: event(),
        onRemoved: event(),
        update: vi.fn(),
        create: vi.fn(),
        remove: vi.fn(),
      },
      webNavigation: { onBeforeNavigate: event() },
      storage: {
        local: {
          set: vi.fn(),
          get: vi.fn((_key, callback) => callback({ log: [] })),
        },
      },
      runtime: { getURL: (path: string) => `chrome-extension://test/${path}` },
    };
    vi.stubGlobal('chrome', api);
    registerTabUpdateHandler();
  });

  function expectUntouched() {
    expect(api.tabs.update).not.toHaveBeenCalled();
    expect(api.tabs.create).not.toHaveBeenCalled();
    expect(api.tabs.remove).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
    expect(api.storage.local.set).toHaveBeenCalledWith({
      log: [
        expect.objectContaining({
          status: 'Self',
          targetUserprofile: 'self',
          url,
        }),
      ],
    });
  }

  it('leaves a directly opened popup untouched despite Always mode and a broad route', async () => {
    await api.tabs.onCreated.addListener.mock.calls[0][0]({
      id: 101,
      pendingUrl: url,
      openerTabId: 1,
    });
    expectUntouched();
  });

  it('handles a popup whose URL arrives later, ignoring iframe navigations', async () => {
    await api.tabs.onCreated.addListener.mock.calls[0][0]({
      id: 102,
      url: 'about:blank',
    });
    const navigate =
      api.webNavigation.onBeforeNavigate.addListener.mock.calls[0][0];
    navigate({ tabId: 102, frameId: 0, url });
    navigate({ tabId: 102, frameId: 1, url: 'https://other.example/' });
    api.tabs.onUpdated.addListener.mock.calls[0][0](
      102,
      { status: 'loading' },
      {},
    );
    expectUntouched();
  });

  it('uses an updated URL when no navigation event has been received', async () => {
    await api.tabs.onCreated.addListener.mock.calls[0][0]({ id: 103 });
    api.tabs.onUpdated.addListener.mock.calls[0][0](103, { url }, {});
    expectUntouched();
  });

  it('still prompts for a normal routing rule', async () => {
    await api.tabs.onCreated.addListener.mock.calls[0][0]({
      id: 104,
      url: 'https://other.localhost/',
    });
    expect(api.tabs.update).toHaveBeenCalledWith(104, {
      url: expect.stringContaining('router.html?url='),
    });
  });
});
