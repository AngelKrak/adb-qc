const version = require('../../package.json').version;

const banner = `
    ___     ____     ____           ____    ______
   /   |   / __ \\   / __ )         / __ \\  / ____/
  / /| |  / / / /  / __  | ______ / / / / / /     
 / ___ | / /_/ /  / /_/ / /_____// /_/ / / /___   
/_/  |_|/_____/  /_____/         \\___\\_\\ \\____/   


        Welcome to ADB Quick Connect
     Wi-Fi - QR Scanner - Pairing Code

`;

async function versionUtils() {
  console.log(banner);

  console.log(`
VERSION INFO:

ADB-QC: ${version}
Node.js:   ${process.version}
OS:        ${process.platform}
`);

  return process.exit(0);
}

module.exports = {
  versionUtils,
  banner
};