// Wire contract between the extension (src/Background/localsync.ts) and this
// relay. Frames are JSON text. Everything except the reserved control types is
// an extension message ({ type, chromeinstanceid, connectionid, payload }) that
// the relay forwards verbatim to every other client, mirroring what the Azure
// hub does for a group.

/** Offered by the client as a WebSocket subprotocol; the server selects it. */
export const PROTOCOL = 'ctr-v1';

/** The client offers its secret as a second subprotocol: `ctr-secret.<secret>`. */
export const SECRET_PROTOCOL_PREFIX = 'ctr-secret.';

/** Control frames the relay owns; clients may not send the server-to-client ones. */
export const CONTROL_TYPES = {
  ping: 'ping',
  pong: 'pong',
  welcome: 'welcome',
} as const;

export interface IFrame {
  type: string;
  connectionid?: string;
  [key: string]: unknown;
}

export const MAX_FRAME_BYTES = 1024 * 1024;

export function parseFrame(raw: string): IFrame | undefined {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return undefined;
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return undefined;
  }
  const type = (value as { type?: unknown }).type;
  return typeof type === 'string' && type !== '' ? (value as IFrame) : undefined;
}

export function extractSecret(protocols: Iterable<string>): string | undefined {
  for (const protocol of protocols) {
    if (protocol.startsWith(SECRET_PROTOCOL_PREFIX)) {
      return protocol.slice(SECRET_PROTOCOL_PREFIX.length);
    }
  }
  return undefined;
}
