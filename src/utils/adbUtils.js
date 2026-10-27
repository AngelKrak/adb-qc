const { spawn, exec } = require('child_process');
const { prompt } = require('enquirer');

let adbProcess = null;  // Variable global para almacenar el proceso adb

/**
 * Handles process interruption (Ctrl + C) to cleanly exit.
 */
function handleProcessInterruption() {
  process.on('SIGINT', () => {
    console.log('Interrupt signal received: stopping processes...');
    if (adbProcess) {
      adbProcess.kill();  // Kill the adb process if it exists
    }
    process.exit();  // Exit the process
  });
}

/**
 * Executes an adb command and handles the output.
 * @param {string[]} commandArgs - The command arguments for adb.
 * @param {function(string):void} onSuccess - Callback for successful execution.
 * @param {function(string):void} onError - Callback for handling errors.
 */
function executeAdbCommand(commandArgs, onSuccess, onError) {
  adbProcess = spawn('adb', commandArgs);

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
 * Checks if an adb error comes from a server too old to support pairing
 * (e.g. the adb bundled with Genymotion or another outdated SDK).
 * @param {string} message - The error output from adb.
 * @returns {boolean}
 */
function isOutdatedServerError(message) {
  return /unknown host service/i.test(message || '');
}

/**
 * Restarts the adb server so it is launched by the adb found in PATH.
 * @returns {Promise<void>}
 */
function restartAdbServer() {
  console.warn(
    '⚠️ The running adb server does not support pairing (it is probably an old adb, e.g. from Genymotion).\n' +
    '   Restarting the adb server with the adb found in your PATH...'
  );
  return new Promise((resolve) => {
    exec('adb kill-server', () => {
      exec('adb start-server', () => resolve());
    });
  });
}

/**
 * Prompts user for input using Enquirer.
 * @param {string} question - The question to ask the user.
 * @returns {Promise<string>} - The user's input.
 */
async function promptUser(question) {
  const response = await prompt({
    type: 'input',
    name: 'code',
    message: question,
  });
  return response.code;
}

/**
 * Initiates pairing with a device using adb pair command.
 * @param {Object} device - The device to pair with.
 * @returns {Promise<void>} A promise that resolves when pairing is complete.
 */
async function pairDevice(device) {
  handleProcessInterruption();

  let serverRestarted = false;

  return new Promise(function resolveRetry(resolve, reject) {
    adbProcess = spawn('adb', ['pair', `${device.address}:${device.port}`]);

    let pairingPrompted = false;
    let output = '';

    adbProcess.stderr.on('data', (data) => {
      output += data.toString();
    });

    adbProcess.stdout.on('data', async (data) => {
      output += data.toString();

      if (output.includes('Enter pairing code:') && !pairingPrompted) {
        pairingPrompted = true;
        try {
          const code = await promptUser('Enter pairing code: ');
          adbProcess.stdin.write(`${code}\n`);
        } catch (error) {
          adbProcess.stdin.pause();
          process.exit();
        }
      }
    });

    adbProcess.on('close', async (code) => {
      if (code === 0 && !/failed/i.test(output)) {
        console.log('Pairing successful!');
        resolve();
        return;
      }

      const reason = output.replace('Enter pairing code:', '').trim();
      console.error(`Pairing failed.${reason ? ` ${reason}` : ''}`);

      if (isOutdatedServerError(output)) {
        if (serverRestarted) {
          reject(new Error(reason));
          return;
        }
        serverRestarted = true;
        await restartAdbServer();
      }
      resolveRetry(resolve, reject);
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
  handleProcessInterruption();

  return new Promise((resolve, reject) => {
    executeAdbCommand(
      ['connect', `${device.address}:${device.port}`],
      (stdout) => {
        const output = stdout.trim();
        if (output.startsWith('connected to') || output.startsWith('already connected to')) {
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
async function pairDeviceFromQR(device, password, serverRestarted = false) {
  handleProcessInterruption();

  try {
    await new Promise((resolve, reject) => {
      exec(`adb pair ${device.address}:${device.port} ${password}`, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        if (stderr || /failed/i.test(stdout)) {
          reject(new Error((stderr || stdout).trim()));
          return;
        }
        resolve();
      });
    });
  } catch (error) {
    if (!serverRestarted && isOutdatedServerError(error.message)) {
      await restartAdbServer();
      return pairDeviceFromQR(device, password, true);
    }
    console.error('Pairing failed:', error.message);
    throw error;
  }

  console.log('Pairing successful!');
}

/**
 * Runs an adb command and resolves with its stdout (empty string on error).
 * @param {string} command - The adb command arguments.
 * @returns {Promise<string>}
 */
function execAdb(command) {
  return new Promise((resolve) => {
    exec(`adb ${command}`, (error, stdout) => resolve(error ? '' : stdout));
  });
}

/**
 * Lists the _adb-tls-connect services discovered by the adb server itself.
 * @returns {Promise<Array<{deviceName: string, address: string, port: number}>>}
 */
async function getAdbConnectServices() {
  const output = await execAdb('mdns services');
  return output
    .split('\n')
    .map(line => line.trim().split(/\s+/))
    .filter(parts => parts.length >= 3 && parts[1].startsWith('_adb-tls-connect'))
    .map(([deviceName, , hostPort]) => {
      const [address, port] = hostPort.split(':');
      return { deviceName, address, port: Number(port) };
    });
}

/**
 * Returns the serials of the devices currently connected to adb.
 * @returns {Promise<string[]>}
 */
async function getConnectedSerials() {
  const output = await execAdb('devices');
  return output
    .split('\n')
    .slice(1)
    .map(line => line.trim().split(/\s+/))
    .filter(parts => parts[1] === 'device')
    .map(parts => parts[0]);
}

module.exports = {
  executeAdbCommand,
  pairDevice,
  connectToDevice,
  pairDeviceFromQR,
  getAdbConnectServices,
  getConnectedSerials
};