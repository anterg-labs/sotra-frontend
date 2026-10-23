import type { NextRequest } from "next/server";
import { obtenerUrlBaseApiServidor } from "@/servicios/api/solicitudes-http";
import { obtenerTokenAcceso } from "@/servicios/servidor/token-acceso";

/** Encabezados del navegador que la API necesita; el resto (cookies de sesión incluidas) no sale de Next. */
const ENCABEZADOS_DEL_PEDIDO = ["accept", "accept-language", "content-type", "if-match"];
/** Encabezados de la API que el navegador necesita (por ejemplo, el nombre de la descarga). */
const ENCABEZADOS_DE_LA_RESPUESTA = ["content-type", "content-disposition", "etag", "cache-control"];

type Contexto = { params: Promise<{ ruta: string[] }> };

/**
 * Reenvía a la API los pedidos del navegador (`/api/v1/...`) con el token de la sesión: selectores, subidas de
 * archivos, sugerencia de IA y descargas (`<a href>` a documentos, evidencias y reportes). El token nunca llega
 * al navegador. Sin sesión responde 401 sin cuerpo, igual que la API.
 */
async function reenviar(solicitud: NextRequest, contexto: Contexto) {
  const { ruta } = await contexto.params;
  if (ruta.some((segmento) => segmento === "" || segmento === "." || segmento === "..")) {
    return new Response(null, { status: 404 });
  }

  const token = await obtenerTokenAcceso();
  if (!token) return new Response(null, { status: 401 });

  const encabezados = new Headers({ Authorization: "Bearer " + token });
  for (const nombre of ENCABEZADOS_DEL_PEDIDO) {
    const valor = solicitud.headers.get(nombre);
    if (valor !== null) encabezados.set(nombre, valor);
  }

  const tieneCuerpo = solicitud.method !== "GET" && solicitud.method !== "HEAD";
  const destino = obtenerUrlBaseApiServidor() + "/api/v1/" + ruta.map(encodeURIComponent).join("/") + solicitud.nextUrl.search;

  let respuesta: Response;
  try {
    respuesta = await fetch(destino, {
      method: solicitud.method,
      headers: encabezados,
      body: tieneCuerpo ? await solicitud.arrayBuffer() : undefined,
      cache: "no-store",
      redirect: "manual",
    });
  } catch {
    return Response.json({ codigo: "API_NO_DISPONIBLE", mensaje: "No se pudo conectar con el servidor." }, { status: 503 });
  }

  const encabezadosRespuesta = new Headers();
  for (const nombre of ENCABEZADOS_DE_LA_RESPUESTA) {
    const valor = respuesta.headers.get(nombre);
    if (valor !== null) encabezadosRespuesta.set(nombre, valor);
  }
  return new Response(respuesta.body, { status: respuesta.status, headers: encabezadosRespuesta });
}

export { reenviar as DELETE, reenviar as GET, reenviar as PATCH, reenviar as POST, reenviar as PUT };
