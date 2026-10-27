const { execFile } = require('child_process');
const { t } = require('../i18n');

/**
 * Minimum adb version with support for wireless pairing (adb pair).
 */
const MIN_ADB_MAJOR_VERSION = 30;

/**
 * Runs an adb command without a shell.
 * @param {string[]} args - The command arguments for adb.
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
function runAdb(args) {
  return new Promise((resolve, reject) => {
    execFile('adb', args, (error, stdout, stderr) => {
      if (error) {
        const message = error.code === 'ENOENT'
          ? t('adbNotFound')
          : (stderr || stdout || error.message).trim();
        reject(new Error(message));
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

/**
 * Extracts the major version from the output of `adb version`.
 * @param {string} output - The output of `adb version`.
 * @returns {number|null} The major version or null if it can't be found.
 */
function parseAdbVersion(output) {
  const match = /^Version (\d+)\./m.exec(output || '');
  return match ? Number(match[1]) : null;
}

/**
 * Verifies that adb is installed and supports wireless pairing.
 * @returns {Promise<void>}
 */
async function checkAdb() {
  const { stdout } = await runAdb(['version']);
  const major = parseAdbVersion(stdout);

  if (major !== null && major < MIN_ADB_MAJOR_VERSION) {
    throw new Error(t('adbTooOld', { major, min: MIN_ADB_MAJOR_VERSION }));
  }
}

/**
 * Checks if an adb error comes from a server too old to support pairing
 * (e.g. the adb bundled with Genymotion or another outdated SDK).
 * @param {string} message - The error output from adb.
 * @returns {boolean}
 */
function isOutdatedServerError(message) {
  return /unknown host service/i.test(message || '');
}

/**
 * Restarts the adb server so it is launched by the adb found in PATH.
 * @returns {Promise<void>}
 */
async function restartAdbServer() {
  console.warn(t('outdatedServer'));
  await runAdb(['kill-server']).catch(() => {});
  await runAdb(['start-server']);
}

/**
 * Pairs a device using adb pair with the given pairing code.
 * If the adb server is too old to support pairing, it is restarted once.
 * @param {Object} device - The device to pair with.
 * @param {string} code - The pairing code or QR password.
 * @param {boolean} serverRestarted - Indicates if the adb server was already restarted.
 * @returns {Promise<void>}
 */
async function pair(device, code, serverRestarted = false) {
  try {
    const { stdout } = await runAdb(['pair', `${device.address}:${device.port}`, code]);
    if (!/successfully paired/i.test(stdout)) {
      throw new Error(stdout.trim() || t('unknownPairingError'));
    }
  } catch (error) {
    if (!serverRestarted && isOutdatedServerError(error.message)) {
      await restartAdbServer();
      return pair(device, code, true);
    }
    throw error;
  }
}

/**
 * Connects to a device using adb connect command.
 * @param {Object} device - The device to connect to.
 * @returns {Promise<void>}
 */
async function connectToDevice(device) {
  const { stdout } = await runAdb(['connect', `${device.address}:${device.port}`]);
  const output = stdout.trim();

  if (!/^(already )?connected to/.test(output)) {
    throw new Error(output || t('unknownConnectionError'));
  }
  console.log(t('connected', { device: `${device.address}:${device.port}` }));
}

/**
 * Parses the output of `adb mdns services`.
 * @param {string} output - The output of `adb mdns services`.
 * @returns {Array<{deviceName: string, serviceType: string, address: string, port: number}>}
 */
function parseMdnsServices(output) {
  return (output || '')
    .split('\n')
    .map(line => /^(.+?)\s+(_adb[\w-]*\._tcp)\.?\s+([\d.]+):(\d+)\s*$/.exec(line.trim()))
    .filter(Boolean)
    .map(([, deviceName, serviceType, address, port]) => ({
      deviceName,
      serviceType,
      address,
      port: Number(port)
    }));
}

/**
 * Lists the services of the given type discovered by the adb server itself.
 * @param {string} serviceType - The service type, e.g. '_adb-tls-connect._tcp'.
 * @returns {Promise<Array<{deviceName: string, serviceType: string, address: string, port: number}>>}
 */
async function getAdbMdnsServices(serviceType) {
  try {
    const { stdout } = await runAdb(['mdns', 'services']);
    return parseMdnsServices(stdout).filter(service => service.serviceType === serviceType);
  } catch (error) {
    return [];
  }
}

/**
 * Parses the output of `adb devices` and returns the serials of the online devices.
 * @param {string} output - The output of `adb devices`.
 * @returns {string[]}
 */
function parseConnectedSerials(output) {
  return (output || '')
    .split('\n')
    .slice(1)
    .map(line => line.trim().split(/\s+/))
    .filter(parts => parts[1] === 'device')
    .map(parts => parts[0]);
}

/**
 * Returns the serials of the devices currently connected to adb.
 * @returns {Promise<string[]>}
 */
async function getConnectedSerials() {
  try {
    const { stdout } = await runAdb(['devices']);
    return parseConnectedSerials(stdout);
  } catch (error) {
    return [];
  }
}

module.exports = {
  runAdb,
  checkAdb,
  parseAdbVersion,
  isOutdatedServerError,
  pair,
  connectToDevice,
  parseMdnsServices,
  getAdbMdnsServices,
  parseConnectedSerials,
  getConnectedSerials
};
