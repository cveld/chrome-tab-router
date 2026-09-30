// Dev-only replay of setting a group code: not known yet -> pasted ->
// connecting -> succeeded or failed. Drives the real computeBadgeStatus() and
// banner with timers that mimic signalr.ts (first attempt, then backoff
// retries that keep the previous error). Never talks to the background.
// Excluded from production builds (see wxt.config.ts).
import { useEffect, useRef, useState } from 'react';
import { computeBadgeStatus, type IBadgeStatus } from '../../src/Shared/BadgeStatusModels';
import { ConnectionStatusEnum } from '../../src/Shared/signalrModels';
import { MessageStatusEnum } from '../../src/Shared/MessageStatusModels';
import { MockIcon, MockOptionsPage, tooltip } from '../badge-preview/MockChrome';

const NEGOTIATE_ERROR =
  'Failed to complete negotiation with the server: Error: Internal Server Error: Status code 500';

/** Retry delays of signalr.ts (backoffschedule); the last one repeats. */
const RETRY_DELAYS_MS = [0, 5000, 15000, 30000, 60000];
const MAX_SIMULATED_RETRIES = 3;

type Outcome = 'success' | 'failure' | 'retry-success';
type RunPhase = 'running' | 'succeeded' | 'failed';

interface IConnectionState {
  status: ConnectionStatusEnum;
  error?: string;
}

interface ILogEntry {
  id: number;
  elapsedMs: number;
  event: string;
  connectionStatus: ConnectionStatusEnum;
  badgeResult: string;
}

const OUTCOMES: { value: Outcome; name: string; description: string }[] = [
  { value: 'success', name: 'Success', description: 'The first negotiate succeeds.' },
  {
    value: 'failure',
    name: 'Failure',
    description: `Every attempt fails (${MAX_SIMULATED_RETRIES} retries are simulated).`,
  },
  {
    value: 'retry-success',
    name: 'Retry success',
    description: 'The first attempt fails, the first retry succeeds.',
  },
];

const initialConnection: IConnectionState = { status: ConnectionStatusEnum.init };

function toBadgeStatus(connection: IConnectionState, hasGroupcode: boolean): IBadgeStatus {
  return computeBadgeStatus(connection, hasGroupcode, { status: MessageStatusEnum.init });
}

function badgeResult(status: IBadgeStatus): string {
  return status.problem ?? (status.connecting ? 'connecting' : 'none');
}

function freshInstallLog(): ILogEntry[] {
  return [
    {
      id: 0,
      elapsedMs: 0,
      event: 'Fresh install',
      connectionStatus: initialConnection.status,
      badgeResult: badgeResult(toBadgeStatus(initialConnection, false)),
    },
  ];
}

function sampleGroupcode(): string {
  return btoa(
    JSON.stringify({ clientprincipalname: { groupcode: 'demo-uuid' }, signature: 'demo-signature' }),
  );
}

