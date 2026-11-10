const { version } = require('../../package.json');
const { runAdb } = require('../utils/adbUtils');
const { t } = require('../i18n');

const LOGO = String.raw`
    ___     ____     ____           ____    ______
   /   |   / __ \   / __ )         / __ \  / ____/
  / /| |  / / / /  / __  | ______ / / / / / /
 / ___ | / /_/ /  / /_/ / /_____// /_/ / / /___
/_/  |_|/_____/  /_____/         \___\_\ \____/
`;

/**
 * Centers a line under the logo.
 * @param {string} text - The line.
 * @returns {string}
 */
function centered(text) {
  const logoWidth = Math.max(...LOGO.split('\n').map(line => line.length));
  return ' '.repeat(Math.max(0, Math.floor((logoWidth - text.length) / 2))) + text;
}

/**
 * Prints the logo with the translated title.
 */
function printBanner() {
  console.log(`${LOGO}\n\n${centered(t('bannerTitle'))}\n${centered(t('bannerSubtitle'))}\n`);
}

/**
 * Prints the versions of adb-qc, Node.js and adb, and the OS.
 * @returns {Promise<void>}
 */
async function printVersion() {
  const adbVersion = await runAdb(['version'])
    .then(({ stdout }) => (/^Version (.+)$/m.exec(stdout) || [])[1] || t('versionUnknown'))
    .catch(() => t('adbMissing'));

  console.log(`
${t('versionTitle')}

adb-qc:    ${version}
Node.js:   ${process.version}
adb:       ${adbVersion}
OS:        ${process.platform}
`);
}

/**
 * Prints the command line help.
 */
function printHelp() {
  console.log(t('help'));
}

module.exports = { printBanner, printVersion, printHelp };
