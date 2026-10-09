import { randomUUID, timingSafeEqual } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { WebSocketServer, type WebSocket } from 'ws';
import {
  CONTROL_TYPES,
  MAX_FRAME_BYTES,
  PROTOCOL,
  extractSecret,
  parseFrame,
} from './protocol.js';

export interface IRelayOptions {
  port: number;
  secret: string;
  /** Defaults to loopback only; never bind elsewhere without a reason. */
  host?: string;
  /**
   * Browser-originated connections carry an Origin header. Only extension
   * pages may connect; this list (extension ids) narrows that further. Empty
   * means "any extension". Connections without an Origin (Node clients) are
   * allowed because the secret still applies.
   */
  allowedExtensionIds?: string[];
  log?: (message: string) => void;
}

export interface IRelay {
  readonly port: number;
  readonly clientCount: number;
  close(): Promise<void>;
}

export function isOriginAllowed(origin: string | undefined, allowedExtensionIds: string[] = []): boolean {
  if (origin === undefined) {
    return true;
  }
  const prefix = 'chrome-extension://';
  if (!origin.startsWith(prefix)) {
    return false;
  }
  return allowedExtensionIds.length === 0 || allowedExtensionIds.includes(origin.slice(prefix.length));
}

function secretMatches(expected: string, offered: string | undefined): boolean {
  if (offered === undefined) {
    return false;
  }
  const a = Buffer.from(expected);
  const b = Buffer.from(offered);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function startRelay(options: IRelayOptions): Promise<IRelay> {
  const log = options.log ?? (() => undefined);
  const host = options.host ?? '127.0.0.1';
  const clients = new Map<string, WebSocket>();

  const http: Server = createServer((_request, response) => {
    // Plain HTTP is not part of the protocol; answer without any detail.
    response.writeHead(404).end();
  });

  const wss = new WebSocketServer({
    server: http,
    maxPayload: MAX_FRAME_BYTES,
    handleProtocols: protocols => (protocols.has(PROTOCOL) ? PROTOCOL : false),
    verifyClient: ({ origin, req }, done) => {
      if (!isOriginAllowed(origin || undefined, options.allowedExtensionIds)) {
        log(`rejected connection: origin ${origin} is not allowed`);
        return done(false, 403, 'Forbidden');
      }
      const header = req.headers['sec-websocket-protocol'];
      const protocols = (Array.isArray(header) ? header.join(',') : (header ?? ''))
        .split(',')
        .map(p => p.trim());
      if (!protocols.includes(PROTOCOL) || !secretMatches(options.secret, extractSecret(protocols))) {
        log('rejected connection: missing or wrong secret');
        return done(false, 401, 'Unauthorized');
      }
      done(true);
    },
  });

  wss.on('connection', socket => {
    const connectionId = randomUUID();
    clients.set(connectionId, socket);
    log(`client connected (${clients.size} total)`);
    socket.send(JSON.stringify({ type: CONTROL_TYPES.welcome, connectionId }));

    socket.on('message', (data, isBinary) => {
      if (isBinary) {
        return;
      }
      const frame = parseFrame(data.toString());
      if (!frame) {
        return;
      }
      if (frame.type === CONTROL_TYPES.ping) {
        socket.send(JSON.stringify({ type: CONTROL_TYPES.pong }));
        return;
      }
      if (frame.type === CONTROL_TYPES.pong || frame.type === CONTROL_TYPES.welcome) {
        return;
      }
      // The connection id is the relay's to assign: a client cannot claim
      // another one's.
      const outgoing = JSON.stringify({ ...frame, connectionid: connectionId });
      for (const [id, other] of clients) {
        if (id !== connectionId && other.readyState === other.OPEN) {
          other.send(outgoing);
        }
      }
    });

    socket.on('close', () => {
      clients.delete(connectionId);
      log(`client disconnected (${clients.size} total)`);
    });
    socket.on('error', error => log(`socket error: ${error.message}`));
  });

  await new Promise<void>((resolve, reject) => {
    http.once('error', reject);
    http.listen(options.port, host, () => {
      http.off('error', reject);
      resolve();
    });
  });

  return {
    get port() {
      return (http.address() as AddressInfo).port;
    },
    get clientCount() {
      return clients.size;
    },
    close: () =>
      new Promise<void>(resolve => {
        for (const socket of clients.values()) {
          socket.terminate();
        }
        wss.close(() => http.close(() => resolve()));
      }),
  };
}
