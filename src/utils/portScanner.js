const net = require('net');

const A_CNXN = 0x4e584e43;
const A_STLS = 0x534c5453;
const A_AUTH = 0x48545541;
const ADB_VERSION = 0x01000001;
const MAX_PAYLOAD = 256 * 1024;

/**
 * Range used by Android for the Wireless debugging port (Linux ephemeral ports).
 */
const DEFAULT_PORT_RANGE = { from: 32768, to: 60999 };

/**
 * Errors caused by too many open sockets: the port must be tried again, it is not closed.
 */
const RETRYABLE_ERRORS = new Set(['EMFILE', 'ENFILE', 'ENOBUFS', 'EADDRNOTAVAIL']);

/**
 * Builds an adb CNXN packet, the first message an adb host sends to a device.
 * @returns {Buffer}
 */
function buildConnectPacket() {
  const payload = Buffer.from('host::\0');
  const header = Buffer.alloc(24);

  header.writeUInt32LE(A_CNXN, 0);
  header.writeUInt32LE(ADB_VERSION, 4);
  header.writeUInt32LE(MAX_PAYLOAD, 8);
  header.writeUInt32LE(payload.length, 12);
  header.writeUInt32LE(payload.reduce((sum, byte) => sum + byte, 0), 16);
  header.writeUInt32LE((A_CNXN ^ 0xffffffff) >>> 0, 20);

  return Buffer.concat([header, payload]);
}

/**
 * Checks if a response comes from adbd (it answers CNXN with STLS, CNXN or AUTH).
 * @param {Buffer} data - The first bytes received.
 * @returns {boolean}
 */
function isAdbResponse(data) {
  if (!data || data.length < 4) return false;
  return [A_STLS, A_CNXN, A_AUTH].includes(data.readUInt32LE(0));
}

/**
 * Tries to open a TCP connection.
 * @param {string} host - The IP address.
 * @param {number} port - The port.
 * @param {number} timeout - Timeout in milliseconds.
 * @returns {Promise<{socket: net.Socket|null, retry: boolean}>} The connected socket, or null
 *   and whether the port must be tried again (e.g. too many open files).
 */
function openSocket(host, port, timeout) {
  return new Promise(resolve => {
    const socket = net.connect({ host, port });
    const fail = error => {
      socket.destroy();
      resolve({ socket: null, retry: RETRYABLE_ERRORS.has(error?.code) });
    };
    socket.setTimeout(timeout, () => fail());
    socket.once('error', fail);
    socket.once('connect', () => {
      socket.setTimeout(0);
      socket.removeListener('error', fail);
      resolve({ socket, retry: false });
    });
  });
}

/**
 * Finds the open TCP ports of a host in the given range.
 * @param {string} host - The IP address.
 * @param {Object} options - Scan options.
 * @param {AbortSignal} options.signal - Stops the scan when aborted.
 * @returns {Promise<number[]>} The open ports.
 */
async function scanOpenPorts(host, { from = DEFAULT_PORT_RANGE.from, to = DEFAULT_PORT_RANGE.to, concurrency = 150, timeout = 400, signal } = {}) {
  const openPorts = [];
  let nextPort = from;

  const worker = async () => {
    while (nextPort <= to && !signal?.aborted) {
      const port = nextPort++;
      let result = await openSocket(host, port, timeout);
      while (result.retry && !signal?.aborted) {
        await new Promise(resolve => setTimeout(resolve, 50));
        result = await openSocket(host, port, timeout);
      }
      if (result.socket) {
        result.socket.destroy();
        openPorts.push(port);
      }
    }
  };

  await Promise.all(Array.from({ length: concurrency }, worker));
  return openPorts.sort((a, b) => a - b);
}

/**
 * Checks if adbd is listening on the given port by sending an adb handshake.
 * @param {string} host - The IP address.
 * @param {number} port - The port.
 * @param {number} timeout - Timeout in milliseconds.
 * @returns {Promise<boolean>}
 */
async function isAdbPort(host, port, timeout = 1500) {
  const { socket } = await openSocket(host, port, timeout);
  if (!socket) return false;

  return new Promise(resolve => {
    const done = result => {
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(timeout, () => done(false));
    socket.once('data', data => done(isAdbResponse(data)));
    socket.once('error', () => done(false));
    socket.once('close', () => done(false));
    socket.write(buildConnectPacket());
  });
}

/**
 * Finds the Wireless debugging port of a device by scanning its ports.
 * @param {string} host - The IP address of the device.
 * @param {Object} options - Search options.
 * @param {number} options.preferredPort - Port checked first (e.g. the last used one), since
 *   it usually stays the same until Wireless debugging is turned off.
 * @param {AbortSignal} options.signal - Stops the search when aborted.
 * @returns {Promise<number|null>} The adb port or null if not found.
 */
async function findAdbPort(host, { preferredPort, signal } = {}) {
  if (preferredPort && await isAdbPort(host, preferredPort)) return preferredPort;
  if (signal?.aborted) return null;

  const openPorts = await scanOpenPorts(host, { signal });
  if (signal?.aborted) return null;

  const results = await Promise.all(openPorts.map(port => isAdbPort(host, port)));
  const index = results.indexOf(true);
  return index === -1 ? null : openPorts[index];
}

module.exports = { buildConnectPacket, isAdbResponse, scanOpenPorts, isAdbPort, findAdbPort };
