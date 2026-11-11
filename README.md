# RatApp 🐀

Dividí la cuenta con tus amigos: sacás foto del ticket, se separan los ítems, tildás quién comió qué y compartís un link con lo que le toca a cada uno. Se instala en el celular como una app.

## Qué hay en la carpeta

| Archivo | Para qué |
|---|---|
| `index.html` | La app completa (pantallas, cálculo, compartir, vista de amigos). |
| `firebase-config.js` | **Lo completás vos** con la config web de tu Firebase. |
| `api/scan.js` | Función de Vercel que lee el ticket con la API de Claude. La key nunca llega al celular. |
| `manifest.webmanifest`, `sw.js`, `icons/` | La hacen instalable y que abra sin señal. |
| `firestore.rules` | Reglas de seguridad de Firestore. |
| `vercel.json`, `package.json` | Configuración del deploy. |

## 1. Firebase (consola de Firebase)

1. Usá un proyecto tuyo, existente o nuevo.
2. **Authentication → Sign-in method → Anónimo → Habilitar.** Así tus amigos entran sin registrarse.
3. **Firestore Database → Crear base de datos** (modo producción). Después, en **Reglas**, pegá el contenido de `firestore.rules` y publicá.
4. **Configuración del proyecto → General → Tus apps → Agregar app web.** Copiá el objeto `firebaseConfig` y pegalo en `firebase-config.js`.
5. **Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada.** Se descarga un JSON. **No lo subas a GitHub**: va como variable de entorno en Vercel (paso 3).

## 2. API de Claude

En console.anthropic.com → API Keys → creá una key. Cargale algo de crédito: cada ticket cuesta centavos de dólar.

## 3. Vercel

1. Subí la carpeta a un repo de GitHub y en Vercel hacé **Add New → Project → Import**. Framework: **Other**. No hace falta build command.
2. En **Settings → Environment Variables** cargá:

| Variable | Valor |
|---|---|
| `ANTHROPIC_API_KEY` | tu key de Claude |
| `FIREBASE_SERVICE_ACCOUNT` | **el contenido completo** del JSON de la cuenta de servicio (pegalo tal cual) |
| `DAILY_SCAN_LIMIT` | opcional, lecturas por usuario por día (por defecto 30) |
| `ANTHROPIC_MODEL` | opcional, por defecto `claude-sonnet-5-5` (podés usar `claude-haiku-5-5` para que salga más barato) |

3. Deploy.
4. De vuelta en Firebase: **Authentication → Settings → Dominios autorizados → Agregar dominio** → tu dominio de Vercel (ej. `ratapp.vercel.app`).

## 4. Instalarla en el celular

- **Android (Chrome):** abrís el link y tocás **Instalar** arriba a la derecha (o menú ⋮ → *Instalar app*).
- **iPhone (Safari):** botón **Compartir → Agregar a inicio**. La app muestra el aviso la primera vez.

## Cómo funciona compartir

"Compartir link" guarda una foto de la cuenta en Firestore (`cuentas/{id}`) y genera `https://tu-dominio/?c=ID`. Quien abre el link ve el total de cada uno, el detalle de lo que comió y el alias para transferir, sin poder modificar nada. Si volvés a compartir la misma cuenta después de cambiarla, el link se actualiza.

## Seguridad

- La key de Claude vive solo en Vercel.
- `/api/scan` solo responde a usuarios autenticados en *tu* Firebase y tiene un tope diario por usuario (colección `usage`, que solo toca el servidor).
- Las cuentas compartidas se pueden leer conociendo el ID (12 caracteres al azar), pero nadie puede listarlas ni editarlas salvo quien las creó.
