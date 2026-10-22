import { ENCABEZADO_RUTA_PEDIDA, rutaDeInicioDeSesion } from "@/servicios/api/solicitudes-http";
import { esSoloTecnico, puedeVerRuta } from "@/seguridad/permisos";

export type DatosDelPedido = {
  ruta: string;
  /** `?a=1` o vacío. */
  consulta: string;
  haySesion: boolean;
  roles: readonly string[];
  esServerAction: boolean;
  /** El técnico eligió la vista de escritorio (cookie `sotra-vista`): ve el listado y el detalle de órdenes de escritorio. */
  vistaEscritorio?: boolean;
};

export type DecisionDeAcceso =
  | { tipo: "sin-sesion-api" }
  | { tipo: "iniciar-sesion"; destino: string }
  | { tipo: "sin-permiso" }
  | { tipo: "redirigir"; destino: string }
  | { tipo: "continuar"; encabezados: Record<string, string> };

/**
 * Qué hacer con un pedido según la sesión y los roles (lo usa `src/proxy.ts`).
 * - `/api/v1` sin sesión: 401, como la API (el navegador manda a iniciar sesión).
 * - Página sin sesión: al login y de vuelta a la misma página.
 * - Server Action sin sesión: sigue; al pedir a la API sin token redirige al login (`cliente-http-servidor.ts`),
 *   porque la respuesta de una acción no puede ser una redirección a otro sitio.
 * - Página sin el rol necesario: «sin permiso».
 * - Técnico (sin otro rol de gestión) en la vista móvil: las órdenes de escritorio pasan a «Mi trabajo».
 */
export function decidirAcceso(pedido: DatosDelPedido): DecisionDeAcceso {
  const rutaCompleta = pedido.ruta + pedido.consulta;
  const continuar: DecisionDeAcceso = { tipo: "continuar", encabezados: { [ENCABEZADO_RUTA_PEDIDA]: rutaCompleta } };

  if (pedido.ruta.startsWith("/api/v1/")) return pedido.haySesion ? continuar : { tipo: "sin-sesion-api" };
  if (!pedido.haySesion) {
    return pedido.esServerAction ? continuar : { tipo: "iniciar-sesion", destino: rutaDeInicioDeSesion(rutaCompleta) };
  }
  if (!pedido.esServerAction && !pedido.vistaEscritorio && esSoloTecnico(pedido.roles)) {
    if (pedido.ruta === "/ordenes-trabajo") return { tipo: "redirigir", destino: "/tecnico" };
    const detalle = pedido.ruta.match(/^\/ordenes-trabajo\/(\d+)$/);
    if (detalle) return { tipo: "redirigir", destino: "/tecnico/" + detalle[1] };
  }
  if (!pedido.esServerAction && !puedeVerRuta(pedido.roles, pedido.ruta)) return { tipo: "sin-permiso" };
  return continuar;
}
