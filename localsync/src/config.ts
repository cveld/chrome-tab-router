import { randomBytes } from 'node:crypto';
import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

export const DEFAULT_PORT = 48731;

export interface IConfig {
  port: number;
  /** Shared with the extensions through the pairing string; never logged. */
  secret: string;
}

export function configDir(env: NodeJS.ProcessEnv = process.env): string {
  return env.CTR_LOCALSYNC_DIR ?? join(homedir(), '.chrome-tab-router');
}

export function newSecret(): string {
  // base64url is a valid WebSocket subprotocol token.
  return randomBytes(32).toString('base64url');
}

/** What the user pastes into the extension: `ctr-local:<port>:<secret>`. */
export function pairingString(config: IConfig): string {
  return `ctr-local:${config.port}:${config.secret}`;
}

/** Loads the config, creating it (with a fresh secret) on first use. */
export async function loadOrCreateConfig(dir = configDir()): Promise<IConfig> {
  const file = join(dir, 'config.json');
  try {
    const parsed = JSON.parse(await readFile(file, 'utf8')) as Partial<IConfig>;
    if (
      typeof parsed.port === 'number' &&
      Number.isInteger(parsed.port) &&
      typeof parsed.secret === 'string' &&
      parsed.secret !== ''
    ) {
      return { port: parsed.port, secret: parsed.secret };
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw new Error(`Cannot read ${file}: ${String(error)}`);
    }
  }
  const config: IConfig = { port: DEFAULT_PORT, secret: newSecret() };
  await mkdir(dir, { recursive: true });
  await writeFile(file, JSON.stringify(config, null, 2), { mode: 0o600 });
  // mode is ignored for an existing file and on Windows; best effort.
  await chmod(file, 0o600).catch(() => undefined);
  return config;
}
