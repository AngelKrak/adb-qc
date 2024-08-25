const { Select } = require('enquirer');
const { nanoid } = require('nanoid');
const { pairDevice, connectToDevice } = require('./utils/adbUtils');
const { discoverDevices, startDiscoverQr, startPairAndConnect } = require('./discovery/deviceDiscovery');
const { showQR } = require('./utils/qrUtils');

const nameId = nanoid();
const password = nanoid();
const name = `ADB_WIFI_${nameId}`;
const args = process.argv.slice(2);

/**
 * Displays a prompt to choose an action with clear instructions.
 * @returns {Promise<string>} The chosen action.
 */
async function promptForAction() {
  const prompt = new Select({
    name: 'action',
    message: '🚀 Please select an action to proceed:',
    choices: [
      { value: 'qr', name: '📱 Pair device with QR code' },
      { value: 'qr_connect', name: '📱 Pair and connect device with QR code' },
      { value: 'pair', name: '🔑 Pair device with pairing code' },
      { value: 'pair_connect', name: '🔑 Pair and connect device with pairing code' },
      { value: 'connect', name: '🔌 Connect to a device' },
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
      showQR(name, password);
      await startDiscoverQr(name, password);
      break;
    case 'pair':
      const device = await discoverDevices(true);
      if (device) {
        await pairDevice(device);
      }
      break;
    case 'connect':
      const deviceToConnect = await discoverDevices(false);
      if (deviceToConnect) {
        await connectToDevice(deviceToConnect);
      }
      break;
    case 'qr_connect':
      showQR(name, password);
      await startDiscoverQr(name, password, { autoConnect: true });
      break;
    case 'pair_connect':
      await startPairAndConnect();
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
    } else if (args.includes('--qr_connect') || args.includes('-qc')) {
      action = 'qr_connect';
    } else if (args.includes('--pair') || args.includes('-p')) {
      action = 'pair';
    } else if (args.includes('--pair_connect') || args.includes('-pc')) {
      action = 'pair_connect';
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