import { describe, expect, it } from 'vitest';
import {
  defaultInterstitialSettings,
  normalizeInterstitialSettings,
  shouldPromptInterstitial,
  type IInterstitialSettings,
} from './SettingsModels';

const settings = (partial: Partial<IInterstitialSettings>): IInterstitialSettings => ({
  ...defaultInterstitialSettings,
  ...partial,
});

describe('normalizeInterstitialSettings', () => {
  it('falls back to the defaults for undefined input', () => {
    expect(normalizeInterstitialSettings(undefined)).toEqual(defaultInterstitialSettings);
  });

  it('rejects an unknown mode', () => {
    expect(normalizeInterstitialSettings({ mode: 'nonsense' as never }).mode).toBe('always');
  });

  it('clamps and rounds the countdown', () => {
    expect(normalizeInterstitialSettings({ countdownSeconds: 0 }).countdownSeconds).toBe(1);
    expect(normalizeInterstitialSettings({ countdownSeconds: 900 }).countdownSeconds).toBe(60);
    expect(normalizeInterstitialSettings({ countdownSeconds: 3.6 }).countdownSeconds).toBe(4);
    expect(normalizeInterstitialSettings({ countdownSeconds: NaN }).countdownSeconds).toBe(5);
  });
});

describe('shouldPromptInterstitial', () => {
  it('never prompts when switched off', () => {
    expect(shouldPromptInterstitial(settings({ mode: 'off' }), true, false, 2)).toBe(false);
  });

  it('never prompts when a rule points at this profile', () => {
    expect(shouldPromptInterstitial(settings({ mode: 'always' }), true, true, 2)).toBe(false);
  });

  it('never prompts without other profiles to route to', () => {
    expect(shouldPromptInterstitial(settings({ mode: 'always' }), true, false, 0)).toBe(false);
  });

  it('prompts for unmatched urls only in always mode', () => {
    expect(shouldPromptInterstitial(settings({ mode: 'always' }), false, false, 1)).toBe(true);
    expect(shouldPromptInterstitial(settings({ mode: 'matched' }), false, false, 1)).toBe(false);
  });

  it('prompts for matched urls in both matched and always mode', () => {
    expect(shouldPromptInterstitial(settings({ mode: 'matched' }), true, false, 1)).toBe(true);
    expect(shouldPromptInterstitial(settings({ mode: 'always' }), true, false, 1)).toBe(true);
  });
});
