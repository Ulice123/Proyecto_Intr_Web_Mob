# EventPass – Control de Acceso (Equipo 03)

Aplicación web y móvil (Angular + Capacitor) para el control de acceso de entradas EventPass.
La aplicación no decide localmente si una entrada es válida: siempre consulta al Gateway mediante `POST /api/entradas/{codigo}/validar`.

## Requisitos

- **Node.js** `>= 20` y **npm**
- **Android Studio** (con Android SDK) solo para compilar la APK de Android

## Desarrollo local

1. Instalar dependencias:
   ```bash
   npm ci
   ```
2. Iniciar el servidor de desarrollo:
   ```bash
   npm start
   ```
   La aplicación queda disponible en `http://localhost:4200`.

### Gateway simulado (modo mock)

En `src/environments/environment.ts` (`mock: true`), un interceptor HTTP simula las respuestas del Gateway con los siguientes códigos de prueba:

- `EP-A1B2C3D4`, `EP-TEST0001`, `EP-TEST0002`, `EP-TEST0003`: devuelven `200 OK` (**ACCESO AUTORIZADO**) en la primera lectura y `409 Conflict` (**Entrada ya utilizada**) en lecturas posteriores.
- `EP-CAIDA`: simula un fallo de red (`status: 0`, **ERROR DE CONEXIÓN**).
- Cualquier otro código: devuelve `404 Not Found` (**Entrada no encontrada**).

## Configurar la URL del Gateway

La URL del Gateway se resuelve en el siguiente orden:

1. **En tiempo de ejecución (`config.json`):** al iniciar, la aplicación lee `config.json` (ubicado en `public/config.json`). Si `gatewayUrl` tiene un valor no vacío, sobrescribe la configuración por defecto.
2. **Variable de entorno `GATEWAY_URL` (Railway / `start:prod`):** al ejecutar `npm run start:prod`, si `GATEWAY_URL` está definida en el entorno, el script `scripts/write-config.mjs` escribe su valor en `dist/eventpass-acceso/browser/config.json` antes de iniciar el servidor estático.
3. **Compilación (`src/environments/environment.prod.ts`):** valor de respaldo (`environment.gatewayUrl`) usado en la APK de Android o cuando `config.json` está vacío o no está disponible.

## Pruebas

Ejecutar las pruebas unitarias con:

```bash
npx ng test --watch=false
```

## Generar APK (Android)

1. Compilar la aplicación en modo producción y sincronizar con el proyecto Android:
   ```bash
   npm run build:prod
   npx cap sync android
   ```
2. Compilar la APK de depuración:
   ```bash
   cd android && ./gradlew assembleDebug
   ```
   (En Windows: `cd android && gradlew assembleDebug`)

   La APK se genera en:
   ```text
   android/app/build/outputs/apk/debug/app-debug.apk
   ```
3. También es posible abrir el proyecto en Android Studio con:
   ```bash
   npx cap open android
   ```

> **Nota:** Para entornos de prueba donde el Gateway utilice `http://`, el proyecto Android incluye `android/app/src/main/res/xml/network_security_config.xml` y `android:usesCleartextTraffic="true"` en `AndroidManifest.xml`. Para producción se recomienda usar `https://`.

## Despliegue en Railway

Parámetros de configuración para el despliegue web:

```text
Repositorio: https://github.com/Ulice123/Proyecto_Intr_Web_Mob.git
Rama: main
Compilación: npm ci && npm run build:prod
Ejecución: npm run start:prod
Puerto: variable PORT (por defecto 8080)
URL del Gateway: variable GATEWAY_URL = <pendiente>
```

### Nota de CORS para el equipo del Gateway

El Gateway debe habilitar CORS permitiendo:

- El origen público del despliegue en **Railway** (por ejemplo `https://<tu-app>.up.railway.app`).
- El origen **`https://localhost`** utilizado por defecto por Capacitor en Android.

## Diagrama de secuencia

El diagrama UML del flujo de lectura y validación se encuentra en [docs/secuencia.puml](docs/secuencia.puml).
