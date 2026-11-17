const { checkAdb } = require('./utils/adbUtils');
const { pairWithQr, pairWithCode } = require('./flows/pairing');
const { connectDevice } = require('./flows/connecting');
const { chooseAction } = require('./cli/prompts');
const { printBanner, printVersion, printHelp, printUpdateNotice } = require('./cli/output');
const { findNewerVersion } = require('./update/updateCheck');
const { wait } = require('./utils/async');
const { t } = require('./i18n');

// How long to wait for the npm registry once the action is done, so a slow network never holds the exit.
const UPDATE_NOTICE_WAIT_MS = 1500;

/**
 * Command line flags of each action.
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
 * What each action does once adb is ready.
 * @type {Object<string, function(): Promise<void>>}
 */
const ACTIONS = {
  qr: () => pairWithQr({ connect: false }),
  qr_connect: () => pairWithQr({ connect: true }),
  pair: () => pairWithCode({ connect: false }),
  pair_connect: () => pairWithCode({ connect: true }),
  connect: connectDevice,
};

/**
 * Gets the action from the command line arguments.
 * @param {string[]} args - The command line arguments.
 * @returns {string|null} The action, or `null` if no known flag was given.
 */
function parseAction(args) {
  const action = Object.keys(ACTION_FLAGS).find(key => ACTION_FLAGS[key].some(flag => args.includes(flag)));
  return action || null;
}

/**
 * Runs adb-qc: the action given as a flag or, without flags, the one chosen in the menu.
 * Afterwards, tells the user if a newer version is published on npm.
 * @param {string[]} [args] - The command line arguments.
 * @returns {Promise<void>}
 */
async function main(args = process.argv.slice(2)) {
  const action = parseAction(args);
  if (action === 'help') return printHelp();

  // Started first so the registry answers while the user pairs or connects.
  const newerVersion = findNewerVersion();

  if (action === 'version') {
    await printVersion();
  } else {
    printBanner();
    await runAction(action);
  }

  const latest = await Promise.race([newerVersion, wait(UPDATE_NOTICE_WAIT_MS).then(() => null)]);
  if (latest) printUpdateNotice(latest);
}

/**
 * Checks adb and runs the action, or the one chosen in the menu. Errors are printed, not thrown.
 * @param {string|null} action - The action from the command line.
 * @returns {Promise<void>}
 */
async function runAction(action) {
  try {
    await checkAdb();
    const run = ACTIONS[action || await chooseAction()];
    await run();
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
