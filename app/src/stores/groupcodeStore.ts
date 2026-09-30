// Group code state: fetched from /api/groupcode, mirrored to/from the
// extension through the content-script bridge. Replaces the old Angular
// GroupcodeHandler service with identical semantics.
import { createStore } from '../lib/stores';
import {
  contentScriptReadyStore,
  dispatchEventToContentScript,
  ensureDocumentEventing,
  eventHandlers,
} from '../messaging/documentEventing';

export interface IGroupCode {
  clientprincipalname?: unknown;
  signature?: string;
  encoded?: string;
}

ensureDocumentEventing();

export const groupcodeStore = createStore<IGroupCode>({});

eventHandlers.set('groupcode', event => {
  groupcodeStore.set((event.payload as IGroupCode) ?? {});
});

// Ask the extension for its current group code as soon as it is reachable.
contentScriptReadyStore.subscribe(() => {
  requestGroupcode();
});

function requestGroupcode(): void {
  dispatchEventToContentScript({ type: 'getgroupcode' });
}

/** Push a group code into local state and hand it to the extension. */
export function setGroupcode(groupcode: IGroupCode): void {
  groupcodeStore.set(groupcode);
  dispatchEventToContentScript({ type: 'groupcode', payload: groupcode });
}

/**
 * Mint a fresh group code via the backend and adopt it. Rejects with an
 * Error whose message the UI can show directly.
 */
export async function generateGroupcode(): Promise<void> {
  // Absolute URL so error messages show exactly which endpoint was called.
  const endpoint = new URL('/api/groupcode', window.location.origin).href;
  let res: Response;
  try {
    res = await fetch(endpoint, { credentials: 'include' });
  } catch {
    throw new Error(`The groupcode service at ${endpoint} could not be reached.`);
  }
  if (res.status === 401 || res.status === 403) {
    throw new Error('You need to log in before you can generate a groupcode.');
  }
  if (res.status === 502 || res.status === 503 || res.status === 504) {
    throw new Error(
      `The groupcode service at ${endpoint} is unreachable right now (${res.status}). Please try again later.`
    );
  }
  if (!res.ok) {
    throw new Error(
      `Generating the group code failed: ${endpoint} responded ${res.status} ${res.statusText}`
    );
  }
  const data = (await res.json()) as IGroupCode;
  if (!data.encoded) {
    throw new Error('The server returned no encoded group code.');
  }
  setGroupcode({ encoded: data.encoded });
}
