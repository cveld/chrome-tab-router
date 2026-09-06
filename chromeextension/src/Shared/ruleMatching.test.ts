import { describe, expect, it } from 'vitest';
import type { IRule } from './RuleModels';
import { findMatchingRule, suggestRegexForUrl } from './ruleMatching';

describe('findMatchingRule', () => {
  it('returns the first matching rule', () => {
    const firstRule: IRule = { regex: 'example\\.com', targetUserprofile: 'first' };
    const secondRule: IRule = { regex: 'example\\.com', targetUserprofile: 'second' };

    expect(findMatchingRule([firstRule, secondRule], 'https://example.com/')).toBe(firstRule);
  });

  it('skips deleted rules', () => {
    const deletedRule: IRule = { regex: 'example\\.com', deleted: true };
    const activeRule: IRule = { regex: 'example\\.com' };

    expect(findMatchingRule([deletedRule, activeRule], 'https://example.com/')).toBe(activeRule);
  });

  it('skips rules without a regex', () => {
    const ruleWithoutRegex: IRule = { targetUserprofile: 'ignored' };
    const matchingRule: IRule = { regex: 'example\\.com' };

    expect(findMatchingRule([ruleWithoutRegex, matchingRule], 'https://example.com/')).toBe(
      matchingRule,
    );
  });

  it('supports RegExp objects and regex strings', () => {
    const objectRule: IRule = { regex: /^https:\/\/object\.example\// };
    const stringRule: IRule = { regex: '^https://string\\.example/' };

    expect(findMatchingRule([objectRule], 'https://object.example/path')).toBe(objectRule);
    expect(findMatchingRule([stringRule], 'https://string.example/path')).toBe(stringRule);
  });

  it('skips invalid regex strings rather than throwing', () => {
    const invalidRule: IRule = { regex: '[invalid' };
    const validRule: IRule = { regex: 'example\\.com' };

    expect(findMatchingRule([invalidRule, validRule], 'https://example.com/')).toBe(validRule);
  });

  it('returns undefined when no rule matches', () => {
    expect(findMatchingRule([{ regex: 'other\\.example' }], 'https://example.com/')).toBeUndefined();
  });
});

describe('suggestRegexForUrl', () => {
  it('escapes dots in the hostname', () => {
    expect(suggestRegexForUrl('https://github.com/foo/bar')).toBe('^https?://github\\.com/');
  });

  it('matches both http and https urls', () => {
    const url = 'https://github.com/foo/bar';
    const regex = new RegExp(suggestRegexForUrl(url));

    expect(regex.test(url)).toBe(true);
    expect(regex.test('http://github.com/foo/bar')).toBe(true);
  });

  it('supports subdomain hostnames', () => {
    const url = 'https://docs.example.com/guide';
    const suggestion = suggestRegexForUrl(url);

    expect(suggestion).toBe('^https?://docs\\.example\\.com/');
    expect(new RegExp(suggestion).test(url)).toBe(true);
  });

  it('falls back to an escaped literal for unparseable input', () => {
    const url = 'not a [valid] url';
    const suggestion = suggestRegexForUrl(url);

    expect(suggestion).toBe('^not a \\[valid\\] url');
    expect(new RegExp(suggestion).test(url)).toBe(true);
  });
});
