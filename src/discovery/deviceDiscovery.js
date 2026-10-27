const mDnsSd = require('node-dns-sd');
const { Select, Input } = require('enquirer');
const { getDevice } = require('../utils/deviceUtils');
const { t } = require('../i18n');
const {
  pair,
  connectToDevice,
  getAdbMdnsServices,
  getConnectedSerials
} = require('../utils/adbUtils');

const PAIRING_SERVICE = '_adb-tls-pairing._tcp';
const CONNECT_SERVICE = '_adb-tls-connect._tcp';
const MAX_PAIRING_ATTEMPTS = 3;

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Discovers services of the given type using both the adb server and our own mDNS query.
 * @param {string} serviceType - The service type, e.g. '_adb-tls-connect._tcp'.
 * @returns {Promise<Array<Object>>} The discovered devices, without duplicates.
 */
async function findServices(serviceType) {
  const [adbServices, mdnsServices] = await Promise.all([
    getAdbMdnsServices(serviceType),
    mDnsSd.discover({ name: `${serviceType}.local` })
      .then(list => list.map(service => getDevice(service, serviceType)))
      .catch(() => [])
  ]);

  const devices = new Map();
  [...adbServices, ...mdnsServices]
    .filter(device => device.address && device.port)
    .forEach(device => {
      const key = `${device.address}:${device.port}`;
      if (!devices.has(key)) devices.set(key, device);
    });

  return [...devices.values()];
}

/**
 * Searches services repeatedly until the predicate matches or the retries run out.
 * @param {string} serviceType - The service type to search.
 * @param {function(Object):boolean} predicate - Filter for the wanted device.
 * @param {Object} options - Configuration options for discovery.
 * @param {number} options.maxRetries - Maximum number of retries for discovery.
 * @param {number} options.retryDelay - Delay between retries in milliseconds.
 * @returns {Promise<Array<Object>>} The matching devices (empty if none found).
 */
async function waitForServices(serviceType, predicate, { maxRetries, retryDelay = 1000 }) {
  for (let retryCount = 0; retryCount < maxRetries; retryCount++) {
    if (retryCount > 0) await wait(retryDelay);

    const devices = (await findServices(serviceType)).filter(predicate);
    if (devices.length > 0) return devices;
  }
  return [];
}

/**
 * Lists discovered devices and prompts user to select one.
 * @param {Array<Object>} devices - Array of discovered devices.
 * @param {boolean} isPairing - Indicates if the action is pairing or connecting.
 * @returns {Promise<Object>} A promise that resolves to the selected device.
 */
async function selectDevice(devices, isPairing) {
  if (devices.length === 1) {
    return devices[0];
  }

  const choices = devices.map(device => ({
    name: `${device.address}:${device.port}`,
    hint: device.deviceName ? `(${device.deviceName})` : '',
    value: device
  }));

  const prompt = new Select({
    name: 'device',
    message: isPairing ? t('selectPair') : t('selectConnect'),
    choices: choices,
    result(value) {
      const selected = this.choices.find(choice => choice.name === value);
      return selected ? selected.value : value;
    }
  });

  return await prompt.run();
}

/**
 * Discovers devices for pairing or connecting and lets the user choose one.
 * @param {boolean} isPairing - Indicates if the action is pairing or connecting.
 * @returns {Promise<Object|null>} A promise that resolves to the selected device or null if none found.
 */
async function discoverDevices(isPairing) {
  console.log(t('searching'));

  const serviceType = isPairing ? PAIRING_SERVICE : CONNECT_SERVICE;
  const devices = await waitForServices(serviceType, () => true, { maxRetries: 5 });

  if (devices.length === 0) {
    console.log(isPairing ? t('noPairingDevices') : t('noConnectDevices'));
    return null;
  }

  return selectDevice(devices, isPairing);
}

/**
 * Pairs a device asking the user for the pairing code.
 * @param {Object} device - The device to pair with.
 * @returns {Promise<void>}
 */
async function pairDevice(device) {
  console.log(t('pairing', { device: `${device.address}:${device.port}` }));

  for (let attempt = 1; ; attempt++) {
    const code = await new Input({
      name: 'code',
      message: t('enterCode'),
      validate: value => /^\d{6}$/.test(value.trim()) || t('invalidCode')
    }).run();

    try {
      await pair(device, code.trim());
      console.log(t('pairingSuccess'));
      return;
    } catch (error) {
      console.error(t('pairingFailed', { reason: error.message }));
      if (attempt >= MAX_PAIRING_ATTEMPTS) throw error;
    }
  }
}

/**
 * Shows the QR code flow: waits for the device that scanned the QR code and pairs it.
 * @param {string} name - The device name for pairing.
 * @param {string} password - The pairing password.
 * @param {Object} options - Configuration options for discovery.
 * @param {number} options.maxRetries - Maximum number of retries for discovery.
 * @param {number} options.retryDelay - Delay between retries in milliseconds.
 * @param {boolean} options.autoConnect - Automatically connect the device if true.
 * @returns {Promise<Object|null>} A promise that resolves to the paired device or null if none found.
 */
async function startDiscoverQr(name, password, { maxRetries = 60, retryDelay = 1000, autoConnect = false } = {}) {
  console.log(t('scanQr'));
  console.log(t('waitingDevice'));

  const [device] = await waitForServices(
    PAIRING_SERVICE,
    service => service.deviceName === name,
    { maxRetries, retryDelay }
  );

  if (!device) {
    console.log(t('qrTimeout'));
    return null;
  }

  console.log(t('pairing', { device: `${device.address}:${device.port}` }));
  await pair(device, password);
  console.log(t('pairingSuccess'));

  if (autoConnect) await connectToPairedDevice(device);
  return device;
}

/**
 * Discovers a device with a pairing code, pairs it and connects to it.
 * @returns {Promise<void>}
 */
async function startPairAndConnect() {
  const device = await discoverDevices(true);
  if (device) {
    await pairDevice(device);
    await connectToPairedDevice(device);
  }
}

/**
 * Connects to a device that was just paired.
 * @param {Object} pairedDevice - The paired device.
 * @param {Object} options - Configuration options for discovery.
 * @param {number} options.maxRetries - Maximum number of retries for discovery.
 * @param {number} options.retryDelay - Delay between retries in milliseconds.
 * @returns {Promise<void>}
 */
async function connectToPairedDevice(pairedDevice, { maxRetries = 15, retryDelay = 1000 } = {}) {
  console.log(t('searchingConnect', { address: pairedDevice.address }));

  const [deviceToConnect] = await waitForServices(
    CONNECT_SERVICE,
    service => service.address === pairedDevice.address,
    { maxRetries, retryDelay }
  );

  if (!deviceToConnect) {
    console.error(t('connectNotFound'));
    return;
  }

  // Recent adb versions connect paired devices automatically via mDNS.
  const serials = await getConnectedSerials();
  const alreadyConnected = serials.some(serial =>
    serial === `${deviceToConnect.address}:${deviceToConnect.port}` ||
    (deviceToConnect.deviceName && serial.startsWith(`${deviceToConnect.deviceName}.`))
  );

  if (alreadyConnected) {
    console.log(t('connected', { device: `${deviceToConnect.address}:${deviceToConnect.port}` }));
    return;
  }

  console.log(t('connecting', { device: `${deviceToConnect.address}:${deviceToConnect.port}` }));
  await connectToDevice(deviceToConnect);
}

module.exports = {
  discoverDevices,
  pairDevice,
  startDiscoverQr,
  startPairAndConnect,
  connectToPairedDevice
};
