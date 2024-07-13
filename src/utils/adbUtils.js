const { spawn, exec } = require('child_process');
const { input } = require('@inquirer/prompts');

/**
 * Executes an adb command and handles the output.
 * @param {string[]} commandArgs - The command arguments for adb.
 * @param {function(string):void} onSuccess - Callback for successful execution.
 * @param {function(string):void} onError - Callback for handling errors.
 */
function executeAdbCommand(commandArgs, onSuccess, onError) {
  const adbProcess = spawn('adb', commandArgs);

  let stdout = '';
  let stderr = '';

  adbProcess.stdout.on('data', (data) => {
    stdout += data.toString();
  });

  adbProcess.stderr.on('data', (data) => {
    stderr += data.toString();
  });

  adbProcess.on('close', (code) => {
    if (code === 0) {
      onSuccess(stdout);
    } else {
      onError(stderr.trim());
    }
  });

  adbProcess.on('error', (err) => {
    onError(`Failed to spawn adb process: ${err.message}`);
  });
}

/**
 * Initiates pairing with a device using adb pair command.
 * @param {Object} device - The device to pair with.
 * @param {string} password - The pairing password.
 * @returns {Promise<void>} A promise that resolves when pairing is complete.
 */
async function pairDevice(device, password) {
  return new Promise(function resolveRetry(resolve, reject) {
    const adbProcess = spawn('adb', ['pair', `${device.address}:${device.port}`]);

    let pairingPrompted = false;

    adbProcess.stdout.on('data', async (data) => {
      const output = data.toString();

      if (output.includes('Enter pairing code:') && !pairingPrompted) {
        pairingPrompted = true;
        try {
          const response = await input({
            message: 'Enter pairing code:',
          });
          adbProcess.stdin.write(`${response}\n`);
        } catch (error) {
          reject(error);
        }
      }
    });

    adbProcess.on('close', (code) => {
      if (code === 0) {
        console.log('Pairing successful!');
        resolve();
      } else {
        console.error('Pairing failed.');
        resolveRetry(resolve, reject);
      }
    });

    adbProcess.on('error', (err) => {
      console.error(`Failed to start adb pair process: ${err.message}`);
      resolveRetry(resolve, reject);
    });
  });
}

/**
 * Connects to a device using adb connect command.
 * @param {Object} device - The device to connect to.
 * @returns {Promise<void>} A promise that resolves when connection is established.
 */
async function connectToDevice(device) {
  return new Promise((resolve, reject) => {
    executeAdbCommand(
      ['connect', `${device.address}:${device.port}`],
      (stdout) => {
        const output = stdout.trim();
        if (output.startsWith('connected to')) {
          console.log(`Connected to device: ${device.address}:${device.port}`);
          resolve();
        } else {
          reject(new Error(output));
        }
      },
      (error) => {
        reject(new Error(error));
      }
    );
  });
}

/**
 * Initiates pairing with a device using adb pair command based on QR code.
 * @param {Object} device - The device to pair with.
 * @param {string} password - The pairing password.
 * @returns {Promise<void>} A promise that resolves when pairing is complete.
 */
async function pairDeviceFromQR(device, password) {
  return new Promise((resolve, reject) => {
    exec(`adb pair ${device.address}:${device.port} ${password}`, (error, stdout, stderr) => {
      if (error) {
        console.error('Pairing failed:', error.message);
        reject(error);
        return;
      }
      if (stderr) {
        reject(new Error(stderr));
        return;
      }
      console.log('Pairing successful!');
      resolve();
    });
  });
}

module.exports = { executeAdbCommand, pairDevice, connectToDevice, pairDeviceFromQR };