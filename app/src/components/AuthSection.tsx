import { useEffect } from 'react';
import {
  authMeStore,
  isLoggedIn,
  refreshAuthMe,
} from '../stores/authStore';
import { useStore } from '../lib/stores';

/** EasyAuth status card: principal info, login/logout links and a refresh. */
export function AuthSection() {
  const authMe = useStore(authMeStore);
  const loggedIn = isLoggedIn(authMe);

  // Initial fetch on mount (the old component called authMe() in a binding).
  useEffect(() => {
    if (authMe.status === 'init') {
      refreshAuthMe();
    }
  });

  return (
    <section className="card">
      <h2>Easy Auth</h2>
      {authMe.status !== 'init' && (
        <>
          Your easy auth information:
          <pre className="json-block">{JSON.stringify(authMe.response, null, 2)}</pre>
          {authMe.status === 'error' && (
            <p>
              <b>There is an error while fetching your auth token. Check your connection.</b>
            </p>
          )}
          {!loggedIn && <p><b>Please log in</b></p>}
          {loggedIn && <p><b>Logged in</b></p>}
          <p className="row">
            {loggedIn ? (
              <a className="btn secondary" href="/.auth/logout">
                Log out
              </a>
            ) : (
              <a className="btn primary" href="/.auth/login/aad">
                Log in
              </a>
            )}
            <button type="button" className="btn secondary" onClick={() => refreshAuthMe()}>
              Refresh auth token
            </button>
          </p>
        </>
      )}
    </section>
  );
}
