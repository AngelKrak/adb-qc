const mDnsSd = require('node-dns-sd');
const { Select } = require('enquirer');
const { getDevice } = require('../utils/deviceUtils');
const { pairDeviceFromQR, pairDevice, connectToDevice } = require('../utils/adbUtils');

let pairedDevice = null;

/**
 * Lists discovered devices and prompts user to select one.
 * @param {Array<Object>} devices - Array of discovered devices.
 * @param {boolean} isPairing - Indicates if the action is pairing or connecting.
 * @param {boolean} autoSelect - Automatically select the device if true.
 * @returns {Promise<Object>} A promise that resolves to the selected device.
 */
async function selectDevice(devices, isPairing, autoSelect = false) {
  if (autoSelect && devices.length > 0) {
    // Automatically select the first device if autoSelect is true
    return devices[0];
  }

  const choices = devices.map((device, index) => ({
    name: `${device.address}:${device.port}`,
    value: device
  }));

  const promptMessage = isPairing
    ? 'Select device to pair:'
    : 'Select device to connect:';

  const prompt = new Select({
    name: 'device',
    message: promptMessage,
    choices: choices,
    result(value) {
      const selected = this.choices.find(choice => choice.name === value);
      return selected ? selected.value : value;
    }
  });

  return await prompt.run();
}

/**
 * Starts discovering devices using mDnsSd based on whether the action is pairing or connecting.
 * @param {boolean} isPairing - Indicates if the action is pairing or connecting.
 * @param {boolean} autoSelect - Automatically select the device if true.
 * @returns {Promise<Object|null>} A promise that resolves to the selected device or null if none selected.
 */
async function discoverDevices(isPairing, autoSelect = false) {
  const serviceName = isPairing
    ? '_adb-tls-pairing._tcp.local'
    : '_adb-tls-connect._tcp.local';

  try {
    const deviceList = await mDnsSd.discover({ name: serviceName });
    if (deviceList.length === 0) {
      console.log('No devices found.');
      return null;
    }

    if (autoSelect && pairedDevice) {
      // Automatically select the previously paired device if available
      const device = deviceList.map(getDevice).find(device => device.address === pairedDevice.address && device.port !== pairedDevice.port);
      if (device) {
        return device;
      }
    }

    const device = await selectDevice(deviceList.map(getDevice), isPairing, autoSelect);
    return device;
  } catch (error) {
    console.error('Error discovering devices:', error);
    throw error;
  }
}

/**
 * Starts discovering devices for pairing with QR code.
 * @param {string} name - The device name for pairing.
 * @param {string} password - The pairing password.
 * @param {Object} options - Configuration options for discovery.
 * @param {number} options.maxRetries - Maximum number of retries for discovery.
 * @param {number} options.retryDelay - Delay between retries in milliseconds.
 * @param {boolean} options.autoConnect - Automatically connect the device if true.
 * @returns {Promise<Object|null>} A promise that resolves to the paired device or null if none found.
 */
async function startDiscoverQr(name, password, { maxRetries = 30, retryDelay = 1000, autoConnect = false } = {}) {
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
          pairedDevice = device;
          if (autoConnect) await connectToPreviouslyPairedDevice();
          return device;
        } else {
          console.log(`Device '${name}' not found in this discovery cycle.`);
        }
      }

      retryCount++;
      await new Promise(resolve => setTimeout(resolve, retryDelay)); // Wait before next retry
    }

    console.log(`Failed to discover device '${name}' after ${maxRetries} retries.`);
    return null;
  } catch (error) {
    console.error('Error discovering devices for QR pairing:', error);
    throw error;
  }
}

/**
 * Starts discovering devices for pairing and connecting using a pairing code.
 * @returns {Promise<void>}
 */
async function startPairAndConnect() {
  try {
    const device = await discoverDevices(true);
    if (device) {
      console.log(`Pairing your device: ${device.address}:${device.port}`);
      await pairDevice(device);

      pairedDevice = device;
      await connectToPreviouslyPairedDevice();
    }
  } catch (error) {
    console.error('Error pairing and connecting:', error);
    throw error;
  }
}

/**
 * Connects to a previously paired device.
 * @returns {Promise<void>}
 */
async function connectToPreviouslyPairedDevice() {
  if (pairedDevice) {
    console.log(`Searching for device to connect to using address: ${pairedDevice.address}`);

    try {
      const deviceToConnect = await discoverDevices(false, true);

      if (deviceToConnect) {
        console.log(`Connecting to device: ${deviceToConnect.address}:${deviceToConnect.port}`);
        await connectToDevice(deviceToConnect);
      } else {
        console.error('Device not found for connection.');
      }
    } catch (error) {
      console.error('Error connecting to previously paired device:', error);
      throw error;
    }
  } else {
    console.error('No paired device found.');
  }
}

module.exports = { discoverDevices, startDiscoverQr, startPairAndConnect, connectToPreviouslyPairedDevice };