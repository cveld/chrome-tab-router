import { describe, expect, it } from 'vitest';
import * as rulesHandlerUtility from './rulesHandlerUtility';
import type { IRule } from '../Shared/RuleModels';
describe('rulesHandlerUtility - mergeRules', () => {
  it('runs when new values are undefined', () => {
    const result = rulesHandlerUtility.mergeRules([], undefined);
    expect(result).toEqual({ merged: [], haschanges: false });
  });
  it('never sends private rules, including their tombstones', () => {
    const legacy: IRule = { id: 'legacy' };
    const shared: IRule = {
      id: 'shared',
      sync: true,
      action: 'current-profile',
    };
    expect(
      rulesHandlerUtility.syncedRules([
        legacy,
        shared,
        { id: 'local', sync: false },
        { id: 'deleted-local', sync: false, deleted: true },
      ]),
    ).toEqual([legacy, shared]);
  });
  it('preserves private rules and ignores incoming private rules and ID collisions', () => {
    const local: IRule = {
      id: 'local',
      sync: false,
      regex: 'secret',
      updated: 1,
    };
    const result = rulesHandlerUtility.mergeRules(
      [local],
      [
        { id: 'local', regex: 'remote', updated: 2 },
        { id: 'foreign-local', sync: false, updated: 2 },
        { id: 'shared', action: 'current-profile', updated: 2 },
      ],
    );
    expect(result.merged).toEqual([
      { id: 'shared', action: 'current-profile', updated: 2 },
      local,
    ]);
    expect(result.haschanges).toBe(false);
  });
  it('merges all fields and timestamps without mutating inputs', () => {
    const old: IRule = {
      id: 'rule',
      regex: 'new',
      action: 'current-profile',
      sync: true,
      updated: 20,
    };
    const incoming: IRule = {
      id: 'rule',
      regex: 'old',
      targetUserprofile: 'other',
      updated: 10,
    };
    const result = rulesHandlerUtility.mergeRules([old], [incoming]);
    expect(result).toEqual({ merged: [old], haschanges: true });
    expect(incoming.updated).toBe(10);
    expect(incoming.regex).toBe('old');
  });
  it('propagates shared deletion while keeping the private replacement local', () => {
    const timestamp = Date.now();
    const withdrawn: IRule = {
      id: 'shared',
      deleted: true,
      updated: timestamp,
    };
    const local: IRule = {
      id: 'replacement',
      sync: false,
      action: 'current-profile',
      updated: timestamp,
    };
    const outgoing = rulesHandlerUtility.syncedRules([withdrawn, local]);
    const result = rulesHandlerUtility.mergeRules(
      [{ id: 'shared', updated: timestamp - 1 }],
      outgoing,
    );
    expect(result.merged).toEqual([withdrawn]);
  });
});
