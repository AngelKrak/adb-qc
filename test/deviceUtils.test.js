const { test } = require('node:test');
const assert = require('node:assert/strict');
const { getDevice } = require('../src/utils/deviceUtils');

test('getDevice reads name and port from the PTR and SRV answers', () => {
  const service = {
    address: '192.168.1.10',
    packet: {
      answers: [
        { type: 'PTR', name: '_adb-tls-pairing._tcp.local', rdata: 'ADB_WIFI_abc._adb-tls-pairing._tcp.local' },
        { type: 'SRV', name: 'ADB_WIFI_abc._adb-tls-pairing._tcp.local', rdata: { port: 33467 } }
      ]
    }
  };

  assert.deepEqual(getDevice(service, '_adb-tls-pairing._tcp'), {
    address: '192.168.1.10',
    deviceName: 'ADB_WIFI_abc',
    port: 33467
  });
});

test('getDevice falls back to the service port', () => {
  const service = {
    address: '192.168.1.10',
    service: { port: 39971 },
    packet: {
      answers: [
        { type: 'PTR', name: '_adb-tls-connect._tcp.local', rdata: 'adb-2ca9d6b1._adb-tls-connect._tcp.local' }
      ]
    }
  };

  assert.deepEqual(getDevice(service, '_adb-tls-connect._tcp'), {
    address: '192.168.1.10',
    deviceName: 'adb-2ca9d6b1',
    port: 39971
  });
});

test('getDevice ignores answers of other service types', () => {
  const service = {
    address: '192.168.1.10',
    packet: {
      answers: [
        { type: 'PTR', name: '_adb-tls-connect._tcp.local', rdata: 'other._adb-tls-connect._tcp.local' }
      ]
    }
  };

  assert.equal(getDevice(service, '_adb-tls-pairing._tcp').deviceName, null);
});
