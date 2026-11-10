const mDnsSd = require('node-dns-sd');
const { getDevice } = require('../utils/deviceUtils');
const { getAdbMdnsServices } = require('../utils/adbUtils');
const { wait } = require('../utils/async');

/** mDNS service announced while a phone shows a pairing code or scans a QR code. */
const PAIRING_SERVICE = '_adb-tls-pairing._tcp';

/** mDNS service announced by a phone with Wireless debugging on, for `adb connect`. */
const CONNECT_SERVICE = '_adb-tls-connect._tcp';

/**
 * Finds the announced services of a type, through the adb server and our own mDNS query.
 * @param {string} serviceType - {@link PAIRING_SERVICE} or {@link CONNECT_SERVICE}.
 * @param {function(import('../types').Device): boolean} isWanted - Filter for the wanted devices.
 * @returns {Promise<Array<import('../types').Device>>} The wanted devices, without duplicates.
 */
async function findServices(serviceType, isWanted) {
  const isUsable = device => Boolean(device.address && device.port) && isWanted(device);

  // Our own query always listens for ~3 seconds while adb answers right away, so adb's results
  // are used as soon as they include the wanted device.
  const mdnsSearch = mDnsSd.discover({ name: `${serviceType}.local` })
    .then(list => list.map(service => getDevice(service, serviceType)))
    .catch(() => []);
  const adbServices = (await getAdbMdnsServices(serviceType)).filter(isUsable);
  const mdnsServices = adbServices.length > 0 ? [] : (await mdnsSearch).filter(isUsable);

  const devices = new Map();
  [...adbServices, ...mdnsServices].forEach(device => {
    const key = `${device.address}:${device.port}`;
    if (!devices.has(key)) devices.set(key, device);
  });
  return [...devices.values()];
}

/**
 * Searches announced services repeatedly until a wanted device shows up or the retries run out.
 * @param {string} serviceType - {@link PAIRING_SERVICE} or {@link CONNECT_SERVICE}.
 * @param {Object} [options]
 * @param {function(import('../types').Device): boolean} [options.isWanted] - Filter for the wanted devices.
 * @param {number} [options.maxRetries] - Number of searches; each one takes up to ~4 seconds.
 * @param {number} [options.retryDelay] - Pause between searches in milliseconds.
 * @param {AbortSignal} [options.signal] - Stops the search when aborted.
 * @returns {Promise<Array<import('../types').Device>>} The wanted devices, or an empty list.
 */
async function waitForServices(serviceType, { isWanted = () => true, maxRetries = 5, retryDelay = 1000, signal } = {}) {
  for (let retry = 0; retry < maxRetries && !signal?.aborted; retry++) {
    if (retry > 0) await wait(retryDelay);

    const devices = await findServices(serviceType, isWanted);
    if (devices.length > 0) return devices;
  }
  return [];
}

module.exports = { PAIRING_SERVICE, CONNECT_SERVICE, waitForServices };
