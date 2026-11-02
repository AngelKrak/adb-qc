# Security Policy

## Supported Versions

Only the latest published version of adb-qc receives security fixes.

| Version | Supported |
| ------- | --------- |
| 1.x     | ✅        |
| < 1.1   | ❌        |

## Reporting a Vulnerability

Please **do not open a public issue** for security problems.

Report it privately through [GitHub Security Advisories](https://github.com/AngelKrak/adb-qc/security/advisories/new). Include the steps to reproduce it and the affected version.

You will get an answer within 7 days.

## Why adb-qc needs these permissions

Security scanners (like Socket) may flag these behaviors. They are required for the tool to work:

- **Runs child processes:** adb-qc runs the `adb` command (`adb pair`, `adb connect`, `adb mdns services`, `adb devices`, `adb version`). It uses `execFile` with an argument list, never a shell, so no input is interpreted as shell code.
- **Network access:** it sends mDNS queries on the local network (`224.0.0.251:5353`) to find Android devices with wireless debugging enabled. It does not contact any internet server.
- **Environment variables:** it only reads `ADB_QC_LANG`, `LC_ALL`, `LC_MESSAGES` and `LANG` to choose the language of the messages.

Published versions are built and published from GitHub Actions with [npm provenance](https://docs.npmjs.com/generating-provenance-statements), so you can check that the package comes from this repository.
