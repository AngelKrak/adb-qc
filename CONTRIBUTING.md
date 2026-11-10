# Contributing

Thanks for your interest in improving adb-qc!

## Setup

```sh
git clone https://github.com/AngelKrak/adb-qc.git
cd adb-qc
npm install
npm link   # use the adb-qc command with your local copy
```

## Project structure

Each folder has one responsibility, and dependencies only point down the list:

```
src/
  main.js         Reads the command line flags and runs the matching flow.
  flows/          What each action does: pairing.js (QR / pairing code) and connecting.js.
  cli/            Terminal I/O only: prompts.js (questions) and output.js (banner, help, version).
  connection/     Connecting to a phone without duplicates and remembering it.
  discovery/      Finding phones: mDNS services, port search and the connect list (pure logic).
  utils/          adb commands, port scanner, config file, QR code and small helpers.
  i18n/           English and Spanish messages.
  types.js        Shared JSDoc types (Device).
```

- Keep pure logic (parsers, list building) free of I/O so it can be tested in `test/`.
- Document exported functions with JSDoc; use comments inside functions only to explain *why*.

## Before opening a pull request

```sh
npm run lint   # requires Node.js 20.19 or newer
npm test
```

- Create a branch from `main` (for example `fix/pairing-error`).
- Keep pull requests small and focused on one change.
- Add or update tests for logic changes (`test/`).
- Add new messages in both languages in `src/i18n/index.js`.
- Test the change with a real device when it affects pairing or connecting.

## Reporting bugs

Open an [issue](https://github.com/AngelKrak/adb-qc/issues) with:

- The output of `adb-qc --version`.
- The command you ran and the full error.
- Your Android version and phone model.

For security problems, follow [SECURITY.md](SECURITY.md) instead.
