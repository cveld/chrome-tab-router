// Dev-only simulator for the extension icon badge and the options page banner
// that explains it. Uses the real computeBadgeStatus() and banner view, but
// never talks to the background, so every state can be forced by hand.
// Excluded from production builds (see wxt.config.ts).
import { useState } from 'react';
import { computeBadgeStatus, type IBadgeStatus } from '../../src/Shared/BadgeStatusModels';
import { ConnectionStatusEnum } from '../../src/Shared/signalrModels';
import { MessageStatusEnum } from '../../src/Shared/MessageStatusModels';
import { BadgeStatusBannerView } from '../options/components/BadgeStatusBannerView';
import { apiBaseUrl } from '../../src/Background/settings';
import { MockIcon, MockOptionsPage, tooltip } from './MockChrome';

interface ISimState {
  hasGroupcode: boolean;
  connection: ConnectionStatusEnum;
  connectionError: string;
  messages: MessageStatusEnum;
  messagesError: string;
}

const PRESETS: { name: string; description: string; state: ISimState }[] = [
  {
    name: 'Healthy',
    description: 'Group code set, connected, last message sent.',
    state: {
      hasGroupcode: true,
      connection: ConnectionStatusEnum.connected,
      connectionError: '',
      messages: MessageStatusEnum.success,
      messagesError: '',
    },
  },
  {
    name: 'Fresh install',
    description: 'Nothing configured yet.',
    state: {
      hasGroupcode: false,
      connection: ConnectionStatusEnum.init,
      connectionError: '',
      messages: MessageStatusEnum.init,
      messagesError: '',
    },
  },
  {
    name: 'Connecting',
    description: 'Group code just set, first SignalR attempt in flight. Not a problem.',
    state: {
      hasGroupcode: true,
      connection: ConnectionStatusEnum.connecting,
      connectionError: '',
      messages: MessageStatusEnum.init,
      messagesError: '',
    },
  },
  {
    name: 'Disconnected',
    description: 'Connection dropped; reconnect with backoff is running.',
    state: {
      hasGroupcode: true,
      connection: ConnectionStatusEnum.disconnected,
      connectionError: 'Disconnected',
      messages: MessageStatusEnum.success,
      messagesError: '',
    },
  },
  {
    name: 'Negotiate failed',
    description: 'The API rejected or could not be reached during negotiate.',
    state: {
      hasGroupcode: true,
      connection: ConnectionStatusEnum.error,
      connectionError: 'Failed to complete negotiation with the server: Error: Internal Server Error: Status code 500',
      messages: MessageStatusEnum.init,
      messagesError: '',
    },
  },
  {
    name: 'Retrying',
    description: 'An attempt failed; the backoff retry is connecting and keeps the error.',
    state: {
      hasGroupcode: true,
      connection: ConnectionStatusEnum.connecting,
      connectionError: 'Failed to complete negotiation with the server: Error: Internal Server Error: Status code 500',
      messages: MessageStatusEnum.init,
      messagesError: '',
    },
  },
  {
    name: 'Message send failed',
    description: 'Connected, but POST /api/messages failed.',
    state: {
      hasGroupcode: true,
      connection: ConnectionStatusEnum.connected,
      connectionError: '',
      messages: MessageStatusEnum.error,
      messagesError: 'Cannot send message: AxiosError: Request failed with status code 401',
    },
  },
  {
    name: 'Everything broken',
    description: 'No group code, connection error and failed message at once.',
    state: {
      hasGroupcode: false,
      connection: ConnectionStatusEnum.error,
      connectionError: 'Network error',
      messages: MessageStatusEnum.error,
      messagesError: 'Cannot send message: Network Error',
    },
  },
];

function toBadgeStatus(state: ISimState): IBadgeStatus {
  return computeBadgeStatus(
    { status: state.connection, error: state.connectionError || undefined },
    state.hasGroupcode,
    { status: state.messages, error: state.messagesError || undefined },
  );
}

