const { PAIRING_SERVICE, CONNECT_SERVICE, waitForServices } = require('../discovery/serviceDiscovery');
const { findDeviceByPorts } = require('../discovery/portSearch');
const { connectAndRemember } = require('../connection/connect');
const { choosePairingDevice, askPairingCode, askPort } = require('../cli/prompts');
const { pair } = require('../utils/adbUtils');
const { randomId, showQR } = require('../utils/qrUtils');
const { firstFound } = require('../utils/async');
const { t } = require('../i18n');

const MAX_PAIRING_ATTEMPTS = 3;

/**
 * Finds the connect port of a phone that was just paired and connects to it.
 *
 * The mDNS search and the port search run in parallel because some phones never announce
 * their connect port. If both fail, the user is asked for the port shown on the phone.
 * @param {import('../types').Device} pairedDevice - The paired phone.
 * @returns {Promise<void>}
 */
async function connectAfterPairing(pairedDevice) {
  const { address } = pairedDevice;
  console.log(t('searchingConnect', { address }));

  const controller = new AbortController();
  let device = await firstFound([
    waitForServices(CONNECT_SERVICE, {
      isWanted: service => service.address === address,
      maxRetries: 8,
      signal: controller.signal
    }).then(([found]) => found || null),
    findDeviceByPorts(address, controller.signal)
  ]);
  controller.abort();

  if (!device && process.stdin.isTTY) {
    console.log(t('connectNotFoundAskPort', { address }));
    device = { address, port: await askPort(address) };
  }

  if (device) await connectAndRemember(device);
  else console.error(t('connectNotFound'));
}

/**
 * `--pair` / `--pair_connect`: pairs a phone with the 6-digit code it shows.
 * @param {Object} options
 * @param {boolean} options.connect - Also connect after pairing.
 * @returns {Promise<void>}
 * @throws {Error} After {@link MAX_PAIRING_ATTEMPTS} failed attempts.
 */
async function pairWithCode({ connect }) {
  console.log(t('searching'));
  const devices = await waitForServices(PAIRING_SERVICE);
  if (devices.length === 0) {
    console.log(t('noPairingDevices'));
    return;
  }

  const device = await choosePairingDevice(devices);
  console.log(t('pairing', { device: `${device.address}:${device.port}` }));

  for (let attempt = 1; ; attempt++) {
    try {
      await pair(device, await askPairingCode());
      break;
    } catch (error) {
      console.error(t('pairingFailed', { reason: error.message }));
      if (attempt >= MAX_PAIRING_ATTEMPTS) throw error;
    }
  }
  console.log(t('pairingSuccess'));

  if (connect) await connectAfterPairing(device);
}

/**
 * `--qr` / `--qr_connect`: shows a QR code and pairs the phone that scans it.
 *
 * Scanning it makes the phone announce a pairing service named after the QR code, so only
 * that phone is paired even if others are showing a pairing screen.
 * @param {Object} options
 * @param {boolean} options.connect - Also connect after pairing.
 * @returns {Promise<void>}
 */
async function pairWithQr({ connect }) {
  const name = `ADB_WIFI_${randomId()}`;
  const password = randomId();
  showQR(name, password);
  console.log(t('scanQr'));
  console.log(t('waitingDevice'));

  const [device] = await waitForServices(PAIRING_SERVICE, {
    isWanted: service => service.deviceName === name,
    maxRetries: 60
  });
  if (!device) {
    console.log(t('qrTimeout'));
    return;
  }

  console.log(t('pairing', { device: `${device.address}:${device.port}` }));
  await pair(device, password);
  console.log(t('pairingSuccess'));

  if (connect) await connectAfterPairing(device);
}

module.exports = { pairWithCode, pairWithQr };
