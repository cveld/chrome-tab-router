import { apiBaseUrl } from '../Background/settings';
import { localRelayUrl, type ISyncBackendState } from '../Shared/SyncBackendModels';

/** The address the background currently syncs through, for display. */
export function syncEndpoint(state: ISyncBackendState): string {
  if (state.backend === 'local') {
    return state.localPort ? localRelayUrl(state.localPort) : '(not paired)';
  }
  return `${apiBaseUrl}/api`;
}
