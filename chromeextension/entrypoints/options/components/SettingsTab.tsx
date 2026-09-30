import { useEffect, useState } from 'react';
import type { InterstitialMode } from '../../../src/Shared/SettingsModels';
import { getLogLevel, normalizeLogLevel, type LogLevel } from '../../../src/Shared/logger';
import { LOG_LEVEL_STORAGE_KEY, saveLogLevel } from '../../../src/Shared/logStorage';
import { saveSettings, settingsStore } from '../../../src/UI/backgroundStores';
import { copyDiagnostics } from '../../../src/UI/diagnostics';
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

const LOG_LEVEL_OPTIONS: Array<{ value: LogLevel; label: string }> = [
  { value: 'error', label: 'Errors only' },
  { value: 'warn', label: 'Warnings and errors' },
  { value: 'info', label: 'Info (default)' },
  { value: 'debug', label: 'Debug: every routing decision and message' },
];

function useLogLevel(): LogLevel {
  const [level, setLevel] = useState<LogLevel>(getLogLevel);
  useEffect(() => {
    chrome.storage.local.get<{ logLevel?: LogLevel }>(LOG_LEVEL_STORAGE_KEY, value => {
      setLevel(normalizeLogLevel(value.logLevel));
    });
    const listener = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
      const change = changes[LOG_LEVEL_STORAGE_KEY];
      if (areaName === 'local' && change) {
        setLevel(normalizeLogLevel(change.newValue));
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);
  return level;
}

function DiagnosticsSection() {
  const logLevel = useLogLevel();
  const [copyState, setCopyState] = useState<string>();

  const copyClicked = async () => {
    setCopyState('Collecting…');
    try {
      const result = await copyDiagnostics('options page');
      setCopyState(
        result.backgroundIncluded
          ? 'Copied to the clipboard.'
          : 'Copied, but the service worker did not answer: only this page is included.',
      );
    } catch (error) {
      setCopyState(`Copy failed: ${String(error)}`);
    }
  };

  return (
    <>
      <h2>Diagnostics</h2>
      <p>
        The extension keeps its most recent log lines in memory. Copy them together with the
        connection state, user profiles and rules to include in a bug report. Group codes and
        tokens are left out and tab urls are reduced to their origin, but do review the text
        before sharing it.
      </p>
      <label className="field">
        <span>Log level</span>
        <select
          value={logLevel}
          onChange={event => void saveLogLevel(normalizeLogLevel(event.target.value))}
        >
          {LOG_LEVEL_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <div className="row">
        <button type="button" className="btn secondary" onClick={() => void copyClicked()}>
          Copy diagnostics
        </button>
        {copyState && <span role="status">{copyState}</span>}
      </div>
    </>
  );
}

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

      <DiagnosticsSection />
    </section>
  );
}
