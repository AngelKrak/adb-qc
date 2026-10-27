const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  parseAdbVersion,
  isOutdatedServerError,
  parseMdnsServices,
  parseConnectedSerials
} = require('../src/utils/adbUtils');

test('parseAdbVersion reads the major version', () => {
  const output = 'Android Debug Bridge version 1.0.41\nVersion 37.0.1-15733141\nInstalled as /usr/local/bin/adb\n';
  assert.equal(parseAdbVersion(output), 37);
  assert.equal(parseAdbVersion('Android Debug Bridge version 1.0.41\nVersion 29.0.2-107\n'), 29);
  assert.equal(parseAdbVersion(''), null);
});

test('isOutdatedServerError detects servers without pairing support', () => {
  assert.equal(isOutdatedServerError('error: unknown host service'), true);
  assert.equal(isOutdatedServerError('Failed: Unable to start pairing client.'), false);
  assert.equal(isOutdatedServerError(undefined), false);
});

test('parseMdnsServices parses pairing and connect services', () => {
  const output = [
    'List of discovered mdns services',
    'adb-unidentified\t_adb._tcp\t10.0.3.15:5555',
    'adb-2ca9d6b1-eW36ry\t_adb-tls-connect._tcp\t192.168.1.10:39971',
    'ADB_WIFI_abc-123_x\t_adb-tls-pairing._tcp.\t192.168.1.10:33467',
    ''
  ].join('\n');

  assert.deepEqual(parseMdnsServices(output), [
    { deviceName: 'adb-unidentified', serviceType: '_adb._tcp', address: '10.0.3.15', port: 5555 },
    { deviceName: 'adb-2ca9d6b1-eW36ry', serviceType: '_adb-tls-connect._tcp', address: '192.168.1.10', port: 39971 },
    { deviceName: 'ADB_WIFI_abc-123_x', serviceType: '_adb-tls-pairing._tcp', address: '192.168.1.10', port: 33467 }
  ]);
  assert.deepEqual(parseMdnsServices(''), []);
});

test('parseConnectedSerials returns only online devices', () => {
  const output = [
    'List of devices attached',
    '127.0.0.1:6555         device product:vbox86p model:Pixel_C',
    'adb-2ca9d6b1-eW36ry._adb-tls-connect._tcp device product:OPD2415',
    '192.168.1.20:5555      offline',
    '192.168.1.21:5555      unauthorized',
    ''
  ].join('\n');

  assert.deepEqual(parseConnectedSerials(output), [
    '127.0.0.1:6555',
    'adb-2ca9d6b1-eW36ry._adb-tls-connect._tcp'
  ]);
});
