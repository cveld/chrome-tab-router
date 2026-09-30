import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { fakeClientPrincipalHeader, fakeEasyAuth, hasFakeSession } from './fakeEasyAuth';

export default defineConfig({
  plugins: [react(), fakeEasyAuth()],
  // The Azure Static Web Apps workflow pins output_location to "dist/app"
  // (relative to app_location: "app"), so keep that path instead of Vite's
  // default "dist".
  build: {
    outDir: 'dist/app',
  },
  server: {
    // Port 4200 is load-bearing: the extension's content script matches
    // http://localhost/* and hands generated group codes to the extension from
    // this origin, and chromeextension/.env points WXT_CONFIG_URL here.
    port: 4200,
    proxy: {
      '/api': {
        target: 'http://localhost:7071',
        changeOrigin: false,
        secure: false,
        // Forward the fake EasyAuth principal only while "logged in" through
        // fakeEasyAuth, so /api/groupcode answers 401 when logged out just
        // like it does behind Static Web Apps.
        configure: proxy => {
          proxy.on('proxyReq', (proxyReq, req) => {
            if (hasFakeSession(req.headers.cookie)) {
              proxyReq.setHeader('x-ms-client-principal', fakeClientPrincipalHeader);
            }
          });
        },
      },
    },
  },
});
