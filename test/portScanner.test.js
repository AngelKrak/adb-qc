const { test } = require('node:test');
const assert = require('node:assert/strict');
const net = require('net');
const { buildConnectPacket, isAdbResponse, scanOpenPorts, isAdbPort, findAdbPort } = require('../src/utils/portScanner');

const A_STLS = 0x534c5453;

/**
 * Starts a local TCP server on a random port.
 * @param {function(net.Socket):void} onConnection - Connection handler.
 * @returns {Promise<{server: net.Server, port: number}>}
 */
function startServer(onConnection) {
  return new Promise(resolve => {
    const server = net.createServer(onConnection).listen(0, '127.0.0.1', () => {
      resolve({ server, port: server.address().port });
    });
  });
}

test('buildConnectPacket builds a valid adb CNXN message', () => {
  const packet = buildConnectPacket();

  assert.equal(packet.toString('ascii', 0, 4), 'CNXN');
  assert.equal(packet.readUInt32LE(12), packet.length - 24);
  assert.equal(packet.readUInt32LE(20), (packet.readUInt32LE(0) ^ 0xffffffff) >>> 0);
  assert.equal(packet.toString('ascii', 24), 'host::\0');
});

test('isAdbResponse recognizes STLS, CNXN and AUTH replies', () => {
  assert.equal(isAdbResponse(Buffer.from('STLS0000')), true);
  assert.equal(isAdbResponse(Buffer.from('CNXN0000')), true);
  assert.equal(isAdbResponse(Buffer.from('AUTH0000')), true);
  assert.equal(isAdbResponse(Buffer.from('HTTP/1.1 400')), false);
  assert.equal(isAdbResponse(Buffer.alloc(2)), false);
});

test('isAdbPort tells adbd apart from other services', async () => {
  const adb = await startServer(socket => socket.once('data', () => {
    const reply = Buffer.alloc(24);
    reply.writeUInt32LE(A_STLS, 0);
    socket.end(reply);
  }));
  const http = await startServer(socket => socket.once('data', () => socket.end('HTTP/1.1 400 Bad Request\r\n\r\n')));
  const silent = await startServer(() => {});

  try {
    assert.equal(await isAdbPort('127.0.0.1', adb.port), true);
    assert.equal(await isAdbPort('127.0.0.1', http.port), false);
    assert.equal(await isAdbPort('127.0.0.1', silent.port, 300), false);
  } finally {
    [adb, http, silent].forEach(({ server }) => {
      server.unref();
      server.close();
    });
  }
});

test('scanOpenPorts finds listening ports in the range', async () => {
  const { server, port } = await startServer(socket => socket.destroy());

  try {
    const openPorts = await scanOpenPorts('127.0.0.1', { from: port - 2, to: port + 2, concurrency: 5 });
    assert.ok(openPorts.includes(port));
  } finally {
    server.close();
  }
});

test('findAdbPort returns the preferred port without scanning when adbd answers on it', async () => {
  const adb = await startServer(socket => socket.once('data', () => {
    const reply = Buffer.alloc(24);
    reply.writeUInt32LE(A_STLS, 0);
    socket.end(reply);
  }));

  try {
    const start = Date.now();
    assert.equal(await findAdbPort('127.0.0.1', { preferredPort: adb.port }), adb.port);
    assert.ok(Date.now() - start < 1000);
  } finally {
    adb.server.close();
  }
});
