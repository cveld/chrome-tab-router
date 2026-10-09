# chrome-tab-router-localsync

A small relay that lets the [Chrome Tab Router](https://github.com/cveld/chrome-tab-router)
extension sync between your Chrome profiles **on this machine**, without the cloud service.
Nothing leaves your computer and you do not need an account.

It is the "Local relay" option on the extension's Connection tab. The alternative is the cloud
option, which works across machines.

## Usage

You need Node.js 20 or newer.

1. Start the relay and leave it running:

   ```bash
   npx chrome-tab-router-localsync start
   ```

2. In a second terminal, print the pairing code:

   ```bash
   npx chrome-tab-router-localsync pair
   ```

3. In the extension, open the **Connection** tab, choose **Local relay** and paste the pairing
   code (it looks like `ctr-local:48731:…`).
4. Repeat step 3 in every Chrome profile on this machine that should take part, with the same
   pairing code.

Syncing works while the relay is running. The profiles reconnect on their own when you start it
again.

## Commands

| Command | What it does |
| --- | --- |
| `start` | Runs the relay in the foreground, on `127.0.0.1` only |
| `pair` | Prints the pairing code to paste into the extension |
| `help` | Shows the usage text |

## Configuration

The first run creates `~/.chrome-tab-router/config.json` with the port (default `48731`) and a
random secret. The pairing code is built from those two values, so it stays the same until you
delete that file.

| Environment variable | Meaning |
| --- | --- |
| `CTR_LOCALSYNC_DIR` | Config directory (default `~/.chrome-tab-router`) |
| `CTR_LOCALSYNC_PORT` | Port for this run, instead of the configured one. The pairing code carries the configured port, so only use this together with a matching config. |
| `CTR_EXTENSION_IDS` | Comma-separated extension ids that may connect (default: any extension) |

## Security

- The relay listens on the loopback interface only.
- A connection needs the secret from the pairing code, and browser connections must come from an
  extension page (`chrome-extension://`), so a web page cannot talk to it.
- The relay forwards messages between your own profiles and does not store them.

## Protocol

For people writing their own client: frames are JSON text over a WebSocket at
`ws://127.0.0.1:<port>`. The client offers the subprotocols `ctr-v1` and `ctr-secret.<secret>`.
The relay answers with `{ "type": "welcome", "connectionId": "…" }`, replies to
`{ "type": "ping" }` with `{ "type": "pong" }`, and forwards every other frame to all other
connected clients, stamped with the sender's `connectionid`. See `src/protocol.ts`.

## License

MIT
