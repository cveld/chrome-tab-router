import { connectionStatusStore, reconnectSignalr } from '../lib/backgroundStores';
import { useStore } from '../lib/stores';

export function ConnectionTab() {
  const connectionStatus = useStore(connectionStatusStore);

  return (
    <section>
      <p>
        Connection status:{' '}
        <span className={`status-badge ${connectionStatus.status}`}>{connectionStatus.status}</span>
      </p>
      {connectionStatus.error ? <p className="error-text">{connectionStatus.error}</p> : null}
      <button type="button" className="btn secondary" onClick={() => reconnectSignalr()}>
        Reconnect
      </button>
    </section>
  );
}
