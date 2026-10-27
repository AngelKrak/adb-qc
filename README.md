# ADB Quick Connect (adb-qc)

**English** | [Español](README.es.md)

[![npm Version](https://img.shields.io/npm/v/adb-qc.svg)](https://www.npmjs.com/package/adb-qc)
[![npm total downloads](https://img.shields.io/npm/dt/adb-qc.svg)](https://www.npmjs.com/package/adb-qc)
[![CI](https://github.com/AngelKrak/adb-qc/actions/workflows/ci.yml/badge.svg)](https://github.com/AngelKrak/adb-qc/actions/workflows/ci.yml)
[![License](https://img.shields.io/npm/l/adb-qc.svg)](https://www.npmjs.com/package/adb-qc)

![Cover](https://raw.githubusercontent.com/AngelKrak/adb-qc/main/screens/screen.jpg)

**ADB Quick Connect (adb-qc)** is a tool that makes it easy to pair and connect Android devices with ADB (Android Debug Bridge) over Wi-Fi. It can pair devices with a QR code or a pairing code, and connect to devices available on the network.

## Features

-  **QR code pairing**: Pair devices by scanning a QR code.

-  **Pairing code**: Pair devices with a 6-digit pairing code.

-  **Device connection**: Connect to devices available on the network.

-  **Auto-connect**: After pairing, it can connect to the device with no extra steps.

## Requirements

-  [Node.js](https://nodejs.org/) 18 or newer.
-  [Android SDK Platform-Tools](https://developer.android.com/tools/releases/platform-tools) **version 30 or newer** (`adb` must be in your `PATH`). You can check your version with `adb version`.
-  A device with **Android 11 or newer** (wireless debugging doesn't exist on older versions).
-  The computer and the device must be on the **same Wi-Fi network**.

## Installation

<table>
<tr>
  <th>npm</th>
  <th>yarn</th>
</tr>
<tr>
<td>

```sh
npm install -g adb-qc
```

</td>
<td>

```sh
yarn global add adb-qc
```

</td>
</tr>
</table>

## Usage

Once installed globally, you can run the tool from the command line with different options:

### Command Line Options

-  `--qr` or `-q`: Shows a QR code for pairing.

-  `--qr_connect` or `-qc`: Shows a QR code for pairing and connects to the device automatically, without needing `--connect` afterwards.

-  `--pair` or `-p`: Pairs a device with a pairing code.

-  `--pair_connect` or `-pc`: Pairs a device with a pairing code and connects to it automatically, without needing `--connect` afterwards.

-  `--connect` or `-c`: Connects to a device available on the network.

-  `--version` or `-v`: Shows the adb-qc, Node.js and adb versions.

-  `--help` or `-h`: Shows the help with all the options.

### Language

Messages are shown in English or Spanish depending on your system language. To choose it manually, use the `ADB_QC_LANG` variable:

```sh
ADB_QC_LANG=es adb-qc
```

### Examples

1.  **Show a QR code for pairing**:

Run `adb-qc --qr` to show a QR code.

![QR code pairing](https://vhs.charm.sh/vhs-4iiq5ybKctFNXgxDnXDeqd.gif)

2.  **Pair a device with a pairing code**:

Run `adb-qc --pair` to pair a device with a pairing code.

![Pairing code](https://vhs.charm.sh/vhs-6FRxCcsYVjveqvYjEoWXdj.gif)

3.  **Connect to a device**:

Run `adb-qc --connect` to connect to a device available on the network.

![Connect to a device](https://vhs.charm.sh/vhs-27uAI0Gg2wpaaP2TyI46y8.gif)

4.  **If no options are given**, an interactive menu lets you choose an action.

![Interactive menu](https://vhs.charm.sh/vhs-5DpJ6W8kiegOobcDi2li3B.gif)

## How to Enable Wireless Debugging

To use **ADB Quick Connect**, you need to enable wireless debugging on your Android device:

1. **Enable Developer Options**:
   - Go to **Settings** on your Android device.
   - Scroll down and select **About phone**.
   - Find the **Build number** and tap it seven times. You'll see a message saying you are now a developer.

2. **Turn on Wireless Debugging**:
   - Go back to **Settings** and select **System**.
   - Tap **Advanced** and then **Developer options**.
   - Turn on **Wireless debugging** (it may be in a different section depending on the manufacturer).

3. **Connect to the Wi-Fi Network**:
   - Make sure your device is on the same Wi-Fi network as your computer.

   ![Enable wireless debugging](https://raw.githubusercontent.com/AngelKrak/adb-qc/main/screens/developer-settings.jpg)

4. **Pair the Device**:
   - Use **ADB Quick Connect** to show a QR code or enter a pairing code.

   ![Pair device](https://raw.githubusercontent.com/AngelKrak/adb-qc/main/screens/wireless-debugging.jpg)

## How It Works

1.  **Identifier generation**: The tool generates a unique name and password for QR pairing.

2.  **Device discovery**: It uses `mDNS` (through adb and its own queries) to find devices available for pairing or connection.

3.  **QR or code pairing**: Depending on the selected option, it shows a QR code or asks for a pairing code.

4.  **Connection**: It connects to devices available on the network.

## Troubleshooting

### `error: unknown host service` when pairing

The running adb server is an old version that doesn't support pairing (for example, the adb bundled with **Genymotion**). adb-qc tries to restart the server automatically, but if another app starts it again, configure that app to use your adb:

-  **Genymotion**: go to **Settings → ADB**, select **Use custom Android SDK tools** and enter the path to your Android SDK (for example `~/Library/Android/sdk` on macOS). Then close Genymotion, run `adb kill-server` and open it again.

### No devices are found

-  Check that the computer and the device are on the same Wi-Fi network.
-  Some networks (offices, schools or guest networks) block mDNS, which is used to find the devices.
-  To pair with a code, keep the **Pair device with pairing code** window open on your phone while using adb-qc.

### Pairing works but it doesn't connect

Recent adb versions connect paired devices automatically. Check with `adb devices` whether it is already listed; if not, run `adb-qc --connect`.

## Development

```sh
git clone https://github.com/AngelKrak/adb-qc.git
cd adb-qc
npm install
npm link       # use the adb-qc command with your local copy
npm test       # run the tests
npm run lint   # check the code style with ESLint
```

## Contributing

Contributions are welcome! If you have ideas for improvements or find bugs, feel free to open an **issue** or send a **pull request**.

# License

ADB Quick Connect is licensed under the [MIT license](https://github.com/AngelKrak/adb-qc/blob/main/LICENSE) © [Angel Ramirez](https://github.com/AngelKrak/)
