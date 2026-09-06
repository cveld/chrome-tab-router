export type InterstitialMode = 'off' | 'matched' | 'always';

export interface IInterstitialSettings {
  mode: InterstitialMode;
  countdownSeconds: number;
}

export const defaultInterstitialSettings: IInterstitialSettings = {
  mode: 'always',
  countdownSeconds: 5,
};

/**
 * Whether a newly opened url should be handed to the interstitial router page
 * instead of being routed (or ignored) straight away.
 */
export function shouldPromptInterstitial(
  settings: IInterstitialSettings,
  hasMatch: boolean,
  targetsSelf: boolean,
  otherProfileCount: number,
): boolean {
  // A rule pointing at this very profile is an explicit decision already, and
  // without other profiles to route to there is nothing to choose from.
  if (settings.mode === 'off' || targetsSelf || otherProfileCount === 0) {
    return false;
  }
  return settings.mode === 'always' || hasMatch;
}

export function normalizeInterstitialSettings(
  value: Partial<IInterstitialSettings> | undefined,
): IInterstitialSettings {
  const mode =
    value?.mode === 'off' || value?.mode === 'matched' || value?.mode === 'always'
      ? value.mode
      : defaultInterstitialSettings.mode;
  const countdown = Number(value?.countdownSeconds ?? defaultInterstitialSettings.countdownSeconds);

  return {
    mode,
    countdownSeconds: Number.isNaN(countdown)
      ? defaultInterstitialSettings.countdownSeconds
      : Math.min(60, Math.max(1, Math.round(countdown))),
  };
}
