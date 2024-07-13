const qrcode = require('qrcode-terminal');

/**
 * Generates and displays a QR code.
 * @param {string} name - The device name.
 * @param {string} password - The password.
 */
function showQR(name, password) {
  const text = `WIFI:T:ADB;S:${name};P:${password};;`;
  qrcode.generate(text, { small: true });
}

module.exports = { showQR };