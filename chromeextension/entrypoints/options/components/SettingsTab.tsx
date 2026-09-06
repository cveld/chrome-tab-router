import type { InterstitialMode } from '../../../src/Shared/SettingsModels';
import { saveSettings, settingsStore } from '../../../src/UI/backgroundStores';
import { useStore } from '../../../src/UI/stores';

const MODES: Array<{ value: InterstitialMode; label: string; hint: string }> = [
  {
    value: 'always',
    label: 'Always',
    hint: 'Every newly opened url shows the router page first.',
  },
  {
    value: 'matched',
    label: 'Only when a rule matches',
    hint: 'Urls without a matching rule load straight away.',
  },
  {
    value: 'off',
    label: 'Off',
    hint: 'Matching urls are routed immediately, without asking.',
  },
];

export function SettingsTab() {
  const settings = useStore(settingsStore);

  return (
    <section className="narrow">
      <h2>Router page</h2>
      <p>
        The router page shows where an incoming link is headed and lets you send it somewhere else.
        It is skipped when a rule points at this profile, or when no other user profiles are
        registered.
      </p>
      {MODES.map(mode => (
        <label key={mode.value} className="field">
          <input
            type="radio"
            name="interstitial-mode"
            value={mode.value}
            checked={settings.mode === mode.value}
            onChange={() => saveSettings({ ...settings, mode: mode.value })}
          />{' '}
          {mode.label}
          <span>{mode.hint}</span>
        </label>
      ))}

      <label className="field">
        <span>Countdown before routing (seconds)</span>
        <input
          type="number"
          min={1}
          max={60}
          value={settings.countdownSeconds}
          disabled={settings.mode === 'off'}
          onChange={event =>
            saveSettings({ ...settings, countdownSeconds: Number(event.target.value) })
          }
        />
      </label>
    </section>
  );
}
