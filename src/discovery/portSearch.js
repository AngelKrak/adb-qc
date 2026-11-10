const { findAdbPort } = require('../utils/portScanner');
const { getSavedDevices } = require('../utils/configStore');

/**
 * Finds the Wireless debugging port of a phone by checking the ports of its IP address.
 *
 * Needed because some phones (e.g. OnePlus 13) never announce their connect port over mDNS.
 * The port saved from a previous connection is checked first, since it stays the same until
 * Wireless debugging is turned off.
 * @param {string} address - IP address of the phone.
 * @param {AbortSignal} [signal] - Stops the search when aborted.
 * @returns {Promise<import('../types').Device|null>} The phone with its port, or `null` if not found.
 */
async function findDeviceByPorts(address, signal) {
  const saved = getSavedDevices().find(device => device.address === address);
  const port = await findAdbPort(address, { preferredPort: saved?.port, signal });
  return port ? { address, port } : null;
}

module.exports = { findDeviceByPorts };
