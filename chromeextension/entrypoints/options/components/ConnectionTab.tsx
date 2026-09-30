import { connectionStatusStore, reconnectSignalr } from '../../../src/UI/backgroundStores';
import { useStore } from '../../../src/UI/stores';
import { apiBaseUrl } from '../../../src/Background/settings';

export function ConnectionTab() {
  const connectionStatus = useStore(connectionStatusStore);

  return (
    <section>
      <p>
        Connection status:{' '}
        <span className={`status-badge ${connectionStatus.status}`}>{connectionStatus.status}</span>
      </p>
      <p>
        Endpoint: <code>{apiBaseUrl}/api</code>
      </p>
      {connectionStatus.error ? <p className="error-text">{connectionStatus.error}</p> : null}
      <button type="button" className="btn secondary" onClick={() => reconnectSignalr()}>
        Reconnect
      </button>
    </section>
  );
}
