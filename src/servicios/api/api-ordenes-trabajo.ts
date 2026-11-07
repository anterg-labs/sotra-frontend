import { construirConsultaOrdenes } from "@/servicios/api/consultas-ordenes";
import {
  crearOpcionesJson,
  leerDatosApi,
  MENSAJE_SESION_VENCIDA,
  MENSAJE_SIN_PERMISO,
  obtenerUrlBaseApi,
  volverAIniciarSesion,
} from "@/servicios/api/solicitudes-http";
import type {
  ActualizarOrdenTrabajoInput,
  CausaFalla,
  CrearOrdenTrabajoInput,
  MotivoDeOrden,
  RespuestaCalendarioOrdenes,
  FiltrosOrdenesTrabajo,
  OrdenTrabajo,
  RepuestoPedido,
  SolicitarSugerenciaInput,
  SugerenciaOrdenTrabajo,
} from "@/tipos/orden-trabajo";
import type { Pagina } from "@/tipos/pagina";

export async function apiListarOrdenesTrabajo(filtros: FiltrosOrdenesTrabajo) {
  const ruta = "/api/v1/ordenes-trabajo?" + construirConsultaOrdenes(filtros);
  const pagina = await leerDatosApi(ruta, { cache: "no-store" }, "No se pudo obtener el listado de órdenes de trabajo.");
  return pagina as Pagina<OrdenTrabajo>;
}

export async function apiObtenerOrdenTrabajo(ordenTrabajoId: number) {
  const orden = await leerDatosApi("/api/v1/ordenes-trabajo/" + ordenTrabajoId, { cache: "no-store" }, "No se pudo obtener la orden de trabajo solicitada.");
  return orden as OrdenTrabajo;
}

export type DatosExtraDeEstado = { lecturaUso?: number; motivoCodigo?: string };

export async function apiCambiarEstadoOrdenTrabajo(ordenTrabajoId: number, estado: string, motivo: string, extra: DatosExtraDeEstado = {}) {
  const opciones = crearOpcionesJson("PATCH", { estado: estado, motivo: motivo, ...extra });
  const ruta = "/api/v1/ordenes-trabajo/" + ordenTrabajoId + "/estado";
  const orden = await leerDatosApi(ruta, opciones, "No se pudo cambiar el estado de la orden de trabajo.");
  return orden as OrdenTrabajo;
}

export async function apiAsignarTecnicoOrdenTrabajo(ordenTrabajoId: number, tecnicoId: number) {
  const opciones = crearOpcionesJson("PATCH", { tecnicoId: tecnicoId });
  const ruta = "/api/v1/ordenes-trabajo/" + ordenTrabajoId + "/tecnico";
  const orden = await leerDatosApi(ruta, opciones, "No se pudo asignar el técnico a la orden de trabajo.");
  return orden as OrdenTrabajo;
}

export async function apiActualizarRepuestosOrdenTrabajo(ordenTrabajoId: number, repuestos: RepuestoPedido[]) {
  const opciones = crearOpcionesJson("PUT", { repuestos });
  const ruta = "/api/v1/ordenes-trabajo/" + ordenTrabajoId + "/repuestos";
  const orden = await leerDatosApi(ruta, opciones, "No se pudieron actualizar los repuestos de la orden de trabajo.");
  return orden as OrdenTrabajo;
}

export async function apiCrearOrdenTrabajo(orden: CrearOrdenTrabajoInput) {
  const opciones = crearOpcionesJson("POST", { ...orden, observaciones: orden.observaciones?.trim() === "" ? null : orden.observaciones });
  const ordenCreada = await leerDatosApi("/api/v1/ordenes-trabajo", opciones, "No se pudo crear la orden de trabajo.");
  return ordenCreada as OrdenTrabajo;
}

export async function apiActualizarOrdenTrabajo(
  ordenTrabajoId: number,
  orden: ActualizarOrdenTrabajoInput,
  versionLeida?: string,
) {
  const opciones = crearOpcionesJson("PUT", { ...orden, observaciones: orden.observaciones?.trim() === "" ? null : orden.observaciones });
  if (versionLeida) {
    opciones.headers = { ...opciones.headers, "If-Match": '"' + versionLeida + '"' };
  }
  const ordenActualizada = await leerDatosApi("/api/v1/ordenes-trabajo/" + ordenTrabajoId, opciones, "No se pudo actualizar la orden de trabajo.");
  return ordenActualizada as OrdenTrabajo;
}

