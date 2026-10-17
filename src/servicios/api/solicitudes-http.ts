export function obtenerUrlBaseApi(): string {
  const urlBaseApi = process.env.API_URL;

  if (!urlBaseApi) {
    throw new Error("La URL de la API no está configurada.");
  }

  return urlBaseApi.replace(/\/$/, "");
}

/**
 * URL base de la API para código que corre en el servidor de Next (Server Components y Server Actions).
 * Dentro de Docker el servidor de Next no llega a la API por la URL pública que usa el navegador
 * (`API_URL`, por ejemplo `localhost:8081`), así que `API_URL_INTERNA` apunta a la dirección alcanzable
 * desde el contenedor. Si no está definida se usa `API_URL`.
 */
export function obtenerUrlBaseApiServidor(): string {
  const urlBaseApi = process.env.API_URL_INTERNA || process.env.API_URL;

  if (!urlBaseApi) {
    throw new Error("La URL de la API no está configurada.");
  }

  return urlBaseApi.replace(/\/$/, "");
}

export class ErrorDeApi extends Error {
  constructor(mensaje: string, public readonly codigo: string | null, public readonly estadoHttp: number) {
    super(mensaje);
    this.name = "ErrorDeApi";
  }
}

export async function leerErrorDelServidor(respuesta: Response, mensajePredeterminado: string) {
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

export async function enviarPedidoApi(ruta: string, opciones: RequestInit, mensajeError: string) {
  const urlBaseApi = obtenerUrlBaseApi();
  const respuesta = await fetch(urlBaseApi + ruta, opciones);

  if (!respuesta.ok) {
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
