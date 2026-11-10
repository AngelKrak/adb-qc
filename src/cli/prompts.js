const { Select, Input } = require('enquirer');
const { parsePort, parseHostPort } = require('../utils/deviceUtils');
const { t } = require('../i18n');

/**
 * Runs a Select prompt whose answer is the `value` of the chosen option.
 * @template T
 * @param {string} message - The question.
 * @param {Array<{label: string, hint?: string, value: T}>} options - The options, in order.
 * @returns {Promise<T>}
 */
async function select(message, options) {
  // Enquirer prints the chosen name after answering, so the label doubles as the identifier.
  const choices = options.map(option => ({ name: option.label, hint: option.hint }));
  const label = await new Select({ name: 'choice', message, choices }).run();
  return options.find(option => option.label === label).value;
}

/**
 * Asks which action to run.
 * @returns {Promise<string>} An action key, e.g. `qr_connect`.
 */
function chooseAction() {
  return select(t('menuTitle'), [
    { label: t('menuQr'), value: 'qr' },
    { label: t('menuQrConnect'), value: 'qr_connect' },
    { label: t('menuPair'), value: 'pair' },
    { label: t('menuPairConnect'), value: 'pair_connect' },
    { label: t('menuConnect'), value: 'connect' }
  ]);
}

/**
 * Asks which phone to pair when more than one shows a pairing code.
 * @param {Array<import('../types').Device>} devices - Phones announcing the pairing service.
 * @returns {Promise<import('../types').Device>}
 */
async function choosePairingDevice(devices) {
  if (devices.length === 1) return devices[0];

  return select(t('selectPair'), devices.map(device => ({
    label: `${device.address}:${device.port}`,
    hint: device.deviceName || '',
    value: device
  })));
}

/**
 * Asks which phone to connect to.
 * @param {ReturnType<typeof import('../discovery/connectChoices').buildConnectChoices>} choices
 * @returns {Promise<(typeof choices)[number]>} The chosen option.
 */
function chooseConnectOption(choices) {
  return select(t('selectConnect'), choices.map(choice => ({ label: choice.label, hint: choice.hint, value: choice })));
}

/**
 * Asks for the 6-digit pairing code shown on the phone.
 * @returns {Promise<string>}
 */
async function askPairingCode() {
  const code = await new Input({
    name: 'code',
    message: t('enterCode'),
    validate: value => /^\d{6}$/.test(value.trim()) || t('invalidCode')
  }).run();
  return code.trim();
}

/**
 * Asks for "IP" or "IP:PORT".
 * @param {string|null} initial - Default value, e.g. the last used address.
 * @returns {Promise<{address: string, port: number|null}>}
 */
async function askAddress(initial) {
  const value = await new Input({
    name: 'address',
    message: t('enterAddress'),
    initial: initial || '',
    validate: input => parseHostPort(input) !== null || t('invalidAddress')
  }).run();
  return parseHostPort(value);
}

/**
 * Asks for the connect port shown in the phone's Wireless debugging screen.
 * @param {string} address - IP address of the phone, shown in the question.
 * @returns {Promise<number>}
 */
async function askPort(address) {
  const value = await new Input({
    name: 'port',
    message: t('enterPort', { address }),
    validate: input => parsePort(input) !== null || t('invalidPort')
  }).run();
  return parsePort(value);
}

module.exports = {
  chooseAction,
  choosePairingDevice,
  chooseConnectOption,
  askPairingCode,
  askAddress,
  askPort
};
