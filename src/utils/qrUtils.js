const { randomBytes } = require('crypto');
const { renderUnicodeCompact } = require('uqr');

/**
 * Generates a random URL-safe id using Node's crypto module.
 * @param {number} size - Number of random bytes.
 * @returns {string}
 */
function randomId(size = 16) {
  return randomBytes(size).toString('base64url');
}

/**
 * Builds the text encoded in the QR code for adb wireless pairing.
 * @param {string} name - The device name.
 * @param {string} password - The password.
 * @returns {string}
 */
function buildQrText(name, password) {
  return `WIFI:T:ADB;S:${name};P:${password};;`;
}

/**
 * Generates and displays a QR code.
 * @param {string} name - The device name.
 * @param {string} password - The password.
 */
function showQR(name, password) {
  console.log(renderUnicodeCompact(buildQrText(name, password), { border: 1 }));
}

module.exports = { randomId, buildQrText, showQR };
