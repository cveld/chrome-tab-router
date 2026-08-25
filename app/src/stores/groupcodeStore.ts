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
  const res = await fetch('/api/groupcode', { credentials: 'include' });
  if (!res.ok) {
    throw new Error(`Generating the group code failed: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as IGroupCode;
  if (!data.encoded) {
    throw new Error('The server returned no encoded group code.');
  }
  setGroupcode({ encoded: data.encoded });
}
