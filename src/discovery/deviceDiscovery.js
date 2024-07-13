const mDnsSd = require('node-dns-sd');
const { select } = require('@inquirer/prompts');
const { getDevice } = require('../utils/deviceUtils');
const { pairDeviceFromQR } = require('../utils/adbUtils');

/**
 * Lists discovered devices and prompts user to select one.
 * @param {Array<Object>} devices - Array of discovered devices.
 * @param {boolean} isPairing - Indicates if the action is pairing or connecting.
 * @returns {Promise<Object>} A promise that resolves to the selected device.
 */
async function selectDevice(devices, isPairing) {
  const choices = devices.map((device, index) => ({
    name: `${device.address}:${device.port}`,
    value: device
  }));

  const promptMessage = isPairing
    ? 'Select device to pair:'
    : 'Select device to connect:';

  const selectedDevice = await select({
    message: promptMessage,
    choices: choices,
  });

  return selectedDevice;
}

/**
 * Starts discovering devices using mDnsSd based on whether the action is pairing or connecting.
 * @param {boolean} isPairing - Indicates if the action is pairing or connecting.
 * @returns {Promise<Object>} A promise that resolves to the selected device.
 */
async function discoverDevices(isPairing) {
  const serviceName = isPairing
    ? '_adb-tls-pairing._tcp.local'
    : '_adb-tls-connect._tcp.local';

  try {
    const deviceList = await mDnsSd.discover({ name: serviceName });
    if (deviceList.length === 0) {
      console.log('No devices found.');
      return null;
    }
    return await selectDevice(deviceList.map(getDevice), isPairing);
  } catch (error) {
    console.error('Error discovering devices:', error);
    throw error;
  }
}

/**
 * Starts discovering devices for pairing with QR code.
 * @param {string} name - The device name for pairing.
 * @param {string} password - The pairing password.
 * @returns {Promise<void>}
 */
/**
 * Starts discovering devices for pairing with QR code.
 * @param {string} name - The device name for pairing.
 * @param {string} password - The pairing password.
 * @param {number} maxRetries - Maximum number of retries for discovery.
 * @param {number} retryDelay - Delay between retries in milliseconds.
 * @returns {Promise<void>}
 */
async function startDiscoverQr(name, password, maxRetries = 30, retryDelay = 1000) {
  try {
    let retryCount = 0;
    let deviceList = [];

    while (retryCount < maxRetries) {
      deviceList = await mDnsSd.discover({
        name: '_adb-tls-pairing._tcp.local'
      });

      if (deviceList.length > 0) {
        const device = deviceList.map(getDevice).find(device => device.deviceName === name);

        if (device) {
          console.log(`Pairing your device: ${device.address}:${device.port}`);
          await pairDeviceFromQR(device, password);
          return;
        } else {
          console.log(`Device '${name}' not found in this discovery cycle.`);
        }
      }

      retryCount++;
      await new Promise(resolve => setTimeout(resolve, retryDelay)); // Wait before next retry
    }

    console.log(`Failed to discover device '${name}' after ${maxRetries} retries.`);
  } catch (error) {
    console.error('Error discovering devices for QR pairing:', error);
  }
}

module.exports = { discoverDevices, startDiscoverQr };