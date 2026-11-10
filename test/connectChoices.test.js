const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildConnectChoices } = require('../src/discovery/connectChoices');

const labels = { lastUsed: 'last used', findPort: 'find port', manualEntry: 'Enter IP' };

test('lists discovered devices with their model, then the manual entry', () => {
  const choices = buildConnectChoices({
    discovered: [{ address: '192.168.1.18', port: 43357, deviceName: 'adb-2ca9d6b1-eW36ry' }],
    saved: [],
    lastAddress: null,
    models: { 'adb-2ca9d6b1-eW36ry': 'OPD2415' },
    labels
  });

  assert.deepEqual(choices.map(choice => [choice.label, choice.hint, choice.kind]), [
    ['192.168.1.18:43357', 'OPD2415 · adb-2ca9d6b1-eW36ry', 'device'],
    ['Enter IP', '', 'manual']
  ]);
});

test('adds every saved device that is not announced, with a port scan if its port does not answer', () => {
  const choices = buildConnectChoices({
    discovered: [{ address: '192.168.1.18', port: 43357, deviceName: 'adb-2ca9d6b1-eW36ry' }],
    saved: [
      { address: '192.168.1.18', port: 43357, reachable: true },
      { address: '192.168.1.19', port: 32839, reachable: false }
    ],
    lastAddress: '192.168.1.18',
    models: { 'adb-2ca9d6b1-eW36ry': 'OPD2415', '192.168.1.19': 'CPH2653' },
    labels
  });

  assert.deepEqual(choices.map(choice => [choice.label, choice.hint, choice.kind]), [
    ['192.168.1.18:43357', 'OPD2415 · adb-2ca9d6b1-eW36ry · last used', 'device'],
    ['192.168.1.19', 'CPH2653 · find port', 'scan'],
    ['Enter IP', '', 'manual']
  ]);
  assert.deepEqual(choices[1].device, { address: '192.168.1.19', port: null });
});

test('connects a saved device right away when its saved port answers', () => {
  const [choice] = buildConnectChoices({
    discovered: [],
    saved: [{ address: '192.168.1.19', port: 32839, reachable: true }],
    lastAddress: '192.168.1.19',
    models: {},
    labels
  });

  assert.equal(choice.kind, 'device');
  assert.deepEqual(choice.device, { address: '192.168.1.19', port: 32839 });
  assert.equal(choice.hint, 'last used');
});

test('only the manual entry when nothing is found or saved', () => {
  const choices = buildConnectChoices({ discovered: [], saved: [], lastAddress: null, models: {}, labels });
  assert.deepEqual(choices.map(choice => choice.kind), ['manual']);
});
