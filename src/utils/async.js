/**
 * Resolves after the given time.
 * @param {number} ms - Time to wait in milliseconds.
 * @returns {Promise<void>}
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Resolves with the first truthy result of searches running in parallel, or `null` when all of
 * them finish without one. Rejected searches count as finished without a result.
 * @template T
 * @param {Array<Promise<T|null>>} searches - The searches.
 * @returns {Promise<T|null>}
 */
function firstFound(searches) {
  return new Promise(resolve => {
    let pending = searches.length;
    searches.forEach(search => search
      .catch(() => null)
      .then(result => {
        pending--;
        if (result) resolve(result);
        else if (pending === 0) resolve(null);
      }));
  });
}

module.exports = { wait, firstFound };
