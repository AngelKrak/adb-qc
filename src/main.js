const { nanoid } = require('nanoid');
const { showQR } = require('./utils/qrUtils');
const { pairDevice, connectToDevice } = require('./utils/adbUtils');
const { discoverDevices, startDiscoverQr } = require('./discovery/deviceDiscovery');
const { select } = require('@inquirer/prompts');

const nameId = nanoid();
const password = nanoid();
const name = `ADB_WIFI_${nameId}`;
const args = process.argv.slice(2);

/**
 * Displays a prompt to choose an action with clear instructions.
 * @returns {Promise<string>} The chosen action.
 */
async function promptForAction() {
  const choices = [
    { name: '📱 Pair device with QR code', value: 'qr' },
    { name: '🔑 Pair device with pairing code', value: 'pair' },
    { name: '🔌 Connect to a device', value: 'connect' },
  ];

  const selectAction = await select({
    message: '🚀 Please select an action to proceed:',
    choices,
    theme: {
      prefix: ""
    }
  });

  return selectAction;
}

/**
 * Handles the action based on the argument or user input.
 * @param {string} action - The action to perform.
 * @returns {Promise<void>}
 */
async function handleAction(action) {
  switch (action) {
    case 'qr':
      showQR(name, password);
      await startDiscoverQr(name, password);
      break;
    case 'pair':
      const deviceToPair = await discoverDevices(true);
      if (deviceToPair) {
        await pairDevice(deviceToPair, password);
      }
      break;
    case 'connect':
      const deviceToConnect = await discoverDevices(false);
      if (deviceToConnect) {
        await connectToDevice(deviceToConnect);
      }
      break;
    default:
      console.error('⚠️ Unknown action:', action);
  }
}

/**
 * Main function to start the device discovery and connection process.
 * @returns {Promise<void>}
 */
async function main() {
  try {
    let action;

    if (args.includes('--qr') || args.includes('-q')) {
      action = 'qr';
    } else if (args.includes('--pair') || args.includes('-p')) {
      action = 'pair';
    } else if (args.includes('--connect') || args.includes('-c')) {
      action = 'connect';
    } else {
      action = await promptForAction();
    }

    await handleAction(action);
  } catch (error) {
    console.error('❌ An error occurred:', error);
  }
}

module.exports = main;