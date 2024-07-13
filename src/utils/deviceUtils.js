/**
 * Extracts the device name from a DNS answer.
 * @param {Object} answer - The DNS answer object.
 * @returns {string} The extracted device name.
 */
function extractDeviceName(answer) {
  if (answer && (answer.type === 'PTR' || answer.type === 'SRV')) {
    return answer.type === 'PTR' ? answer.rdata.split('.')[0] : answer.name.split('.')[0];
  }
  return null;
}

/**
 * Extracts the port from a DNS answer.
 * @param {Object} answer - The DNS answer object.
 * @returns {number} The extracted port number.
 */
function extractPort(answer) {
  if (answer && answer.type === 'SRV') {
    return answer.rdata.port;
  }
  return null;
}

/**
 * Retrieves device information from a service object.
 * @param {Object} service - The service object returned from mDnsSd.discover().
 * @returns {Object} The device information.
 */
function getDevice(service) {
  const deviceAnswer = service.packet.answers.find(answer =>
    answer.name.startsWith('_adb-tls-pairing._tcp.local') &&
    (answer.type === 'PTR' || answer.type === 'SRV')
  );
  const deviceName = extractDeviceName(deviceAnswer);
  const port = extractPort(deviceAnswer);

  return {
    address: service.address,
    deviceName: deviceName,
    port: port || service.service?.port
  };
}

module.exports = { extractDeviceName, extractPort, getDevice };