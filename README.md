# sotra-frontend

La versión 1.0.15 muestra en el alta de usuarios el resultado del correo informado por la API (`correoDeContrasenaEnviado`) y acepta teléfonos de ocho dígitos o nueve con cero inicial. El aviso de fallo indica cómo reenviar el enlace desde el detalle del usuario.

## Corrección de integración con Keycloak

Desde 1.0.13, Next.js y `eslint-config-next` están fijados en 16.4.1 para corregir el bloqueo de seguridad que Trivy detectó sobre Next.js 16.3.8. La versión 1.0.14 completa el lockfile con las dependencias necesarias para Linux y CI. Se regeneró sin reutilizar `node_modules`, con npm 11.19.0, y se comprobó mediante `npm ci --dry-run --ignore-scripts --os=linux --cpu=x64`. Los controles del CI siguen habilitados.

Desde 1.0.12, el proxy conserva la sesión de Auth.js y agrega una CSP efectiva con un nonce nuevo por solicitud. También cubre `/login`, sus errores, `/logout` y `/sin-conexion`, sin exigirles sesión. El origen de Keycloak está permitido para completar las redirecciones de login y logout. El layout usa renderizado por solicitud para conservar el nonce; se retira la política anterior de solo reporte y se mantienen las demás cabeceras y protecciones de la imagen Docker. La prueba del reenvío multipart corre en Node, que implementa los flujos de archivos usados por el Route Handler.

Frontend de SOTRA. Usa la API que indica `API_URL` (en desarrollo, `http://localhost:8081`) e inicia sesión con Keycloak (`http://localhost:9080`, realm `sotra`). Necesita el backend y Keycloak levantados (`compose.yml` del backend).

## Requisitos

### Linux

Docker Engine con el plugin `docker compose`. El usuario debe pertenecer al grupo `docker` (`sudo usermod -aG docker $USER` y volver a iniciar sesión).

### Windows

Docker Desktop. Los comandos `docker compose` son los mismos; se pueden ejecutar desde PowerShell o Git Bash.

## Desarrollo

