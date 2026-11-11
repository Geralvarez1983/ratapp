# RatApp 🐀

Dividí la cuenta con tus amigos: sacás foto del ticket, se separan los ítems, tildás quién comió qué y compartís un link con lo que le toca a cada uno. Se instala en el celular como una app.

## Qué hay en la carpeta

| Archivo | Para qué |
|---|---|
| `index.html` | La app completa (pantallas, cálculo, compartir, vista de amigos). |
| `firebase-config.js` | **Lo completás vos** con la config web de tu Firebase. |
| `api/scan.js` | (Opcional, sin uso) función para leer el ticket con una IA paga si algún día querés más precisión. |
| `manifest.webmanifest`, `sw.js`, `icons/` | La hacen instalable y que abra sin señal. |
| `firestore.rules` | Reglas de seguridad de Firestore. |
| `vercel.json`, `package.json` | Configuración del deploy. |

## 1. Firebase (consola de Firebase)

1. Usá un proyecto tuyo, existente o nuevo.
2. **Authentication → Sign-in method → Anónimo → Habilitar.** Así tus amigos entran sin registrarse.
3. **Firestore Database → Crear base de datos** (modo producción). Después, en **Reglas**, pegá el contenido de `firestore.rules` y publicá.
4. **Configuración del proyecto → General → Tus apps → Agregar app web.** Copiá el objeto `firebaseConfig` y pegalo en `firebase-config.js`.

## 2. Lectura del ticket

Es gratis y corre en el propio celular (Tesseract.js): no hace falta ninguna key. La primera lectura descarga el lector (~10 MB) y después queda guardado.

## 3. Vercel

1. Subí la carpeta a un repo de GitHub y en Vercel hacé **Add New → Project → Import**. Framework: **Other**. No hace falta build command.
2. En **Settings → Environment Variables** cargá:

| Variable | Valor |
|---|---|
| `FIREBASE_PROJECT_ID` | el ID de tu proyecto de Firebase (ej. `btc-tracker-ce874`) |

3. Deploy.
4. De vuelta en Firebase: **Authentication → Settings → Dominios autorizados → Agregar dominio** → tu dominio de Vercel (ej. `ratapp.vercel.app`).

## 4. Instalarla en el celular

- **Android (Chrome):** abrís el link y tocás **Instalar** arriba a la derecha (o menú ⋮ → *Instalar app*).
- **iPhone (Safari):** botón **Compartir → Agregar a inicio**. La app muestra el aviso la primera vez.

## Cómo funciona compartir

"Compartir link" guarda una foto de la cuenta en Firestore (`cuentas/{id}`) y genera `https://tu-dominio/?c=ID`. Quien abre el link ve el total de cada uno, el detalle de lo que comió y el alias para transferir, sin poder modificar nada. Si volvés a compartir la misma cuenta después de cambiarla, el link se actualiza.

## Seguridad

- `/api/scan` solo responde a usuarios autenticados en *tu* Firebase (verifica el token con las claves públicas de Google, sin clave secreta).
- Las cuentas compartidas se pueden leer conociendo el ID (12 caracteres al azar), pero nadie puede listarlas ni editarlas salvo quien las creó.
