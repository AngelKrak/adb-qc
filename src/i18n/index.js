const messages = {
  en: {
    adbNotFound: 'adb was not found. Install the Android SDK Platform-Tools and make sure adb is in your PATH.',
    adbTooOld: 'Your adb version ({major}) does not support wireless pairing. Update the Android SDK Platform-Tools to version {min} or newer.',
    outdatedServer: '⚠️ The running adb server does not support pairing (it is probably an old adb, e.g. from Genymotion).\n   Restarting the adb server with the adb found in your PATH...',
    unknownPairingError: 'Unknown pairing error.',
    unknownConnectionError: 'Unknown connection error.',
    connected: 'Connected to device: {device}',
    connecting: 'Connecting to device: {device}',
    searching: 'Searching for devices...',
    noPairingDevices: 'No devices found. Open "Pair device with pairing code" in Wireless debugging on your phone.',
    noConnectDevices: 'No devices found. Make sure Wireless debugging is enabled on your phone.',
    selectPair: 'Select device to pair:',
    selectConnect: 'Select device to connect:',
    pairing: 'Pairing your device: {device}',
    enterCode: 'Enter pairing code:',
    invalidCode: 'The pairing code has 6 digits.',
    pairingSuccess: 'Pairing successful!',
    pairingFailed: 'Pairing failed: {reason}',
    scanQr: 'Scan the QR code from "Wireless debugging > Pair device with QR code" on your phone.',
    waitingDevice: 'Waiting for your device...',
    qrTimeout: 'No device scanned the QR code in time. Please try again.',
    searchingConnect: 'Searching for device to connect to using address: {address}',
    connectNotFound: 'Device not found for connection. Try again with: adb-qc --connect',
    menuTitle: '🚀 Please select an action to proceed:',
    menuQr: '📱 Pair device with QR code',
    menuQrConnect: '📱 Pair and connect device with QR code',
    menuPair: '🔑 Pair device with pairing code',
    menuPairConnect: '🔑 Pair and connect device with pairing code',
    menuConnect: '🔌 Connect to a device',
    unknownAction: 'Unknown action: {action}',
    cancelled: 'Cancelled.',
    help: `
Usage: adb-qc [option]

Options:
  -q,  --qr             Pair a device with a QR code
  -qc, --qr_connect     Pair and connect a device with a QR code
  -p,  --pair           Pair a device with a pairing code
  -pc, --pair_connect   Pair and connect a device with a pairing code
  -c,  --connect        Connect to a paired device
  -v,  --version        Show version info
  -h,  --help           Show this help

Without options, an interactive menu is shown.
Set ADB_QC_LANG=en or ADB_QC_LANG=es to change the language.
`,
  },
  es: {
    adbNotFound: 'No se encontró adb. Instala Android SDK Platform-Tools y asegúrate de que adb esté en tu PATH.',
    adbTooOld: 'Tu versión de adb ({major}) no soporta el emparejamiento inalámbrico. Actualiza Android SDK Platform-Tools a la versión {min} o superior.',
    outdatedServer: '⚠️ El servidor de adb en ejecución no soporta emparejamiento (probablemente es un adb antiguo, por ejemplo el de Genymotion).\n   Reiniciando el servidor de adb con el adb de tu PATH...',
    unknownPairingError: 'Error de emparejamiento desconocido.',
    unknownConnectionError: 'Error de conexión desconocido.',
    connected: 'Conectado al dispositivo: {device}',
    connecting: 'Conectando al dispositivo: {device}',
    searching: 'Buscando dispositivos...',
    noPairingDevices: 'No se encontraron dispositivos. Abre "Vincular dispositivo con código de vinculación" en Depuración inalámbrica en tu teléfono.',
    noConnectDevices: 'No se encontraron dispositivos. Asegúrate de que la Depuración inalámbrica esté activada en tu teléfono.',
    selectPair: 'Selecciona el dispositivo a emparejar:',
    selectConnect: 'Selecciona el dispositivo a conectar:',
    pairing: 'Emparejando tu dispositivo: {device}',
    enterCode: 'Escribe el código de vinculación:',
    invalidCode: 'El código de vinculación tiene 6 dígitos.',
    pairingSuccess: '¡Emparejamiento exitoso!',
    pairingFailed: 'Falló el emparejamiento: {reason}',
    scanQr: 'Escanea el código QR desde "Depuración inalámbrica > Vincular dispositivo mediante código QR" en tu teléfono.',
    waitingDevice: 'Esperando a tu dispositivo...',
    qrTimeout: 'Ningún dispositivo escaneó el código QR a tiempo. Inténtalo de nuevo.',
    searchingConnect: 'Buscando el dispositivo para conectar en la dirección: {address}',
    connectNotFound: 'No se encontró el dispositivo para conectar. Inténtalo de nuevo con: adb-qc --connect',
    menuTitle: '🚀 Selecciona una acción:',
    menuQr: '📱 Emparejar dispositivo con código QR',
    menuQrConnect: '📱 Emparejar y conectar dispositivo con código QR',
    menuPair: '🔑 Emparejar dispositivo con código de vinculación',
    menuPairConnect: '🔑 Emparejar y conectar dispositivo con código de vinculación',
    menuConnect: '🔌 Conectar a un dispositivo',
    unknownAction: 'Acción desconocida: {action}',
    cancelled: 'Cancelado.',
    help: `
Uso: adb-qc [opción]

Opciones:
  -q,  --qr             Emparejar un dispositivo con código QR
  -qc, --qr_connect     Emparejar y conectar un dispositivo con código QR
  -p,  --pair           Emparejar un dispositivo con código de vinculación
  -pc, --pair_connect   Emparejar y conectar un dispositivo con código de vinculación
  -c,  --connect        Conectar a un dispositivo emparejado
  -v,  --version        Mostrar información de la versión
  -h,  --help           Mostrar esta ayuda

Sin opciones, se muestra un menú interactivo.
Usa ADB_QC_LANG=en o ADB_QC_LANG=es para cambiar el idioma.
`,
  },
};

/**
 * Detects the language from ADB_QC_LANG, the locale environment variables or the system locale.
 * @param {Object} env - The environment variables.
 * @returns {string} 'es' or 'en'.
 */
function detectLanguage(env = process.env) {
  const locale = env.ADB_QC_LANG || env.LC_ALL || env.LC_MESSAGES || env.LANG ||
    Intl.DateTimeFormat().resolvedOptions().locale || '';
  const language = locale.toLowerCase().slice(0, 2);
  return messages[language] ? language : 'en';
}

const language = detectLanguage();

/**
 * Returns the translated message for the given key.
 * @param {string} key - The message key.
 * @param {Object} params - Values to replace in the message, e.g. {device: '192.168.1.10:5555'}.
 * @returns {string}
 */
function t(key, params = {}) {
  const message = messages[language][key] || messages.en[key] || key;
  return message.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match));
}

module.exports = { t, detectLanguage, messages };
