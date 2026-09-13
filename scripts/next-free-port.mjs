/**
 * Starts Next on the first genuinely free port, never one the backend owns.
 *
 * Next's own behaviour is not safe here: it starts at 3000 and increments, so with the gateway
 * already on 3000 it would happily claim 3001..3007 — the auth, user, business, booking, payment,
 * notification and report services. The mobile apps resolve their API host as
 * `http://<host>:3000/api`, so a dashboard squatting a backend port silently swallows API traffic
 * and RTK Query reports a JSON parse error on an HTML 404 rather than anything pointing here.
 *
 * So: scan upward from BASE_PORT, skipping RESERVED outright.
 */
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/** Backend services own 3000-3007. Never hand any of these to a frontend. */
const RESERVED = new Set([3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007]);

/** Well clear of the backend block. Override with DEV_PORT_START to run several copies. */
const BASE_PORT = Number(process.env.DEV_PORT_START) || 4100;
const MAX_ATTEMPTS = 100;

/**
 * Resolves true only if we could actually bind the port.
 *
 * Binding is the test rather than connecting: a failed connection also happens when something is
 * listening but refusing, and on Windows a port can be held in a state that accepts no connection
 * yet still blocks a later bind.
 */
function isFree(port) {
  return new Promise((resolve) => {
    const probe = createServer();
    probe.once('error', () => resolve(false));
    probe.once('listening', () => probe.close(() => resolve(true)));
    probe.listen(port, '0.0.0.0');
  });
}

async function findFreePort() {
  for (let port = BASE_PORT; port < BASE_PORT + MAX_ATTEMPTS; port += 1) {
    if (RESERVED.has(port)) continue;
    if (await isFree(port)) return port;
  }
  throw new Error(
    `No free port in ${BASE_PORT}-${BASE_PORT + MAX_ATTEMPTS - 1} (excluding backend ports 3000-3007).`,
  );
}

const [subcommand = 'dev', ...passthrough] = process.argv.slice(2);
const port = await findFreePort();

if (port !== BASE_PORT) {
  console.log(`[port] ${BASE_PORT} busy — using ${port} instead`);
}
console.log(`[port] starting "next ${subcommand}" on http://localhost:${port}`);

// Invoke Next's bin through this same Node binary with argv passed as an array: the repo path
// contains a space, which a shell-interpolated command would split.
const nextBin = fileURLToPath(new URL('../node_modules/next/dist/bin/next', import.meta.url));
const child = spawn(process.execPath, [nextBin, subcommand, '-p', String(port), ...passthrough], {
  stdio: 'inherit',
});

// Relay the terminal's Ctrl-C to Next so it can shut down and release the port.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}
child.on('exit', (code, signal) => process.exit(signal ? 1 : (code ?? 0)));
