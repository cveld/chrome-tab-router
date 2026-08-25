// State owned by the Static Web Apps auth endpoint.
import { createStore } from '../lib/stores';

export interface IAuthMeState {
  status: 'init' | 'loading' | 'done' | 'error';
  /** Parsed body of /.auth/me, or the error message while status === 'error'. */
  response?: unknown;
}

export const authMeStore = createStore<IAuthMeState>({ status: 'init' });

export function isLoggedIn(state: IAuthMeState): boolean {
  const principal = (state.response as { clientPrincipal?: unknown } | undefined)
    ?.clientPrincipal;
  return principal != null;
}

export function refreshAuthMe(): void {
  authMeStore.set({ status: 'loading' });
  fetch('/.auth/me', { credentials: 'include' })
    .then(async res => {
      if (!res.ok) {
        throw new Error(`/.auth/me responded ${res.status} ${res.statusText}`);
      }
      authMeStore.set({ status: 'done', response: await res.json() });
    })
    .catch((e: unknown) => {
      authMeStore.set({
        status: 'error',
        response: e instanceof Error ? e.message : String(e),
      });
    });
}
