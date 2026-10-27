const { version } = require('../../package.json');
const { runAdb } = require('./adbUtils');

const banner = `
    ___     ____     ____           ____    ______
   /   |   / __ \\   / __ )         / __ \\  / ____/
  / /| |  / / / /  / __  | ______ / / / / / /
 / ___ | / /_/ /  / /_/ / /_____// /_/ / / /___
/_/  |_|/_____/  /_____/         \\___\\_\\ \\____/


        Welcome to ADB Quick Connect
     Wi-Fi - QR Scanner - Pairing Code

`;

const help = `
Usage: adb-qc [option]

Options:
  -q,  --qr             Pair a device with a QR code
  -qc, --qr_connect     Pair and connect a device with a QR code
  -p,  --pair           Pair a device with a pairing code
  -pc, --pair_connect   Pair and connect a device with a pairing code
  -c,  --connect        Connect to a paired device
  -v,  --version        Show version info
  -h,  --help           Show this help

Without options, an interactive menu is shown.
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
  console.log(help);
}

module.exports = {
  showVersion,
  showHelp,
  banner
};
