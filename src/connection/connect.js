const {
  connectToDevice,
  getAdbMdnsServices,
  getConnectedSerials,
  getDeviceModel
} = require('../utils/adbUtils');
const { saveLastDevice, saveDeviceModel } = require('../utils/configStore');
const { CONNECT_SERVICE } = require('../discovery/serviceDiscovery');
const { wait } = require('../utils/async');
const { t } = require('../i18n');

/**
 * Finds the adb serial of a connected phone, either `IP:PORT` or its mDNS name.
 * @param {import('../types').Device} device - The phone.
 * @param {Array<import('../types').Device>} services - Connect services announced on the network.
 * @returns {Promise<string|null>} The serial, or `null` if adb is not connected to it.
 */
async function findConnectedSerial(device, services) {
  const names = services.filter(service => service.address === device.address).map(service => service.deviceName);
  if (device.deviceName) names.push(device.deviceName);

  const serials = await getConnectedSerials();
  return serials.find(serial =>
    serial === `${device.address}:${device.port}` || names.some(name => serial.startsWith(`${name}.`))
  ) || null;
}

/**
 * Waits briefly for adb's own connection to a phone.
 *
 * Recent adb versions connect paired phones automatically when they announce themselves over
 * mDNS; connecting again by `IP:PORT` would leave the phone connected twice, and then commands
 * like `adb shell` fail with "more than one device".
 * @param {import('../types').Device} device - The phone.
 * @returns {Promise<boolean>} Whether adb is connected to the phone.
 */
async function waitForAdbAutoConnect(device) {
  const services = await getAdbMdnsServices(CONNECT_SERVICE);
  const announced = services.some(service => service.address === device.address);
  const attempts = announced ? 4 : 1;

  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) await wait(500);
    if (await findConnectedSerial(device, services)) return true;
  }
  return false;
}

/**
 * Saves the model of a connected phone, shown later in the device list.
 * @param {import('../types').Device} device - The connected phone.
 * @returns {Promise<void>}
 */
async function rememberModel(device) {
  const services = await getAdbMdnsServices(CONNECT_SERVICE);
  const serial = await findConnectedSerial(device, services);
  if (!serial) return;

  const model = await getDeviceModel(serial);
  const mdnsName = serial.includes('._adb-tls-connect') ? serial.split('.')[0] : null;
  if (model) saveDeviceModel([device.deviceName, mdnsName, device.address], model);
}

/**
 * Connects to a phone, unless adb already did, and remembers it for the next time.
 * @param {import('../types').Device} device - The phone, with its connect port.
 * @returns {Promise<void>}
 * @throws {Error} When the phone rejects the connection.
 */
async function connectAndRemember(device) {
  const target = `${device.address}:${device.port}`;

  if (!await waitForAdbAutoConnect(device)) {
    console.log(t('connecting', { device: target }));
    await connectToDevice(device);
  }
  console.log(t('connected', { device: target }));
  saveLastDevice(device);
  await rememberModel(device);
}

module.exports = { connectAndRemember };
