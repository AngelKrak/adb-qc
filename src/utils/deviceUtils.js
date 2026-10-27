/**
 * Extracts the device name from a DNS answer.
 * @param {Object} answer - The DNS answer object.
 * @returns {string|null} The extracted device name.
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
 * @returns {number|null} The extracted port number.
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
 * @param {string} serviceType - The service type, e.g. '_adb-tls-pairing._tcp'.
 * @returns {Object} The device information.
 */
function getDevice(service, serviceType = '_adb-tls-pairing._tcp') {
  const answers = (service.packet && service.packet.answers) || [];
  const findAnswer = type => answers.find(answer => answer.type === type && answer.name.includes(serviceType));

  const srvAnswer = findAnswer('SRV');
  const deviceName = extractDeviceName(findAnswer('PTR') || srvAnswer);
  const port = extractPort(srvAnswer);

  return {
    address: service.address,
    deviceName: deviceName,
    port: port || service.service?.port || null
  };
}

module.exports = { extractDeviceName, extractPort, getDevice };
