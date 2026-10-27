# ADB Quick Connect (adb-qc)

[English](README.md) | **Español**

[![npm Version](https://img.shields.io/npm/v/adb-qc.svg)](https://www.npmjs.com/package/adb-qc)
[![npm total downloads](https://img.shields.io/npm/dt/adb-qc.svg)](https://www.npmjs.com/package/adb-qc)
[![CI](https://github.com/AngelKrak/adb-qc/actions/workflows/ci.yml/badge.svg)](https://github.com/AngelKrak/adb-qc/actions/workflows/ci.yml)
[![License](https://img.shields.io/npm/l/adb-qc.svg)](https://www.npmjs.com/package/adb-qc)

![Portada](https://raw.githubusercontent.com/AngelKrak/adb-qc/main/screens/screen.jpg)

**ADB Quick Connect (adb-qc)** es una herramienta que simplifica la conexión y emparejamiento de dispositivos Android con ADB (Android Debug Bridge) a través de Wi-Fi. Permite realizar emparejamientos utilizando códigos QR o códigos de emparejamiento, y también conectar a dispositivos disponibles en la red.

## Características

-  **Emparejamiento con Código QR**: Facilita el emparejamiento de dispositivos utilizando códigos QR.

-  **Emparejamiento con Código de Emparejamiento**: Permite emparejar dispositivos utilizando un código de emparejamiento.

-  **Conexión a Dispositivos**: Conecta a dispositivos disponibles en la red.

-  **Conexión automática**: Después de emparejar, puede conectarse al dispositivo sin pasos extra.

## Requisitos

-  [Node.js](https://nodejs.org/) 18 o superior.
-  [Android SDK Platform-Tools](https://developer.android.com/tools/releases/platform-tools) **versión 30 o superior** (`adb` debe estar en tu `PATH`). Puedes revisar tu versión con `adb version`.
-  Un dispositivo con **Android 11 o superior** (la depuración inalámbrica no existe en versiones anteriores).
-  La computadora y el dispositivo deben estar conectados a la **misma red Wi-Fi**.

## Instalación

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

## Uso

Una vez instalado globalmente, puedes ejecutar la herramienta desde la línea de comandos con diferentes opciones:

### Opciones de Línea de Comandos

-  `--qr` o `-q`: Muestra un código QR para el emparejamiento.

-  `--qr_connect` o `-qc`: Muestra un código QR para el emparejamiento y se conecta automáticamente al dispositivo sin necesidad de usar posteriormente --connect.

-  `--pair` o `-p`: Empareja un dispositivo utilizando un código de emparejamiento.

-  `--pair_connect` o `-pc`: Empareja un dispositivo utilizando un código de emparejamiento y se conecta automáticamente al dispositivo sin necesidad de usar posteriormente --connect.

-  `--connect` o `-c`: Conecta a un dispositivo disponible en la red.

-  `--version` o `-v`: Muestra la versión de adb-qc, Node.js y adb.

-  `--help` o `-h`: Muestra la ayuda con todas las opciones.

### Idioma

Los mensajes se muestran en español o en inglés según el idioma de tu sistema. Para elegirlo manualmente usa la variable `ADB_QC_LANG`:

```sh
ADB_QC_LANG=en adb-qc
```

### Ejemplos

1.  **Mostrar Código QR para Emparejamiento**:

Ejecuta el comando `adb-qc --qr` para mostrar un código QR.

![Código QR para Emparejamiento](https://vhs.charm.sh/vhs-4iiq5ybKctFNXgxDnXDeqd.gif)

2.  **Emparejar Dispositivo con Código de Emparejamiento**:

Ejecuta el comando `adb-qc --pair` para emparejar un dispositivo utilizando un código de emparejamiento.

![Emparejamiento con Código](https://vhs.charm.sh/vhs-6FRxCcsYVjveqvYjEoWXdj.gif)

3.  **Conectar a un Dispositivo**:

Ejecuta el comando `adb-qc --connect` para conectar a un dispositivo disponible en la red.

![Conectar a un Dispositivo](https://vhs.charm.sh/vhs-27uAI0Gg2wpaaP2TyI46y8.gif)

4.  **Si no se proporcionan parámetros**, se te pedirá que selecciones una acción a través de un menú interactivo.

![Menú Interactivo](https://vhs.charm.sh/vhs-5DpJ6W8kiegOobcDi2li3B.gif)

## Cómo Habilitar la Depuración Inalámbrica

Para utilizar **ADB Quick Connect**, necesitas habilitar la depuración inalámbrica en tu dispositivo Android. Sigue estos pasos:

1. **Habilitar las Opciones de Desarrollador**:
   - Ve a **Configuración** en tu dispositivo Android.
   - Desplázate hacia abajo y selecciona **Acerca del teléfono**.
   - Busca el **Número de compilación** y tócalo siete veces. Verás un mensaje indicando que ahora eres un desarrollador.

2. **Activar la Depuración Inalámbrica**:
   - Regresa a **Configuración** y selecciona **Sistema**.
   - Toca **Avanzado** y luego **Opciones de desarrollador**.
   - Activa **Depuración inalámbrica** (puede que esté en una sección diferente dependiendo del fabricante).

3. **Conectar a la Red Wi-Fi**:
   - Asegúrate de que tu dispositivo esté conectado a la misma red Wi-Fi que tu computadora.

   ![Habilitar Depuración Inalámbrica](https://raw.githubusercontent.com/AngelKrak/adb-qc/main/screens/developer-settings.jpg)

4. **Emparejar el Dispositivo**:
   - Usa **ADB Quick Connect** para mostrar un código QR o ingresar un código de emparejamiento.

   ![Emparejar dispositivo](https://raw.githubusercontent.com/AngelKrak/adb-qc/main/screens/wireless-debugging.jpg)

## Cómo Funciona

1.  **Generación de Identificadores**: La herramienta genera un nombre único y una contraseña para el emparejamiento.

2.  **Descubrimiento de Dispositivos**: Utiliza `mDNS` para descubrir dispositivos disponibles para emparejamiento o conexión.

3.  **Emparejamiento con QR o Código**: Dependiendo de la opción seleccionada, muestra un código QR o solicita un código de emparejamiento.

4.  **Conexión**: Permite conectar a dispositivos disponibles en la red.

## Solución de Problemas

### `error: unknown host service` al emparejar

El servidor de adb que está corriendo es una versión antigua que no soporta emparejamiento (por ejemplo, el adb que trae **Genymotion**). adb-qc intenta reiniciar el servidor automáticamente, pero si otra aplicación lo vuelve a iniciar, configúrala para que use tu adb:

-  **Genymotion**: ve a **Settings → ADB**, selecciona **Use custom Android SDK tools** y escribe la ruta de tu Android SDK (por ejemplo `~/Library/Android/sdk` en macOS). Después cierra Genymotion, ejecuta `adb kill-server` y vuelve a abrirlo.

### No se encuentra ningún dispositivo

-  Verifica que la computadora y el dispositivo estén en la misma red Wi-Fi.
-  Algunas redes (de oficinas, escuelas o redes de invitados) bloquean mDNS, que se usa para encontrar los dispositivos.
-  Para emparejar con código, deja abierta en el teléfono la ventana **Vincular dispositivo con código de vinculación** mientras usas adb-qc.

### El emparejamiento funciona pero no conecta

Las versiones recientes de adb conectan automáticamente los dispositivos emparejados. Revisa con `adb devices` si ya aparece; si no, ejecuta `adb-qc --connect`.

## Desarrollo

```sh
git clone https://github.com/AngelKrak/adb-qc.git
cd adb-qc
npm install
npm link   # para usar el comando adb-qc con tu copia local
npm test   # ejecuta las pruebas
npm run lint   # revisa el estilo del código con ESLint
```

## Contribuciones

¡Las contribuciones son bienvenidas! Si tienes ideas para mejoras o encuentras errores, no dudes en abrir un **issue** o enviar un **pull request**.

# License

ADB Quick Connect is licensed under the [MIT license](https://github.com/AngelKrak/adb-qc/blob/main/LICENSE) © [Angel Ramirez](https://github.com/AngelKrak/)