export function Scenario() {
  const [outcome, setOutcome] = useState<Outcome>('success');
  const [latency, setLatency] = useState(1500);
  const [speedUpBackoff, setSpeedUpBackoff] = useState(true);
  const [hasGroupcode, setHasGroupcode] = useState(false);
  const [connection, setConnection] = useState<IConnectionState>(initialConnection);
  const [entered, setEntered] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [runPhase, setRunPhase] = useState<RunPhase>('running');
  const [log, setLog] = useState<ILogEntry[]>(freshInstallLog);
  const [activeTab, setActiveTab] = useState('Groupcode');

  const timersRef = useRef<number[]>([]);
  // Bumped on every run and reset, so timers of an older run do nothing.
  const runIdRef = useRef(0);
  const logIdRef = useRef(1);

  const badge = toBadgeStatus(connection, hasGroupcode);

  const clearTimers = () => {
    timersRef.current.forEach(timer => window.clearTimeout(timer));
    timersRef.current = [];
  };

  useEffect(
    () => () => {
      runIdRef.current += 1;
      clearTimers();
    },
    [],
  );

  const schedule = (runId: number, delay: number, callback: () => void) => {
    timersRef.current.push(
      window.setTimeout(() => {
        if (runId === runIdRef.current) {
          callback();
        }
      }, delay),
    );
  };

  const reset = () => {
    clearTimers();
    runIdRef.current += 1;
    logIdRef.current = 1;
    setHasGroupcode(false);
    setConnection(initialConnection);
    setEntered('');
    setSubmitted(false);
    setRunPhase('running');
    setLog(freshInstallLog());
    setActiveTab('Groupcode');
  };

  const submit = () => {
    const groupcode = entered.trim();
    if (!groupcode || submitted) {
      return;
    }

    clearTimers();
    const runId = ++runIdRef.current;
    const startedAt = Date.now();
    const negotiateLatency = Math.max(0, latency);
    const backoffFactor = speedUpBackoff ? 0.1 : 1;

    const transition = (event: string, next: IConnectionState, phase?: RunPhase) => {
      setConnection(next);
      if (phase) {
        setRunPhase(phase);
      }
      const entry: ILogEntry = {
        id: logIdRef.current++,
        elapsedMs: Date.now() - startedAt,
        event,
        connectionStatus: next.status,
        badgeResult: badgeResult(toBadgeStatus(next, true)),
      };
      setLog(current => [...current, entry]);
    };

    const failed: IConnectionState = { status: ConnectionStatusEnum.error, error: NEGOTIATE_ERROR };

    const retry = (retryNumber: number) => {
      const delay = RETRY_DELAYS_MS[Math.min(retryNumber - 1, RETRY_DELAYS_MS.length - 1)]! * backoffFactor;
      schedule(runId, delay, () => {
        transition(`Retry ${retryNumber} started after ${(delay / 1000).toFixed(1)}s backoff`, {
          status: ConnectionStatusEnum.connecting,
          error: NEGOTIATE_ERROR,
        });
        schedule(runId, negotiateLatency, () => {
          if (outcome === 'retry-success') {
            transition(`Retry ${retryNumber} succeeded`, { status: ConnectionStatusEnum.connected }, 'succeeded');
          } else if (retryNumber >= MAX_SIMULATED_RETRIES) {
            transition(
              `Retry ${retryNumber} failed; the background keeps retrying (up to every 60s)`,
              failed,
              'failed',
            );
          } else {
            transition(`Retry ${retryNumber} failed`, failed);
            retry(retryNumber + 1);
          }
        });
      });
    };

    setEntered(groupcode);
    setHasGroupcode(true);
    setSubmitted(true);
    transition('Group code submitted; negotiate started', { status: ConnectionStatusEnum.connecting }, 'running');

    schedule(runId, negotiateLatency, () => {
      if (outcome === 'success') {
        transition('Negotiate succeeded', { status: ConnectionStatusEnum.connected }, 'succeeded');
      } else {
        transition('Negotiate failed', failed);
        retry(1);
      }
    });
  };

  const currentStep =
    runPhase !== 'running' ? 3 : submitted ? 2 : entered.trim() ? 1 : 0;
  const steps = [
    'Group code not known',
    'Group code pasted',
    'Connecting',
    runPhase === 'failed' ? 'Failed' : runPhase === 'succeeded' ? 'Succeeded' : 'Succeeded / failed',
  ];

  return (
    <main className="content">
      <p>
        <a href="/dev.html">&larr; Development</a>
      </p>
      <h1>Groupcode setup scenario</h1>
      <p className="muted">
        Dev only. Replays pasting a group code into a fresh install, using the real{' '}
        <code>computeBadgeStatus()</code> and banner; the connection is simulated with timers like{' '}
        <code>signalr.ts</code>. Nothing is sent to the background.
      </p>

      <h2>1. Choose the outcome</h2>
      <div className="preset-grid">
        {OUTCOMES.map(option => (
          <label key={option.value} className="preset">
            <span>
              <input
                type="radio"
                name="outcome"
                value={option.value}
                checked={outcome === option.value}
                disabled={submitted}
                onChange={() => setOutcome(option.value)}
              />{' '}
              <b>{option.name}</b>
            </span>
            <span>{option.description}</span>
          </label>
        ))}
      </div>
      <div className="row scenario-options">
        <label>
          Negotiate latency (ms){' '}
          <input
            type="number"
            min="0"
            step="100"
            value={latency}
            disabled={submitted}
            onChange={e => setLatency(Math.max(0, Number(e.target.value) || 0))}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={speedUpBackoff}
            disabled={submitted}
            onChange={e => setSpeedUpBackoff(e.target.checked)}
          />{' '}
          Speed up backoff (÷10)
        </label>
      </div>

      <ol className="scenario-steps">
        {steps.map((step, index) => (
          <li key={index} className={index === currentStep ? 'current' : undefined}>
            {step}
          </li>
        ))}
      </ol>

      <h2>2. Paste a group code and submit</h2>
      <div className="mock-toolbar">
        <span className="muted">Chrome toolbar</span>
        <MockIcon status={badge} />
        <span className="mock-tooltip">Tooltip: {tooltip(badge)}</span>
      </div>
      <MockOptionsPage status={badge} activeTab={activeTab} onTab={setActiveTab}>
        {activeTab === 'Groupcode' ? (
          <div className="scenario-tab">
            <h3>Configured groupcode</h3>
            <div className="row">
              {hasGroupcode ? (
                <span className="groupcode-value">{entered}</span>
              ) : (
                <i>No groupcode assigned yet</i>
              )}
            </div>
            <h3>Existing groupcode</h3>
            <textarea
              rows={4}
              cols={40}
              value={entered}
              disabled={submitted}
              onChange={e => setEntered(e.target.value)}
            />
            <div className="row">
              <button
                type="button"
                className="btn secondary"
                disabled={submitted}
                onClick={() => setEntered(sampleGroupcode())}
              >
                Paste sample code
              </button>
              <button
                type="button"
                className="btn primary"
                disabled={!entered.trim() || submitted}
                onClick={submit}
              >
                Submit
              </button>
            </div>
          </div>
        ) : activeTab === 'Connection' ? (
          <div className="scenario-tab">
            <p>
              Status: <span className={`status-badge ${connection.status}`}>{connection.status}</span>
            </p>
            {connection.error && <p className="error-text">{connection.error}</p>}
          </div>
        ) : (
          <i>{activeTab} tab content (not rendered in the scenario)</i>
        )}
      </MockOptionsPage>
      <p>
        <button type="button" className="btn secondary" onClick={reset}>
          Reset
        </button>
      </p>

      <h2>3. Timeline</h2>
      <ol className="scenario-log">
        {log.map(entry => (
          <li key={entry.id}>
            <code>+{(entry.elapsedMs / 1000).toFixed(1)}s</code> {entry.event} — connection:{' '}
            <code>{entry.connectionStatus}</code>, badge: <code>{entry.badgeResult}</code>
          </li>
        ))}
      </ol>
    </main>
  );
}