Copiar `.env.dev.example` como `.env.dev`, completar `AUTH_SECRET` (ver [Variables de entorno](#variables-de-entorno)) y luego levantar el servicio.

Linux:

```bash
cp .env.dev.example .env.dev
docker compose up -d --build sotra-frontend-dev
```

Windows (PowerShell):

```powershell
Copy-Item .env.dev.example .env.dev
docker compose up -d --build sotra-frontend-dev
```

La primera vez, `--build` construye la imagen. Las veces siguientes no hace falta: alcanza con `docker compose up -d sotra-frontend-dev`, salvo que cambies `package.json` o los Dockerfiles, en cuyo caso hay que volver a agregar `--build`.

Se abre en http://localhost (puerto 80). La carpeta del proyecto está montada dentro del contenedor, así que al guardar un cambio solo hay que refrescar la página; no hace falta reconstruir ni reiniciar el contenedor.

Las versiones de frontend y backend se muestran solamente en el pie de página. La versión del backend se consulta en `GET /api/v1/version` y muestra "Cargando..." o "No disponible" según corresponda.

El logo del menú se sirve desde `public/images/logo-cvm.png` mediante la ruta `/images/logo-cvm.png`. Sus dimensiones originales se indican en el componente para conservar la proporción; la ruta pública permite comprobar tipos antes de generar los archivos de Next.js en CI.

Sin Docker, con `npm run dev`, se abre en http://localhost:3000.

## Inicio de sesión (Keycloak)

Toda la aplicación exige sesión. Sin sesión, cualquier página manda a la pantalla de login de Keycloak (en español, «SOTRA») y, al volver, a la página que se había pedido. Esa pantalla tiene el mismo diseño que tenía el login del frontend: es el tema `sotra` de Keycloak, que vive en el backend (`keycloak/themes/sotra`, ver su README). La recuperación de contraseña también es de Keycloak («¿Has olvidado tu contraseña?»).

### Cómo funciona

- **Sesión del lado del servidor con [Auth.js](https://authjs.dev) v5** (`src/auth.ts`). Usa el cliente público `sotra-frontend` de Keycloak con Authorization Code + PKCE (`S256`), sin secreto de cliente. La sesión vive en una cookie cifrada (`authjs.session-token`); el token de acceso, el refresh token y el id_token **nunca llegan al navegador** ni se guardan en `localStorage`.
- **Proxy** (`src/proxy.ts`, el middleware de Next 16): corre antes de cada página, Server Action y pedido a `/api/v1`. Sin sesión redirige a `/login?destino=...` (o responde `401` en `/api/v1`). Si el token de acceso (dura 5 minutos) está por vencer, lo renueva con el refresh token y guarda la cookie nueva. Si la página exige un rol que el usuario no tiene, muestra «No tenés permiso para realizar esta acción.» con estado `403`.
- **Pedidos del servidor** (Server Components y Server Actions, `src/servicios/servidor/*`): `cliente-http-servidor.ts` agrega `Authorization: Bearer <token>` (lo lee de la cookie con `token-acceso.ts`). Un `401` de la API manda a iniciar sesión de nuevo.
- **Pedidos del navegador** (selectores, subidas de evidencias y documentos, sugerencia de IA): van al mismo origen, `/api/v1/...`. El route handler `src/app/api/v1/[...ruta]/route.ts` los reenvía a la API con el token de la sesión (patrón *backend for frontend*). Por eso los enlaces de descarga de documentos técnicos, evidencias y reportes PDF/CSV siguen siendo `<a href="/api/v1/...">`: el navegador manda la cookie y el reenvío agrega el token.
- **Keycloak dentro de Docker**: el navegador va siempre a `KEYCLOAK_EMISOR` (`http://localhost:9080`). El servidor de Next no llega ahí desde el contenedor, así que los pedidos de servidor a servidor (descubrimiento, token, renovación) se reescriben a `KEYCLOAK_URL_INTERNA` (`http://host.docker.internal:9080`). El emisor de los tokens sigue siendo `http://localhost:9080/realms/sotra`.
- **Usuario en sesión**: el layout raíz pide `GET /api/v1/sesion` y lo comparte con los componentes (`src/componentes/sesion/contexto-sesion.tsx`). El encabezado muestra el nombre, el correo y el rol. Si el usuario existe en Keycloak pero no en SOTRA (`idUsuario` nulo) o no tiene roles de SOTRA, se muestra «Tu usuario no tiene acceso a SOTRA. Contactá al administrador.» con un botón para cerrar sesión.
- **Roles**: `src/seguridad/permisos.ts` copia la matriz de la API (`Api/Seguridad/PoliticasDeAcceso.cs`; ante una diferencia, manda el backend). Con ella se filtran el menú, las pantallas (en el proxy) y los botones (`SiTienePermiso`, `useTienePermiso`). La página de inicio (`/`) depende del rol: reportes (administrador y jefe), «Mi trabajo» (técnico) o repuestos (pañolero).
- **Técnico**: ve solo las órdenes que tiene asignadas (la API lo aplica también: una orden ajena responde `403`). Por defecto usa la vista para el celular en todas sus secciones, y `/ordenes-trabajo` lo lleva a «Mi trabajo». Con «Escritorio» (en la cabecera) pasa a la vista de escritorio, con el listado y el detalle de órdenes; «Vista móvil» lo devuelve. La elección se guarda en la cookie `sotra-vista` (`src/app/vista/route.ts`), que leen el proxy y el layout.
- **Jefe de mantenimiento**: crea, modifica, da de baja y restablece la contraseña de usuarios, pero no puede asignar el rol Administrador ni modificar a un administrador (la API responde `403` con `SOLO_ADMINISTRADOR`).
- **Cerrar sesión**: `POST /logout` borra la cookie y redirige al logout de Keycloak con `id_token_hint` y `post_logout_redirect_uri=http://localhost/`, así que también termina la sesión de Keycloak. Al volver, pide usuario y contraseña de nuevo.
- **Error al iniciar sesión** (`/login/error`, la página de error de Auth.js): pasa, por ejemplo, al volver con «Atrás» hasta la pantalla de Keycloak ya usada. Con la sesión vigente lleva al inicio; si no, ofrece volver a iniciar sesión.
- **Errores**: `401` vuelve a iniciar sesión; `403` muestra «No tenés permiso para realizar esta acción.»; el resto muestra el `mensaje` de la API (por ejemplo, `502 KEYCLOAK_NO_DISPONIBLE` en la gestión de usuarios).
- **Gestión de usuarios**: el alta y la edición no piden contraseña. Al dar de alta, Keycloak le envía al usuario un correo para elegirla. En el detalle del usuario, «Restablecer contraseña» (`POST /api/v1/usuarios/{id}/restablecer-contrasena`) reenvía ese correo; un `409` (`USUARIO_SIN_ACCESO` o `USUARIO_INACTIVO`) muestra el mensaje de la API.

### Variables de entorno

| Variable | Ejemplo (desarrollo) | Para qué |
|---|---|---|
| `AUTH_SECRET` | (generado) | Cifra la cookie de sesión. Obligatoria, propia de cada entorno y secreta. Se genera con `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`. Si cambia, se cierran todas las sesiones. |
| `AUTH_URL` | `http://localhost` | Dirección pública del frontend. Con `https://...` la cookie pasa a ser `__Secure-`. Tiene que coincidir con las redirecciones del cliente `sotra-frontend` (`http://localhost/*`). |
| `KEYCLOAK_EMISOR` | `http://localhost:9080/realms/sotra` | Emisor de los tokens y dirección del login para el navegador. |
| `KEYCLOAK_URL_INTERNA` | `http://host.docker.internal:9080` | Dirección de Keycloak desde el servidor de Next (dentro de Docker). Vacía fuera de Docker. |
| `KEYCLOAK_CLIENTE` | `sotra-frontend` | Cliente público de Keycloak. |
| `API_URL` / `API_URL_INTERNA` | `http://localhost:8081` / `http://host.docker.internal:8081` | La API. El navegador ya no la llama directo: todo pasa por el servidor de Next. |

Si se sirve el frontend en otra dirección que no sea `http://localhost`, hay que agregarla en el cliente `sotra-frontend` de Keycloak (redirecciones y post-logout) y cambiar `AUTH_URL`.

## Producción

El servicio `sotra-frontend-prod` compila la aplicación con el `Dockerfile` de producción. La URL de la API se escribe en el momento de compilar, así que hay que indicarla antes de construir la imagen.

1. Iniciar sesión una vez en el registro de las imágenes base: `docker login dhi.io`.
2. Crear el archivo `.env` junto a `compose.yaml` a partir de `.env.example`: `API_URL` (se usa al construir) y las variables de sesión y Keycloak (`AUTH_SECRET`, `AUTH_URL`, `KEYCLOAK_*`), que se leen al ejecutar el contenedor.

Linux (y después completar `AUTH_SECRET` y las direcciones):

```bash
cp .env.example .env
```

Windows (PowerShell):

```powershell
Copy-Item .env.example .env
```

3. Construir y levantar:

```bash
docker compose up -d --build sotra-frontend-prod
```

Se abre en http://localhost (puerto 80). Usa el mismo puerto que `sotra-frontend-dev`, así que no pueden estar levantados a la vez; para pasar de uno a otro: `docker compose down`.

Si cambia `API_URL` hay que volver a construir con `--build`, porque la URL queda dentro de la imagen. Si la pantalla muestra "La URL de la API no está configurada", falta el `.env` o se construyó sin él.

## Pruebas y lint

### Pruebas unitarias y sesión

`npm run test:run` no necesita Keycloak. En `vitest.setup.ts` la sesión está simulada: sin `ProveedorSesion`, los componentes ven a un administrador (todos los permisos) y el servidor usa un token fijo (`src/pruebas/sesion-de-pruebas.ts`). Las pruebas de sesión y de roles anulan esos mocks con `vi.unmock(...)` y usan lo real. Para probar un rol en un componente, se envuelve con `<ProveedorSesion usuario={usuarioDePruebas(["tecnico"])}>`.

### Pruebas de extremo a extremo (Playwright) con sesión

Necesitan la pila completa levantada (frontend, backend, base y Keycloak) y un usuario **administrador** de prueba de Keycloak que también esté en SOTRA. El proyecto `sesion` (`e2e/sesion.setup.ts`) inicia sesión una vez en la pantalla de Keycloak y guarda la cookie en `e2e/.auth/sesion.json` (no se versiona). Las demás pruebas reutilizan esa sesión, también para crear sus datos por `/api/v1` del frontend.

```bash
SOTRA_E2E_USUARIO=admin.prueba@sotra.test SOTRA_E2E_CONTRASENA='<contraseña>' npx playwright test
```

- `SOTRA_E2E_TECNICO_ID` (por defecto `30`, `tecnico.prueba@sotra.test`): técnico al que se asignan las órdenes de prueba. No se crean técnicos nuevos, porque cada alta envía un correo real.
- La prueba que da de alta un usuario por la interfaz se saltea salvo con `SOTRA_E2E_ENVIAR_CORREOS=1`, porque envía un correo real.
- Los casos de `e2e-casos/` (Bugasura) todavía no inician sesión: para correrlos hay que agregarles el mismo proyecto `sesion`. Los de usuarios cargan contraseñas y crean usuarios (correos reales), así que hay que reescribirlos.


```bash
docker compose --profile tools run --rm sotra-frontend-test
docker compose --profile tools run --rm sotra-frontend-lint
docker exec sotra-frontend-dev npm run test:run
```

La imagen de desarrollo usa Node 26.12.1 con su Web Storage experimental desactivada para que las pruebas usen `localStorage` de jsdom. El `Dockerfile` de producción usa la misma versión corregida; `.nvmrc` fija Node 24.22.1 para CI y ejecución directa. Estas versiones corrigen CVE-2026-111497. Al actualizarlas, reconstruir la imagen, recrear el contenedor y verificar `node -v` dentro de él. El navegador conserva su propio almacenamiento local.

## Detener

```bash
docker compose down
```
