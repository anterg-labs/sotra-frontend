// Abre una vez cada pantalla de SOTRA con una cuenta de prueba para que `next dev` ya las tenga compiladas.
// En desarrollo Next compila una ruta la primera vez que se visita (de 3 a 12 s); después responde en pocos milisegundos.
// Uso (con la aplicación y Keycloak levantados):
//   PRECALENTAR_CORREO=admin.prueba@sotra.test PRECALENTAR_CLAVE=... npm run precalentar
// Variables opcionales: PRECALENTAR_URL (por defecto http://localhost). No sirve para producción: allí las rutas ya vienen compiladas.

const BASE = (process.env.PRECALENTAR_URL ?? "http://localhost").replace(/\/$/, "");
const CORREO = process.env.PRECALENTAR_CORREO;
const CLAVE = process.env.PRECALENTAR_CLAVE;

const RUTAS = [
  "/inicio", "/reportes",
  "/ordenes-trabajo", "/ordenes-trabajo/nuevo",
  "/clientes", "/clientes/nuevo",
  "/activos", "/activos/nuevo", "/activos/modelos", "/activos/modelos/nuevo", "/activos/tipos", "/activos/tipos/nuevo",
  "/repuestos", "/repuestos/nuevo", "/repuestos/movimientos",
  "/documentacion-tecnica", "/documentacion-tecnica/nuevo",
  "/usuarios", "/usuarios/nuevo",
  "/tecnico",
  "/configuracion", "/configuracion/terminos",
];

if (!CORREO || !CLAVE) {
  console.error("Faltan PRECALENTAR_CORREO y PRECALENTAR_CLAVE (una cuenta de prueba del realm sotra).");
  process.exit(1);
}

/** Cookies por servidor (host:puerto). Alcanza para el flujo de inicio de sesión; no distingue rutas ni vencimientos. */
const cookies = new Map();

function guardarCookies(url, respuesta) {
  const clave = new URL(url).host;
  const actuales = cookies.get(clave) ?? new Map();
  for (const linea of respuesta.headers.getSetCookie()) {
    const [par] = linea.split(";");
    const igual = par.indexOf("=");
    actuales.set(par.slice(0, igual).trim(), par.slice(igual + 1));
  }
  cookies.set(clave, actuales);
}

function encabezadoCookie(url) {
  const actuales = cookies.get(new URL(url).host);
  return actuales ? [...actuales].map(([nombre, valor]) => nombre + "=" + valor).join("; ") : "";
}

/** Sigue las redirecciones a mano para conservar las cookies de cada servidor (la app y Keycloak). */
async function pedir(url, opciones = {}) {
  let actual = url;
  let metodo = opciones.method ?? "GET";
  let cuerpo = opciones.body;
  for (let salto = 0; salto < 15; salto++) {
    const respuesta = await fetch(actual, {
      method: metodo,
      body: cuerpo,
      redirect: "manual",
      headers: { cookie: encabezadoCookie(actual), ...(cuerpo ? { "content-type": "application/x-www-form-urlencoded" } : {}) },
    });
    guardarCookies(actual, respuesta);
    const destino = respuesta.headers.get("location");
    if (respuesta.status >= 300 && respuesta.status < 400 && destino) {
      actual = new URL(destino, actual).toString();
      metodo = "GET";
      cuerpo = undefined;
      continue;
    }
    return { respuesta, url: actual };
  }
  throw new Error("Demasiadas redirecciones desde " + url);
}

async function iniciarSesion() {
  const { respuesta, url } = await pedir(BASE + "/login?destino=%2Finicio");
  const html = await respuesta.text();
  const accion = html.match(/action="([^"]+)"/)?.[1]?.replaceAll("&amp;", "&");
  if (!accion) throw new Error("No se encontró el formulario de Keycloak en " + url + ". ¿Están levantados la aplicación y Keycloak?");
  const datos = new URLSearchParams({ username: CORREO, password: CLAVE, credentialId: "" });
  const { respuesta: final, url: urlFinal } = await pedir(new URL(accion, url).toString(), { method: "POST", body: datos.toString() });
  if (!urlFinal.startsWith(BASE)) throw new Error("Las credenciales no son válidas o Keycloak rechazó el ingreso.");
  await final.arrayBuffer();
}

await iniciarSesion();
console.log("Sesión iniciada con " + CORREO + ". Compilando " + RUTAS.length + " pantallas…");

let lentas = 0;
for (const ruta of RUTAS) {
  const inicio = performance.now();
  const { respuesta } = await pedir(BASE + ruta);
  await respuesta.arrayBuffer();
  const ms = Math.round(performance.now() - inicio);
  if (ms > 1000) lentas++;
  console.log(String(respuesta.status).padEnd(4) + String(ms).padStart(6) + " ms  " + ruta);
}
console.log("Listo: " + lentas + " pantallas tardaron más de 1 s (compilación). Ahora se abren sin esperar.");
