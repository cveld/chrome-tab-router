import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addRule,
  changeRule,
  deleteRule,
  rulesStore,
} from './backgroundStores';

const send = vi.hoisted(() => vi.fn());
vi.mock('../Messaging/ScriptChromeMessagingPort', () => ({
  ScriptChromeMessagingWithPort: {
    getInstance: () => ({
      setHandler: vi.fn(),
      sendMessage: send,
      onReconnect: vi.fn(),
      onConnectionChange: vi.fn(),
      connected: true,
    }),
  },
}));

describe('rule commands', () => {
  beforeEach(() => {
    rulesStore.set([]);
    send.mockClear();
  });

  it('adds a current-profile rule with a local sync scope', () => {
    addRule({ regex: 'localhost', action: 'current-profile', sync: false });
    expect(rulesStore.get()).toEqual([
      expect.objectContaining({
        action: 'current-profile',
        sync: false,
        id: expect.any(String),
      }),
    ]);
  });

  it('withdraws a shared rule and creates a new private ID when sync is disabled', () => {
    const shared = { id: 'old', regex: 'shared', updated: Date.now() };
    rulesStore.set([shared]);
    changeRule(shared, {
      regex: 'private',
      action: 'current-profile',
      sync: false,
    });
    const [withdrawn, local] = rulesStore.get();
    expect(withdrawn).toMatchObject({
      id: 'old',
      regex: 'shared',
      deleted: true,
    });
    expect(local).toMatchObject({
      regex: 'private',
      action: 'current-profile',
      sync: false,
    });
    expect(local?.id).not.toBe('old');
  });

  it('can publish a previously private rule', () => {
    const local = { id: 'local', sync: false };
    rulesStore.set([local]);
    changeRule(local, {
      regex: 'localhost',
      action: 'current-profile',
      sync: true,
    });
    expect(rulesStore.get()).toEqual([
      expect.objectContaining({
        id: 'local',
        sync: true,
        action: 'current-profile',
      }),
    ]);
  });

  it('advances the deletion timestamp for offline-peer reconciliation', () => {
    const rule = { id: 'rule', updated: Date.now() + 1000 };
    const previous = rule.updated;
    rulesStore.set([rule]);
    deleteRule(rule);
    expect(rule.updated).toBeGreaterThan(previous);
    expect(rulesStore.get()[0]?.deleted).toBe(true);
  });
});
