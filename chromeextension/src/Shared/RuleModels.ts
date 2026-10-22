export interface IRule {
  action?: 'route' | 'current-profile';
  sync?: boolean;
  regex?: RegExp | string;
  targetUserprofile?: string;
  id?: string;
  updated?: number;
  deleted?: boolean;
}

export type RulePatch = Pick<
  IRule,
  'regex' | 'targetUserprofile' | 'action' | 'sync'
>;

// Missing fields preserve the behaviour of rules from older extension versions.
export function isSyncedRule(rule: IRule): boolean {
  return rule.sync !== false;
}