function Simulator() {
  const [state, setState] = useState<ISimState>(PRESETS[1]!.state);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Welcome');
  const status = toBadgeStatus(state);

  const patch = (next: Partial<ISimState>) => setState(prev => ({ ...prev, ...next }));

  // A preset is a reset: like reloading the extension into that state.
  const applyPreset = (preset: ISimState) => {
    setState(preset);
    setOptionsOpen(false);
    setActiveTab('Welcome');
  };

  // Like chrome.runtime.openOptionsPage(): opens on Welcome, or focuses the open page.
  const clickIcon = () => {
    if (!optionsOpen) {
      setActiveTab('Welcome');
    }
    setOptionsOpen(true);
  };

  return (
    <main className="content">
      <p>
        <a href="/dev.html">&larr; Development</a>
      </p>
      <h1>Badge status simulator</h1>
      <p className="muted">
        Dev only. Uses the real <code>computeBadgeStatus()</code> and banner component; nothing is sent
        to the background. Pick a starting state, then click the icon like you would in Chrome.
      </p>

      <h2>1. Reset to a starting state</h2>
      <div className="preset-grid">
        {PRESETS.map(preset => (
          <button
            type="button"
            key={preset.name}
            className="preset"
            onClick={() => applyPreset(preset.state)}
          >
            <b>{preset.name}</b>
            <span>{preset.description}</span>
          </button>
        ))}
      </div>

      <h2>2. Tweak the inputs</h2>
      <div className="sim-controls">
        <span>Group code</span>
        <label>
          <input
            type="checkbox"
            checked={state.hasGroupcode}
            onChange={e => patch({ hasGroupcode: e.target.checked })}
          />{' '}
          set
        </label>
        <span />

        <span>SignalR connection</span>
        <select
          value={state.connection}
          onChange={e => patch({ connection: e.target.value as ConnectionStatusEnum })}
        >
          <option value={ConnectionStatusEnum.connected}>connected</option>
          <option value={ConnectionStatusEnum.init}>init</option>
          <option value={ConnectionStatusEnum.connecting}>connecting</option>
          <option value={ConnectionStatusEnum.disconnected}>disconnected</option>
          <option value={ConnectionStatusEnum.error}>error</option>
        </select>
        <input
          type="text"
          placeholder="connection error text"
          value={state.connectionError}
          onChange={e => patch({ connectionError: e.target.value })}
        />

        <span>Last message</span>
        <select
          value={state.messages}
          onChange={e => patch({ messages: e.target.value as MessageStatusEnum })}
        >
          <option value={MessageStatusEnum.init}>init (none sent)</option>
          <option value={MessageStatusEnum.success}>success</option>
          <option value={MessageStatusEnum.error}>error</option>
        </select>
        <input
          type="text"
          placeholder="message error text"
          value={state.messagesError}
          onChange={e => patch({ messagesError: e.target.value })}
        />
      </div>

      <h2>3. Click the icon</h2>
      <div className="mock-toolbar">
        <span className="muted">Chrome toolbar</span>
        <MockIcon status={status} onClick={clickIcon} />
        <span className="mock-tooltip">Tooltip: {tooltip(status)}</span>
      </div>
      {optionsOpen ? (
        <MockOptionsPage status={status} activeTab={activeTab} onTab={setActiveTab}>
          <i>{activeTab} tab content (not rendered in the simulator)</i>
        </MockOptionsPage>
      ) : (
        <p className="muted">The options page opens here once you click the icon.</p>
      )}

      <h2>All states side by side</h2>
      {PRESETS.map(preset => {
        const presetStatus = toBadgeStatus(preset.state);
        return (
          <section key={preset.name} className="gallery-item">
            <div className="gallery-head">
              <MockIcon status={presetStatus} />
              <div>
                <b>{preset.name}</b> — <span className="muted">{preset.description}</span>
                <div className="mock-tooltip">
                  problem: {presetStatus.problem ?? 'none'} · tooltip: {tooltip(presetStatus)}
                </div>
              </div>
            </div>
            {presetStatus.problem || presetStatus.connecting ? (
              <BadgeStatusBannerView status={presetStatus} endpoint={apiBaseUrl} onNavigate={() => {}} />
            ) : (
              <p className="muted">No badge and no banner (a "Connected" notice shows briefly after connecting).</p>
            )}
          </section>
        );
      })}
    </main>
  );
}

export { Simulator };
