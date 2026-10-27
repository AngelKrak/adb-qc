const { Select } = require('enquirer');
const { nanoid } = require('nanoid');
const { checkAdb, connectToDevice } = require('./utils/adbUtils');
const { discoverDevices, pairDevice, startDiscoverQr, startPairAndConnect } = require('./discovery/deviceDiscovery');
const { showQR } = require('./utils/qrUtils');
const { banner, showVersion, showHelp } = require('./utils/versionUtils');
const { t } = require('./i18n');

/**
 * Command line flags for each action.
 */
const ACTION_FLAGS = {
  qr: ['--qr', '-q'],
  qr_connect: ['--qr_connect', '-qc'],
  pair: ['--pair', '-p'],
  pair_connect: ['--pair_connect', '-pc'],
  connect: ['--connect', '-c'],
  version: ['--version', '-v'],
  help: ['--help', '-h'],
};

/**
 * Gets the action from the command line arguments.
 * @param {string[]} args - The command line arguments.
 * @returns {string|null} The action or null if no flag was given.
 */
function parseAction(args) {
  const action = Object.keys(ACTION_FLAGS).find(key => ACTION_FLAGS[key].some(flag => args.includes(flag)));
  return action || null;
}

/**
 * Displays a prompt to choose an action with clear instructions.
 * @returns {Promise<string>} The chosen action.
 */
async function promptForAction() {
  const prompt = new Select({
    name: 'action',
    message: t('menuTitle'),
    choices: [
      { value: 'qr', name: t('menuQr') },
      { value: 'qr_connect', name: t('menuQrConnect') },
      { value: 'pair', name: t('menuPair') },
      { value: 'pair_connect', name: t('menuPairConnect') },
      { value: 'connect', name: t('menuConnect') },
    ],
    result(value) {
      const selected = this.choices.find(choice => choice.name === value);
      return selected ? selected.value : value;
    }
  });

  return await prompt.run();
}

/**
 * Handles the action based on the argument or user input.
 * @param {string} action - The action to perform.
 * @returns {Promise<void>}
 */
async function handleAction(action) {
  switch (action) {
    case 'qr':
    case 'qr_connect': {
      const name = `ADB_WIFI_${nanoid()}`;
      const password = nanoid();
      showQR(name, password);
      await startDiscoverQr(name, password, { autoConnect: action === 'qr_connect' });
      break;
    }
    case 'pair': {
      const device = await discoverDevices(true);
      if (device) {
        await pairDevice(device);
      }
      break;
    }
    case 'pair_connect':
      await startPairAndConnect();
      break;
    case 'connect': {
      const device = await discoverDevices(false);
      if (device) {
        await connectToDevice(device);
      }
      break;
    }
    default:
      throw new Error(t('unknownAction', { action }));
  }
}

/**
 * Main function to start the device discovery and connection process.
 * @param {string[]} args - The command line arguments.
 * @returns {Promise<void>}
 */
async function main(args = process.argv.slice(2)) {
  const action = parseAction(args);

  if (action === 'version') return showVersion();
  if (action === 'help') return showHelp();

  console.log(banner);

  try {
    await checkAdb();
    await handleAction(action || await promptForAction());
  } catch (error) {
    // Enquirer rejects with an empty value when the user cancels a prompt (Ctrl + C).
    if (!error) {
      console.log(t('cancelled'));
      process.exitCode = 130;
      return;
    }
    console.error(`❌ ${error.message || error}`);
    process.exitCode = 1;
  }
}

module.exports = main;
module.exports.parseAction = parseAction;
