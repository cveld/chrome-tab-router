/**
 * Where this profile syncs rules, user profiles and routed urls through:
 * the Azure SignalR hub ('cloud', needs a group code) or a relay running on
 * this machine ('local', needs a pairing code). Machine-local setting: it is
 * never synced, and profiles on different backends do not see each other.
 */
export type SyncBackend = 'cloud' | 'local';

export const SYNC_BACKEND_STORAGE_KEY = 'syncBackend';
export const LOCAL_PAIRING_STORAGE_KEY = 'localsyncpairing';

export function isSyncBackend(value: unknown): value is SyncBackend {
  return value === 'cloud' || value === 'local';
}

export function normalizeSyncBackend(value: unknown, fallback: SyncBackend): SyncBackend {
  return isSyncBackend(value) ? value : fallback;
}

export interface ILocalPairing {
  port: number;
  secret: string;
}

/** What the options page may know about the pairing; the secret stays in the background. */
export interface ISyncBackendState {
  backend: SyncBackend;
  /** False until the user picked a backend; `backend` is then only the build default. */
  chosen: boolean;
  /** Port of the paired local relay, absent while not paired. */
  localPort?: number;
}

const PAIRING_PREFIX = 'ctr-local';

/** Parses `ctr-local:<port>:<secret>` as printed by `chrome-tab-router-localsync pair`. */
export function parsePairing(value: unknown): ILocalPairing | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const parts = value.trim().split(':');
  if (parts.length !== 3 || parts[0] !== PAIRING_PREFIX) {
    return undefined;
  }
  const port = Number(parts[1]);
  const secret = parts[2]!;
  // The secret travels as a WebSocket subprotocol, which must be an HTTP token.
  if (!Number.isInteger(port) || port < 1 || port > 65535 || !/^[A-Za-z0-9_-]+$/.test(secret)) {
    return undefined;
  }
  return { port, secret };
}

export function localRelayUrl(port: number): string {
  return `ws://127.0.0.1:${port}`;
}
