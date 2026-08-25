import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
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
        headers: {
          // Same fake EasyAuth principal the old angular proxy.conf.json
          // injected, so /api/groupcode works against a locally running
          // Functions host without Static Web Apps authentication.
          'x-ms-client-principal':
            'eyJ1c2VySWQiOiJsb2NhbC1kZXYiLCJ1c2VyUm9sZXMiOlsiYW5vbnltb3VzIiwiYXV0aGVudGljYXRlZCJdfQ==',
        },
      },
    },
  },
});
