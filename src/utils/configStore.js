const fs = require('fs');
const os = require('os');
const path = require('path');

const CONFIG_FILE = path.join(os.homedir(), '.config', 'adb-qc', 'config.json');

/**
 * Reads the saved config. Never throws: returns an empty object on any error.
 * @returns {Object}
 */
function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch (error) {
    return {};
  }
}

/**
 * Saves the config. Never throws: saving it is only a convenience.
 * @param {Object} config - The config to save.
 */
function writeConfig(config) {
  try {
    fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (error) {
    // Ignore: the tool works without a saved config.
  }
}

/**
 * Returns the last connected device.
 * @returns {{address: string, port: number|null}|null}
 */
function getLastDevice() {
  const { lastAddress, lastPort } = readConfig();
  return lastAddress ? { address: lastAddress, port: lastPort || null } : null;
}

/**
 * Saves the last connected device.
 * @param {{address: string, port: number}} device - The device.
 */
function saveLastDevice({ address, port }) {
  const config = readConfig();
  const ports = { ...config.ports, [address]: port };
  writeConfig({ ...config, lastAddress: address, lastPort: port, ports });
}

/**
 * Returns every device connected before, the last one first.
 * @returns {Array<{address: string, port: number|null}>}
 */
function getSavedDevices() {
  const { lastAddress, lastPort, ports = {} } = readConfig();
  const saved = { ...ports };
  if (lastAddress) saved[lastAddress] = lastPort || saved[lastAddress] || null;

  return Object.entries(saved)
    .map(([address, port]) => ({ address, port: port || null }))
    .sort((a, b) => (b.address === lastAddress) - (a.address === lastAddress));
}

/**
 * Returns the known device models, by mDNS name or IP address.
 * @returns {Object<string, string>}
 */
function getDeviceModels() {
  return readConfig().models || {};
}

/**
 * Saves the model of a device under the given keys (mDNS name and/or IP address).
 * @param {string[]} keys - The keys to save the model under.
 * @param {string} model - The device model, e.g. 'CPH2653'.
 */
function saveDeviceModel(keys, model) {
  const config = readConfig();
  const models = { ...config.models };
  keys.filter(Boolean).forEach(key => {
    models[key] = model;
  });
  writeConfig({ ...config, models });
}

module.exports = { getLastDevice, saveLastDevice, getSavedDevices, getDeviceModels, saveDeviceModel };
