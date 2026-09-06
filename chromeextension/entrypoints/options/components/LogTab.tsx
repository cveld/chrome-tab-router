import { tabLogStore } from '../lib/backgroundStores';
import { useStore } from '../lib/stores';

export function LogTab() {
  // Newest entries first.
  const entries = [...useStore(tabLogStore)].reverse();

  return (
    <section>
      <table className="table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Target profile</th>
            <th>URL</th>
            <th>Tab id</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => (
            <tr key={`${entry.tabId}-${index}`}>
              <td>
                <span className={`status-badge ${String(entry.status).toLowerCase()}`}>
                  {entry.status}
                </span>
              </td>
              <td>{entry.targetUserprofile}</td>
              <td className="url-cell">{entry.url}</td>
              <td>{entry.tabId}</td>
            </tr>
          ))}
          {entries.length === 0 && (
            <tr>
              <td colSpan={4}>
                <i>No routed tabs yet</i>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
