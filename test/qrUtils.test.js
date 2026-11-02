const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomId, buildQrText } = require('../src/utils/qrUtils');

test('randomId returns unique URL-safe ids', () => {
  const first = randomId();
  const second = randomId();

  assert.match(first, /^[A-Za-z0-9_-]{22}$/);
  assert.notEqual(first, second);
});

test('buildQrText uses the adb wireless pairing format', () => {
  assert.equal(buildQrText('ADB_WIFI_abc', 'secret'), 'WIFI:T:ADB;S:ADB_WIFI_abc;P:secret;;');
});
