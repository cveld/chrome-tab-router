import { useState } from 'react';
import { parsePairing } from '../../../src/Shared/SyncBackendModels';
import {
  clearLocalPairing,
  connectionStatusStore,
  groupcodeStore,
  reconnectSignalr,
  setLocalPairing,
  setSyncBackend,
  submitGroupcode,
  syncBackendStore,
} from '../../../src/UI/backgroundStores';
import { syncEndpoint } from '../../../src/UI/syncEndpoint';
import { useStore } from '../../../src/UI/stores';
import { openGroupcodeApp } from './WelcomeTab';

const RELAY_PACKAGE = 'chrome-tab-router-localsync';

function BackendChoice() {
  const state = useStore(syncBackendStore);

  return (
    <>
      <h2>How do you want to sync?</h2>
      <p>
        How this profile exchanges rules, user profiles and routed links with your other profiles.
        All profiles that should talk to each other must use the same option.
      </p>
      <label className="field">
        <input
          type="radio"
          name="sync-backend"
          checked={state.chosen && state.backend === 'cloud'}
          onChange={() => setSyncBackend('cloud')}
        />{' '}
        Cloud
        <span>
          Through the Azure service, using a groupcode. Works across machines and needs no
          installation.
        </span>
      </label>
      <label className="field">
        <input
          type="radio"
          name="sync-backend"
          checked={state.chosen && state.backend === 'local'}
          onChange={() => setSyncBackend('local')}
        />{' '}
        Local relay
        <span>
          Through a relay running on this machine. Nothing leaves your computer, but it only
          connects profiles on this machine and the relay must be running.
        </span>
      </label>
      {!state.chosen && (
        <p>
          <i>You have not chosen yet. Pick one to set up syncing for this profile.</i>
        </p>
      )}
    </>
  );
}

function Status() {
  const connectionStatus = useStore(connectionStatusStore);
  const syncBackend = useStore(syncBackendStore);

  return (
    <>
      <h2>Status</h2>
      <p>
        Connection status:{' '}
        <span className={`status-badge ${connectionStatus.status}`}>{connectionStatus.status}</span>
      </p>
      <p>
        Endpoint: <code>{syncEndpoint(syncBackend)}</code>
      </p>
      {connectionStatus.error ? <p className="error-text">{connectionStatus.error}</p> : null}
      <button type="button" className="btn secondary" onClick={() => reconnectSignalr()}>
        Reconnect
      </button>
    </>
  );
}

function CloudSetup() {
  const groupcode = useStore(groupcodeStore);
  const [entered, setEntered] = useState('');
  const [copyState, setCopyState] = useState<string>();

  const submitClicked = () => {
    const value = entered.trim();
    if (!value) {
      return;
    }
    submitGroupcode(value);
    setEntered('');
  };

  const copyClicked = async () => {
    try {
      await navigator.clipboard.writeText(groupcode);
      setCopyState('Copied to clipboard');
    } catch (error) {
      setCopyState(`Copy failed: ${String(error)}`);
    }
    setTimeout(() => setCopyState(undefined), 2000);
  };

  return (
    <>
      <h2>Cloud setup</h2>
      <div className="row">
        <b>Groupcode:</b>
        {groupcode ? (
          <>
            <span className="groupcode-value">{groupcode}</span>
            <button type="button" className="btn secondary" onClick={() => void copyClicked()}>
              Copy
            </button>
            {copyState && <span role="status">{copyState}</span>}
          </>
        ) : (
          <i>none yet</i>
        )}
      </div>
      <ol>
        <li>
          <b>First profile:</b> generate a groupcode. This opens the web app, where you sign in;
          the groupcode is handed to this extension automatically.
          <div className="row">
            <button type="button" className="btn primary" onClick={openGroupcodeApp}>
              Generate a groupcode
            </button>
          </div>
        </li>
        <li>
          <b>Every other profile:</b> do not generate a new one. Copy the groupcode from your
          first profile (the Copy button above) and enter it here.
          <textarea rows={4} value={entered} onChange={e => setEntered(e.target.value)} />
          <p>
            <button type="button" className="btn secondary" onClick={submitClicked}>
              Submit
            </button>
          </p>
        </li>
      </ol>
    </>
  );
}

function Command({ children }: { children: string }) {
  return <pre className="command">{children}</pre>;
}

function LocalSetup() {
  const state = useStore(syncBackendStore);
  const [entered, setEntered] = useState('');
  const [error, setError] = useState<string>();

  const pairClicked = () => {
    if (!parsePairing(entered)) {
      setError('That is not a pairing code. It looks like ctr-local:<port>:<secret>.');
      return;
    }
    setLocalPairing(entered.trim());
    setEntered('');
    setError(undefined);
  };

  return (
    <>
      <h2>Local relay setup</h2>
      <p>
        {state.localPort ? (
          <>
            Paired with the relay on port <code>{state.localPort}</code>.{' '}
            <button type="button" className="btn secondary" onClick={() => clearLocalPairing()}>
              Unpair
            </button>
          </>
        ) : (
          <i>Not paired with a local relay yet.</i>
        )}
      </p>
      <p>You need Node.js 20 or newer on this machine.</p>
      <ol>
        <li>
          <b>Start the relay</b> in a terminal and leave it running. It only listens on this
          machine, and syncing stops when you close it.
          <Command>{`npx ${RELAY_PACKAGE} start`}</Command>
        </li>
        <li>
          <b>Print the pairing code</b> in a second terminal. It is created on first use and stays
          the same afterwards.
          <Command>{`npx ${RELAY_PACKAGE} pair`}</Command>
        </li>
        <li>
          <b>Paste the pairing code here.</b>
          <input
            type="text"
            placeholder="ctr-local:48731:…"
            value={entered}
            autoComplete="off"
            spellCheck={false}
            onChange={event => setEntered(event.target.value)}
          />
          <p>
            <button type="button" className="btn secondary" onClick={pairClicked}>
              {state.localPort ? 'Replace pairing' : 'Pair'}
            </button>{' '}
            {error && <span className="error-text">{error}</span>}
          </p>
        </li>
        <li>
          <b>Repeat step 3 in every Chrome profile</b> on this machine that should take part, with
          the same pairing code.
        </li>
      </ol>
      <p>
        If the status above says it cannot reach the relay, the relay is not running or the code
        belongs to another relay.
      </p>
      <details>
        <summary>Running it from a checkout of the repository</summary>
        <p>From the repository root, instead of the npx commands:</p>
        <Command>{'npm run localsync:install\nnpm run localsync:start\nnpm run localsync:pair'}</Command>
      </details>
    </>
  );
}

export function ConnectionTab() {
  const { backend, chosen, localPort } = useStore(syncBackendStore);
  const groupcode = useStore(groupcodeStore);
  // There is nothing to report on until the chosen backend has its groupcode or pairing code.
  const configured = chosen && (backend === 'cloud' ? !!groupcode : !!localPort);

  return (
    <section className="narrow">
      <BackendChoice />
      {configured && <Status />}
      {chosen && backend === 'cloud' && <CloudSetup />}
      {chosen && backend === 'local' && <LocalSetup />}
    </section>
  );
}
