/**
 * Builds the choices shown when connecting to a device.
 * @param {Object} params
 * @param {Array<Object>} params.discovered - Devices announced on the network.
 * @param {Array<Object>} params.saved - Devices connected before ({address, port, reachable}), where
 *   reachable tells whether adbd answers on the saved port.
 * @param {string|null} params.lastAddress - The address of the last connected device.
 * @param {Object} params.models - Known models by mDNS name or IP address.
 * @param {Object} params.labels - Translated labels: {lastUsed, findPort, manualEntry}.
 * @returns {Array<{key: string, label: string, hint: string, kind: string, device: Object|null}>}
 *   kind is 'device' (connect right away), 'scan' (find the port first) or 'manual' (ask for the address).
 */
function buildConnectChoices({ discovered, saved, lastAddress, models, labels }) {
  const modelOf = device => models[device.deviceName] || models[device.address] || '';
  const lastUsedOf = device => device.address === lastAddress && labels.lastUsed;
  const hintOf = (...parts) => parts.filter(Boolean).join(' · ');

  const choices = discovered.map(device => ({
    key: `${device.address}:${device.port}`,
    label: `${device.address}:${device.port}`,
    hint: hintOf(modelOf(device), device.deviceName, lastUsedOf(device)),
    kind: 'device',
    device
  }));

  saved
    .filter(device => !discovered.some(found => found.address === device.address))
    .forEach(device => {
      const reachable = Boolean(device.reachable && device.port);
      const target = reachable ? `${device.address}:${device.port}` : device.address;
      choices.push({
        key: target,
        label: target,
        hint: hintOf(modelOf(device), lastUsedOf(device), !reachable && labels.findPort),
        kind: reachable ? 'device' : 'scan',
        device: { address: device.address, port: reachable ? device.port : null }
      });
    });

  choices.push({ key: 'manual', label: labels.manualEntry, hint: '', kind: 'manual', device: null });
  return choices;
}

module.exports = { buildConnectChoices };
