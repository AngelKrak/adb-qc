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
  writeConfig({ ...readConfig(), lastAddress: address, lastPort: port });
}

module.exports = { getLastDevice, saveLastDevice };