const MENSAJE_SIN_DOCUMENTACION = "El sistema no encontró información suficiente en la documentación técnica para esta tarea.";
const MENSAJE_SUGERENCIA_FALLIDA = "No se pudo obtener la sugerencia para la orden de trabajo.";

/** Un evento de la respuesta: el avance, la sugerencia o el error (el estado HTTP ya se envió con el primer evento). */
type LineaDeSugerencia = {
  etapa?: string;
  sugerencia?: string;
  modo?: SugerenciaOrdenTrabajo["modo"];
  error?: { estado?: number };
};

/**
 * Pide la sugerencia y avisa cada etapa a medida que la API la empieza. La API responde eventos del servidor
 * (`data: {...}` y una línea en blanco), el formato que Cloudflare reenvía sin juntar las etapas.
 */
export async function apiSolicitarSugerenciaOrdenTrabajo(
  datosOrden: SolicitarSugerenciaInput,
  alAvanzar?: (etapa: string) => void,
) {
  const urlBaseApi = obtenerUrlBaseApi();
  const opciones = crearOpcionesJson("POST", datosOrden);
  const respuesta = await fetch(urlBaseApi + "/api/v1/ordenes-trabajo/sugerencia/etapas", opciones);
  if (respuesta.status === 401) {
    volverAIniciarSesion();
    throw new Error(MENSAJE_SESION_VENCIDA);
  }
  if (respuesta.status === 403) {
    throw new Error(MENSAJE_SIN_PERMISO);
  }
  if (!respuesta.ok || respuesta.body === null) {
    throw new Error(MENSAJE_SUGERENCIA_FALLIDA);
  }

  const lector = respuesta.body.pipeThrough(new TextDecoderStream()).getReader();
  let pendiente = "";
  while (true) {
    const { done, value } = await lector.read();
    pendiente += value ?? "";
    const lineas = pendiente.split("\n");
    pendiente = done ? "" : (lineas.pop() ?? "");
    for (const linea of lineas) {
      // Solo las líneas "data:" traen datos; las vacías cierran el evento y las demás (comentarios) se ignoran.
      if (!linea.startsWith("data:")) continue;
      const datos = JSON.parse(linea.slice("data:".length)) as LineaDeSugerencia;
      if (datos.error) {
        throw new Error(datos.error.estado === 422 ? MENSAJE_SIN_DOCUMENTACION : MENSAJE_SUGERENCIA_FALLIDA);
      }
      if (datos.sugerencia !== undefined) {
        return { sugerencia: datos.sugerencia, modo: datos.modo } as SugerenciaOrdenTrabajo;
      }
      if (datos.etapa) alAvanzar?.(datos.etapa);
    }
    if (done) throw new Error(MENSAJE_SUGERENCIA_FALLIDA);
  }
}

/** Causas de falla activas para clasificar una correctiva. */
export async function apiListarCausasFalla() {
  return (await leerDatosApi("/api/v1/causas-falla?estado=activo", { cache: "no-store" }, "No se pudieron obtener las causas de falla.")) as CausaFalla[];
}

/** Motivos codificados para clasificar una pausa o una devolución. */
export async function apiListarMotivosOrden() {
  return (await leerDatosApi("/api/v1/ordenes-trabajo/motivos", { cache: "no-store" }, "No se pudieron obtener los motivos.")) as MotivoDeOrden[];
}

export type ParametrosCalendario = {
  desde: string;
  hasta: string;
  clienteId: string;
  activoId: string;
  estado: string;
  tipo: string;
  prioridad: string;
  incluirEliminadas: boolean;
  sinAsignar?: boolean;
};

/** Órdenes del rango ubicadas por su fecha prevista (hasta 100 días), con los filtros del listado. */
export async function apiObtenerCalendarioOrdenes(parametros: ParametrosCalendario) {
  const consulta = new URLSearchParams({ desde: parametros.desde, hasta: parametros.hasta });
  for (const campo of ["clienteId", "activoId", "estado", "tipo", "prioridad"] as const) {
    if (parametros[campo] !== "") consulta.set(campo, parametros[campo]);
  }
  if (parametros.incluirEliminadas) consulta.set("incluirEliminadas", "true");
  if (parametros.sinAsignar) consulta.set("sinAsignar", "true");
  return (await leerDatosApi("/api/v1/ordenes-trabajo/calendario?" + consulta.toString(), { cache: "no-store" }, "No se pudo obtener el calendario de órdenes.")) as RespuestaCalendarioOrdenes;
}
