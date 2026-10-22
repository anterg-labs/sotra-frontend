/**
 * Base de los pedidos que salen del navegador. El navegador nunca habla directo con la API: pide al mismo origen
 * (`/api/v1/...`) y el route handler `src/app/api/v1/[...ruta]` reenvía el pedido a la API con el token de la sesión.
 * Así el token no llega al navegador y los enlaces de descarga (`<a href>`) también van autenticados.
 */
export function obtenerUrlBaseApi(): string {
  return "";
}

/**
 * URL base de la API para código que corre en el servidor de Next (Server Components, Server Actions y el reenvío
 * de `/api/v1`). Dentro de Docker el servidor de Next no llega a la API por `localhost:8081`, así que
 * `API_URL_INTERNA` apunta a la dirección alcanzable desde el contenedor. Si no está definida se usa `API_URL`.
 */
export function obtenerUrlBaseApiServidor(): string {
  const urlBaseApi = process.env.API_URL_INTERNA || process.env.API_URL;

  if (!urlBaseApi) {
    throw new Error("La URL de la API no está configurada.");
  }

  return urlBaseApi.replace(/\/$/, "");
}

export const MENSAJE_SIN_PERMISO = "No tenés permiso para realizar esta acción.";
export const MENSAJE_SESION_VENCIDA = "Tu sesión venció. Volvé a iniciar sesión.";

/** Encabezado que agrega el proxy con la página pedida, para volver a ella si hay que iniciar sesión de nuevo. */
export const ENCABEZADO_RUTA_PEDIDA = "x-sotra-ruta";

/** Página que inicia sesión en Keycloak y después vuelve a `destino` (una ruta de esta aplicación). */
export function rutaDeInicioDeSesion(destino: string) {
  return "/login?destino=" + encodeURIComponent(destino);
}

/** Solo rutas internas (`/algo`): evita que `destino` mande a otro sitio después del login. */
export function esDestinoInterno(destino: string | null | undefined): destino is string {
  return typeof destino === "string" && destino.startsWith("/") && !destino.startsWith("//") && !destino.startsWith("/\\");
}

export class ErrorDeApi extends Error {
  constructor(mensaje: string, public readonly codigo: string | null, public readonly estadoHttp: number) {
    super(mensaje);
    this.name = "ErrorDeApi";
  }
}

/**
 * 401 llega sin cuerpo y se traduce a un mensaje fijo. 403 también, salvo las reglas propias de la API (por ejemplo,
 * `SOLO_ADMINISTRADOR`), que traen `{ codigo, mensaje }` como el resto de los errores.
 */
export async function leerErrorDelServidor(respuesta: Response, mensajePredeterminado: string) {
  if (respuesta.status === 401) return new ErrorDeApi(MENSAJE_SESION_VENCIDA, "SESION_VENCIDA", 401);
  if (respuesta.status === 403) {
    const error = await leerCuerpoDeError(respuesta, MENSAJE_SIN_PERMISO);
    return new ErrorDeApi(error.message, error.codigo ?? "SIN_PERMISO", 403);
  }
  return leerCuerpoDeError(respuesta, mensajePredeterminado);
}

async function leerCuerpoDeError(respuesta: Response, mensajePredeterminado: string) {
  try {
    const cuerpo: unknown = await respuesta.json();
    if (typeof cuerpo !== "object" || cuerpo === null) return new ErrorDeApi(mensajePredeterminado, null, respuesta.status);
    const datos = cuerpo as Record<string, unknown>;
    const mensaje = typeof datos.mensaje === "string" && datos.mensaje !== "" ? datos.mensaje : mensajePredeterminado;
    const codigo = typeof datos.codigo === "string" ? datos.codigo : null;
    return new ErrorDeApi(mensaje, codigo, respuesta.status);
  } catch {
    return new ErrorDeApi(mensajePredeterminado, null, respuesta.status);
  }
}

/** En el navegador, un 401 significa que la sesión venció: se vuelve a iniciar sesión y se regresa a la misma página. */
export function volverAIniciarSesion() {
  if (typeof window === "undefined") return;
  window.location.assign(rutaDeInicioDeSesion(window.location.pathname + window.location.search));
}

export async function enviarPedidoApi(ruta: string, opciones: RequestInit, mensajeError: string) {
  const urlBaseApi = obtenerUrlBaseApi();
  const respuesta = await fetch(urlBaseApi + ruta, opciones);

  if (!respuesta.ok) {
    if (respuesta.status === 401) volverAIniciarSesion();
    throw await leerErrorDelServidor(respuesta, mensajeError);
  }

  return respuesta;
}

export async function leerDatosApi(ruta: string, opciones: RequestInit, mensajeError: string) {
  const respuesta = await enviarPedidoApi(ruta, opciones, mensajeError);
  const datos = await respuesta.json();
  return datos;
}

export async function leerTodasLasPaginas(ruta: string, mensajeError: string) {
  const elementos = [];
  let pagina = 1;
  let totalPaginas = 1;

  while (pagina <= totalPaginas) {
    const rutaDeLaPagina = ruta + "?pagina=" + pagina + "&tamanoPagina=100";
    const respuesta = await leerDatosApi(rutaDeLaPagina, { cache: "no-store" }, mensajeError);
    for (const elemento of respuesta.elementos) {
      elementos.push(elemento);
    }
    totalPaginas = respuesta.totalPaginas;
    pagina = pagina + 1;
  }

  return elementos;
}

export async function leerPagina(ruta: string, parametros: URLSearchParams, mensajeError: string) {
  const rutaConParametros = ruta + "?" + parametros.toString();
  const respuesta = await leerDatosApi(rutaConParametros, { cache: "no-store" }, mensajeError);
  return respuesta;
}

export function crearOpcionesJson(metodo: string, cuerpo: unknown): RequestInit {
  return {
    method: metodo,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  };
}
