# Contributing

Thanks for your interest in improving adb-qc!

## Setup

```sh
git clone https://github.com/AngelKrak/adb-qc.git
cd adb-qc
npm install
npm link   # use the adb-qc command with your local copy
```

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
