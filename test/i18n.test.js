const { test } = require('node:test');
const assert = require('node:assert/strict');
const { t, detectLanguage, messages } = require('../src/i18n');

test('detectLanguage prefers ADB_QC_LANG, then the locale variables', () => {
  assert.equal(detectLanguage({ ADB_QC_LANG: 'en', LANG: 'es_MX.UTF-8' }), 'en');
  assert.equal(detectLanguage({ LANG: 'es_MX.UTF-8' }), 'es');
  assert.equal(detectLanguage({ LC_ALL: 'en_US.UTF-8', LANG: 'es_ES.UTF-8' }), 'en');
  assert.equal(detectLanguage({ ADB_QC_LANG: 'fr' }), 'en');
});

test('every language has the same messages', () => {
  const englishKeys = Object.keys(messages.en).sort();
  Object.keys(messages).forEach(language => {
    assert.deepEqual(Object.keys(messages[language]).sort(), englishKeys, `Missing keys in "${language}"`);
  });
});

test('t replaces the parameters of the message', () => {
  assert.match(t('connected', { device: '192.168.1.10:5555' }), /192\.168\.1\.10:5555$/);
  assert.equal(t('missing-key'), 'missing-key');
});
