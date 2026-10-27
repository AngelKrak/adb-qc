const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseAction } = require('../src/main');

test('parseAction maps short and long flags to actions', () => {
  assert.equal(parseAction(['--qr']), 'qr');
  assert.equal(parseAction(['-q']), 'qr');
  assert.equal(parseAction(['-qc']), 'qr_connect');
  assert.equal(parseAction(['--pair']), 'pair');
  assert.equal(parseAction(['-pc']), 'pair_connect');
  assert.equal(parseAction(['-c']), 'connect');
  assert.equal(parseAction(['-v']), 'version');
  assert.equal(parseAction(['--help']), 'help');
});

test('parseAction returns null without a known flag', () => {
  assert.equal(parseAction([]), null);
  assert.equal(parseAction(['--unknown']), null);
});
