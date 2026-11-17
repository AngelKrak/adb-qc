const https = require('https');
const { name, version: currentVersion } = require('../../package.json');
const { getUpdateCheck, saveUpdateCheck } = require('../utils/configStore');

const LATEST_URL = `https://registry.npmjs.org/${name}/latest`;
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 2000;

/**
 * Tells whether `latest` is a newer release than `current`.
 * Only compares major.minor.patch: pre-release tags are never offered as updates.
 * @param {string} latest - The latest published version, e.g. '1.4.0'.
 * @param {string} current - The installed version, e.g. '1.3.0'.
 * @returns {boolean}
 */
function isNewerVersion(latest, current) {
  const parse = value => /^(\d+)\.(\d+)\.(\d+)$/.exec(String(value || '').trim());
  const latestParts = parse(latest);
  const currentParts = parse(current);
  if (!latestParts || !currentParts) return false;

  for (let i = 1; i <= 3; i++) {
    const difference = Number(latestParts[i]) - Number(currentParts[i]);
    if (difference !== 0) return difference > 0;
  }
  return false;
}

/**
 * Tells whether the registry should be asked again, or the saved answer is recent enough.
 * @param {{checkedAt?: number}|null} saved - The last saved check.
 * @param {number} now - The current time in milliseconds.
 * @returns {boolean}
 */
function isCheckDue(saved, now) {
  return !saved || !saved.checkedAt || now - saved.checkedAt >= CHECK_INTERVAL_MS || now < saved.checkedAt;
}

/**
 * Tells whether the update check is turned off: in CI, when the output is not a terminal,
 * or with ADB_QC_NO_UPDATE_CHECK / NO_UPDATE_NOTIFIER.
 * @param {Object} env - The environment variables.
 * @param {boolean} isTTY - Whether stdout is a terminal.
 * @returns {boolean}
 */
function isUpdateCheckDisabled(env, isTTY) {
  return Boolean(env.ADB_QC_NO_UPDATE_CHECK || env.NO_UPDATE_NOTIFIER || env.CI) || !isTTY;
}

/**
 * Asks the npm registry for the latest published version.
 * @returns {Promise<string>} The version, e.g. '1.4.0'.
 * @throws {Error} If the registry does not answer in time or the answer is not valid.
 */
function fetchLatestVersion() {
  return new Promise((resolve, reject) => {
    const request = https.get(LATEST_URL, { headers: { accept: 'application/json' }, timeout: REQUEST_TIMEOUT_MS }, response => {
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`npm registry answered ${response.statusCode}`));
        return;
      }
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { body += chunk; });
      response.on('end', () => {
        try {
          resolve(JSON.parse(body).version);
        } catch (error) {
          reject(error);
        }
      });
    });
    request.on('timeout', () => request.destroy(new Error('npm registry timed out')));
    request.on('error', reject);
  });
}

/**
 * Looks for a newer adb-qc on npm. The registry is asked at most once a day; the answer
 * is saved in the config file. Never throws: being offline must not break the tool.
 * @returns {Promise<string|null>} The newer version, or `null` if there is none or it is unknown.
 */
async function findNewerVersion() {
  if (isUpdateCheckDisabled(process.env, Boolean(process.stdout.isTTY))) return null;

  const now = Date.now();
  let saved = getUpdateCheck();
  if (isCheckDue(saved, now)) {
    try {
      saved = { checkedAt: now, latest: await fetchLatestVersion() };
      saveUpdateCheck(saved);
    } catch (error) {
      // Offline or the registry is slow: keep using the last known answer.
    }
  }
  return saved && isNewerVersion(saved.latest, currentVersion) ? saved.latest : null;
}

module.exports = { findNewerVersion, isNewerVersion, isCheckDue, isUpdateCheckDisabled };
