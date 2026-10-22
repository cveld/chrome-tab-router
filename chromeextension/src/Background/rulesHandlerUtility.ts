import { isSyncedRule, type IRule } from '../Shared/RuleModels';
import { v4 as uuidv4 } from 'uuid';

export function syncedRules(rules: IRule[]): IRule[] {
  return rules.filter(isSyncedRule);
}

export function mergeRules(oldValue: IRule[], newValue: IRule[] | undefined) {
  const localRules = oldValue.filter(rule => !isSyncedRule(rule));
  const localIds = new Set(localRules.map(rule => rule.id));
  const mergedMap = new Map<string, IRule>();
  const threeMonthsAgo = Date.now() - 3 * 30 * 24 * 60 * 60 * 1000;
  const retained = (rule: IRule) =>
    !rule.deleted || rule.updated! > threeMonthsAgo;

  for (const incoming of syncedRules(newValue ?? [])) {
    // A peer cannot overwrite this profile's private rules, even by ID.
    if (incoming.id && localIds.has(incoming.id)) continue;
    const rule = {
      ...incoming,
      id: incoming.id || uuidv4(),
      updated: incoming.updated || Date.now(),
    };
    if (retained(rule)) mergedMap.set(rule.id, rule);
  }

  let haschanges = false;
  for (const existing of syncedRules(oldValue)) {
    const rule = {
      ...existing,
      id: existing.id || uuidv4(),
      updated: existing.updated || Date.now(),
    };
    const incoming = mergedMap.get(rule.id);
    if (retained(rule) && (!incoming || rule.updated > incoming.updated!)) {
      mergedMap.set(rule.id, rule);
      haschanges = true;
    }
  }

  return { merged: [...mergedMap.values(), ...localRules], haschanges };
}
