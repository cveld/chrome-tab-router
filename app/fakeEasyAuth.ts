// Dev-only stand-in for Azure Static Web Apps EasyAuth, so the login flow can
// be exercised against the plain Vite dev server. It serves /.auth/me,
// /.auth/login/<provider> and /.auth/logout, tracks the session in a cookie,
// and exposes the matching x-ms-client-principal header for the /api proxy.
// Nothing here ends up in the production build (apply: 'serve').
import type { Plugin } from 'vite';

const COOKIE_NAME = 'fake_easyauth';

const clientPrincipal = {
  identityProvider: 'aad',
  userId: 'local-dev',
  userDetails: 'local-dev@localhost',
  userRoles: ['anonymous', 'authenticated'],
};

/** Base64 principal header, same shape SWA forwards to the Functions API. */
export const fakeClientPrincipalHeader = btoa(JSON.stringify(clientPrincipal));

/** Whether the request carries the fake session cookie. */
export function hasFakeSession(cookieHeader: string | undefined): boolean {
  return (cookieHeader ?? '')
    .split(';')
    .some(part => part.trim() === `${COOKIE_NAME}=1`);
}

function redirectTarget(url: URL, param: string): string {
  const target = url.searchParams.get(param) ?? '/';
  // Only allow same-origin relative paths, like SWA does.
  return target.startsWith('/') && !target.startsWith('//') ? target : '/';
}

export function fakeEasyAuth(): Plugin {
  return {
    name: 'fake-easyauth',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        if (!url.pathname.startsWith('/.auth/')) {
          next();
          return;
        }

        if (url.pathname === '/.auth/me') {
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              clientPrincipal: hasFakeSession(req.headers.cookie) ? clientPrincipal : null,
            })
          );
          return;
        }

        if (url.pathname.startsWith('/.auth/login/')) {
          res.statusCode = 302;
          res.setHeader('Set-Cookie', `${COOKIE_NAME}=1; Path=/; HttpOnly; SameSite=Lax`);
          res.setHeader('Location', redirectTarget(url, 'post_login_redirect_uri'));
          res.end();
          return;
        }

        if (url.pathname === '/.auth/logout') {
          res.statusCode = 302;
          res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`);
          res.setHeader('Location', redirectTarget(url, 'post_logout_redirect_uri'));
          res.end();
          return;
        }

        res.statusCode = 404;
        res.end();
      });
    },
  };
}
