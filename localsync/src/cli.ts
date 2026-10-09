#!/usr/bin/env node
import { loadOrCreateConfig, pairingString } from './config.js';
import { startRelay } from './server.js';

const USAGE = `Usage: chrome-tab-router-localsync <command>

Commands:
  start   Run the relay in the foreground (127.0.0.1 only)
  pair    Print the pairing code to paste into the extension
  help    Show this text

Environment:
  CTR_LOCALSYNC_DIR      Config directory (default: ~/.chrome-tab-router)
  CTR_LOCALSYNC_PORT     Override the configured port for this run
  CTR_EXTENSION_IDS      Comma-separated extension ids allowed to connect (default: any extension)
`;

/** Resolves to an exit code, or undefined when the process should keep running. */
async function main(command: string | undefined): Promise<number | undefined> {
  switch (command) {
    case 'pair': {
      const config = await loadOrCreateConfig();
      console.log(pairingString(config));
      return 0;
    }
    case 'start': {
      const config = await loadOrCreateConfig();
      const port = Number(process.env.CTR_LOCALSYNC_PORT ?? config.port);
      const allowedExtensionIds = (process.env.CTR_EXTENSION_IDS ?? '')
        .split(',')
        .map(id => id.trim())
        .filter(id => id !== '');
      const relay = await startRelay({
        port,
        secret: config.secret,
        allowedExtensionIds,
        log: message => console.log(`${new Date().toISOString()} ${message}`),
      });
      console.log(`Listening on ws://127.0.0.1:${relay.port}`);
      console.log('Pairing code: run "chrome-tab-router-localsync pair"');
      const shutdown = () => void relay.close().then(() => process.exit(0));
      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
      return undefined;
    }
    default:
      console.log(USAGE);
      return command === undefined || command === 'help' ? 0 : 1;
  }
}

main(process.argv[2]).then(
  code => {
    if (code !== undefined) {
      process.exit(code);
    }
  },
  error => {
    console.error(String(error instanceof Error ? error.message : error));
    process.exit(1);
  },
);
