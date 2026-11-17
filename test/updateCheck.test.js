const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isNewerVersion, isCheckDue, isUpdateCheckDisabled } = require('../src/update/updateCheck');

const DAY_MS = 24 * 60 * 60 * 1000;

test('isNewerVersion compares major, minor and patch as numbers', () => {
  assert.equal(isNewerVersion('1.4.0', '1.3.0'), true);
  assert.equal(isNewerVersion('1.10.0', '1.9.3'), true);
  assert.equal(isNewerVersion('2.0.0', '1.99.99'), true);
  assert.equal(isNewerVersion('1.3.0', '1.3.0'), false);
  assert.equal(isNewerVersion('1.2.9', '1.3.0'), false);
});

test('isNewerVersion ignores pre-releases and invalid versions', () => {
  assert.equal(isNewerVersion('1.4.0-beta.1', '1.3.0'), false);
  assert.equal(isNewerVersion(undefined, '1.3.0'), false);
  assert.equal(isNewerVersion('1.4.0', 'dev'), false);
});

test('isCheckDue asks the registry at most once a day', () => {
  const now = 10 * DAY_MS;
  assert.equal(isCheckDue(null, now), true);
  assert.equal(isCheckDue({ checkedAt: now - DAY_MS / 2, latest: '1.3.0' }, now), false);
  assert.equal(isCheckDue({ checkedAt: now - DAY_MS, latest: '1.3.0' }, now), true);
  assert.equal(isCheckDue({ checkedAt: now + DAY_MS, latest: '1.3.0' }, now), true, 'clock moved back');
});

test('the update check is off in CI, without a terminal or when the user turns it off', () => {
  assert.equal(isUpdateCheckDisabled({}, true), false);
  assert.equal(isUpdateCheckDisabled({}, false), true);
  assert.equal(isUpdateCheckDisabled({ CI: 'true' }, true), true);
  assert.equal(isUpdateCheckDisabled({ ADB_QC_NO_UPDATE_CHECK: '1' }, true), true);
  assert.equal(isUpdateCheckDisabled({ NO_UPDATE_NOTIFIER: '1' }, true), true);
});
