const { version } = require('../../package.json');
const { runAdb } = require('./adbUtils');
const { t } = require('../i18n');

const banner = `
    ___     ____     ____           ____    ______
   /   |   / __ \\   / __ )         / __ \\  / ____/
  / /| |  / / / /  / __  | ______ / / / / / /
 / ___ | / /_/ /  / /_/ / /_____// /_/ / / /___
/_/  |_|/_____/  /_____/         \\___\\_\\ \\____/


        Welcome to ADB Quick Connect
     Wi-Fi - QR Scanner - Pairing Code

`;

/**
 * Prints the version info of adb-qc, Node.js, adb and the OS.
 * @returns {Promise<void>}
 */
async function showVersion() {
  const adbVersion = await runAdb(['version'])
    .then(({ stdout }) => (/^Version (.+)$/m.exec(stdout) || [])[1] || 'unknown')
    .catch(() => 'not found');

  console.log(`
VERSION INFO:

ADB-QC:    ${version}
Node.js:   ${process.version}
adb:       ${adbVersion}
OS:        ${process.platform}
`);
}

/**
 * Prints the command line help.
 */
function showHelp() {
  console.log(t('help'));
}

module.exports = {
  showVersion,
  showHelp,
  banner
};
