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

/**
 * Parses a TCP port typed by the user.
 * @param {string} value - The typed value.
 * @returns {number|null} The port, or null if it is not valid.
 */
function parsePort(value) {
  const text = String(value || '').trim();
  if (!/^\d+$/.test(text)) return null;

  const port = Number(text);
  return port >= 1 && port <= 65535 ? port : null;
}

/**
 * Parses an "IP:port" address typed by the user.
 * @param {string} value - The typed value, e.g. '192.168.1.19:33033'.
 * @returns {{address: string, port: number}|null} The device, or null if it is not valid.
 */
function parseHostPort(value) {
  const match = /^(\d{1,3}(?:\.\d{1,3}){3}):(\d+)$/.exec(String(value || '').trim());
  if (!match || match[1].split('.').some(part => Number(part) > 255)) return null;

  const port = parsePort(match[2]);
  return port ? { address: match[1], port } : null;
}

module.exports = { extractDeviceName, extractPort, getDevice, parsePort, parseHostPort };
