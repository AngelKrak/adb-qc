const { CONNECT_SERVICE, waitForServices } = require('../discovery/serviceDiscovery');
const { findDeviceByPorts } = require('../discovery/portSearch');
const { buildConnectChoices } = require('../discovery/connectChoices');
const { connectAndRemember } = require('../connection/connect');
const { chooseConnectOption, askAddress } = require('../cli/prompts');
const { isAdbPort } = require('../utils/portScanner');
const { getLastDevice, getSavedDevices, getDeviceModels } = require('../utils/configStore');
const { firstFound } = require('../utils/async');
const { t } = require('../i18n');

/**
 * Finds the port of a phone by checking its ports, telling the user while it runs.
 * @param {string} address - IP address of the phone.
 * @returns {Promise<import('../types').Device|null>}
 */
async function searchPorts(address) {
  console.log(t('scanningPorts', { address }));
  const device = await findDeviceByPorts(address);
  if (!device) console.error(t('connectNotFound'));
  return device;
}

/**
 * Asks for "IP" or "IP:PORT" and finds the port when only the IP was typed.
 * @param {string|null} initial - Default value shown in the prompt.
 * @returns {Promise<import('../types').Device|null>}
 */
async function askForDevice(initial) {
  const target = await askAddress(initial);
  return target.port ? target : searchPorts(target.address);
}

/**
 * Shows the phones announced on the network, the ones connected before and a manual entry.
 * @returns {Promise<import('../types').Device|null>} The chosen phone, or `null` if not found.
 */
async function chooseFromList() {
  const lastAddress = getLastDevice()?.address || null;
  const [discovered, saved] = await Promise.all([
    waitForServices(CONNECT_SERVICE, { maxRetries: 2 }),
    Promise.all(getSavedDevices().map(async device => ({
      ...device,
      reachable: device.port ? await isAdbPort(device.address, device.port) : false
    })))
  ]);

  const choices = buildConnectChoices({
    discovered,
    saved,
    lastAddress,
    models: getDeviceModels(),
    labels: { lastUsed: t('lastUsed'), findPort: t('findPort'), manualEntry: t('manualEntry') }
  });

  const nothingFound = choices.length === 1;
  if (nothingFound) {
    console.log(t('connectNotFoundAskAddress'));
    return askForDevice(null);
  }

  const choice = await chooseConnectOption(choices);
  if (choice.kind === 'manual') return askForDevice(lastAddress);
  if (choice.kind === 'scan') return searchPorts(choice.device.address);
  return choice.device;
}

/**
 * Picks a phone without asking, for non-interactive use: the first one announced on the network
 * or, searched in parallel, the last one used.
 * @returns {Promise<import('../types').Device|null>}
 */
async function findAutomatically() {
  const lastAddress = getLastDevice()?.address || null;
  const controller = new AbortController();
  const searches = [
    waitForServices(CONNECT_SERVICE, { signal: controller.signal }).then(([device]) => device || null)
  ];
  if (lastAddress) searches.push(findDeviceByPorts(lastAddress, controller.signal));

  const device = await firstFound(searches);
  controller.abort();

  if (!device) console.log(t('noConnectDevices'));
  return device;
}

/**
 * `--connect`: finds a paired phone and connects to it.
 * @returns {Promise<void>}
 */
async function connectDevice() {
  console.log(t('searching'));
  const device = process.stdin.isTTY ? await chooseFromList() : await findAutomatically();
  if (device) await connectAndRemember(device);
}

module.exports = { connectDevice };
