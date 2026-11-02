const main = require('./main');

// Exit when done instead of waiting for background mDNS searches to time out.
main().then(() => process.stdout.write('', () => process.exit()));
