import type { IRule } from './RuleModels';

export function findMatchingRule(rules: IRule[], url: string): IRule | undefined {
  return rules.find(rule => {
    if (rule.deleted || !rule.regex) {
      return false;
    }

    try {
      return new RegExp(rule.regex).test(url);
    } catch {
      // A rule with a broken regex must not break routing for every other rule.
      return false;
    }
  });
}

export function suggestRegexForUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    return `^https?://${escapeRegex(parsedUrl.hostname)}/`;
  } catch {
    return `^${escapeRegex(url)}`;
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
