export function obtenerUrlBaseApi(): string {
  const urlBaseApi = process.env.API_URL;

  if (!urlBaseApi) {
    throw new Error("La URL de la API no está configurada.");
  }

  return urlBaseApi.replace(/\/$/, "");
}

async function leerMensajeDelServidor(respuesta: Response) {
  try {
    const cuerpo = await respuesta.json();
    if (typeof cuerpo.mensaje === "string") {
      return cuerpo.mensaje;
    }
    return "";
  } catch {
    return "";
  }
}

export async function enviarPedidoApi(ruta: string, opciones: RequestInit, mensajeError: string) {
  const urlBaseApi = obtenerUrlBaseApi();
  const respuesta = await fetch(urlBaseApi + ruta, opciones);

  if (!respuesta.ok) {
    const mensajeDelServidor = await leerMensajeDelServidor(respuesta);
    if (mensajeDelServidor !== "") {
      throw new Error(mensajeDelServidor);
    }

    throw new Error(mensajeError);
  }

  return respuesta;
}

export async function leerDatosApi(ruta: string, opciones: RequestInit, mensajeError: string) {
  const respuesta = await enviarPedidoApi(ruta, opciones, mensajeError);
  const datos = await respuesta.json();
  return datos;
}

export function crearOpcionesJson(metodo: string, cuerpo: unknown): RequestInit {
  return {
    method: metodo,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  };
}
