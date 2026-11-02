import type { IRule } from './RuleModels';

export function findMatchingRule(
  rules: IRule[],
  url: string,
): IRule | undefined {
  const matches = (rule: IRule) => {
    if (rule.deleted || !rule.regex) {
      return false;
    }

    try {
      return new RegExp(rule.regex).test(url);
    } catch {
      // A rule with a broken regex must not break routing for every other rule.
      return false;
    }
  };
  // Exceptions must win over broader routing rules, regardless of list order.
  return (
    rules.find(rule => rule.action === 'current-profile' && matches(rule)) ??
    rules.find(matches)
  );
}

export function suggestRegexForUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    // Only web urls may match both schemes; chrome://downloads/ must keep its own.
    const scheme =
      parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:'
        ? 'https?'
        : escapeRegex(parsedUrl.protocol.slice(0, -1));
    return `^${scheme}://${escapeRegex(parsedUrl.hostname)}/`;
  } catch {
    return `^${escapeRegex(url)}`;
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
