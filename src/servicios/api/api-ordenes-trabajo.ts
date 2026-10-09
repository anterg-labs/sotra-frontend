import { crearOpcionesJson, leerDatosApi, obtenerUrlBaseApi } from "@/servicios/api/solicitudes-http";
import type {
  ActualizarOrdenTrabajoInput,
  CrearOrdenTrabajoInput,
  FiltrosOrdenesTrabajo,
  OrdenTrabajo,
  SolicitarSugerenciaInput,
  SugerenciaOrdenTrabajo,
} from "@/tipos/orden-trabajo";
import type { Pagina } from "@/tipos/pagina";

export async function apiListarOrdenesTrabajo(filtros: FiltrosOrdenesTrabajo) {
  const parametros = new URLSearchParams();
  if (filtros.buscar.trim() !== "") {
    parametros.append("buscar", filtros.buscar.trim());
  }
  if (filtros.clienteId !== "") {
    parametros.append("clienteId", filtros.clienteId);
  }
  if (filtros.activoId !== "") {
    parametros.append("activoId", filtros.activoId);
  }
  if (filtros.tecnicoId !== "") {
    parametros.append("tecnicoId", filtros.tecnicoId);
  }
  if (filtros.estado !== "") {
    parametros.append("estado", filtros.estado);
  }
  if (filtros.prioridad !== "") {
    parametros.append("prioridad", filtros.prioridad);
  }
  if (filtros.tipo !== "") {
    parametros.append("tipo", filtros.tipo);
  }
  if (filtros.fechaDesde !== "") {
    parametros.append("fechaDesde", filtros.fechaDesde);
  }
  if (filtros.fechaHasta !== "") {
    parametros.append("fechaHasta", filtros.fechaHasta);
  }
  if (filtros.conSugerencias) {
    parametros.append("conSugerencias", "true");
  }
  parametros.append("pagina", String(filtros.pagina));

  const ruta = "/api/v1/ordenes-trabajo?" + parametros.toString();
  const pagina = await leerDatosApi(ruta, { cache: "no-store" }, "No se pudo obtener el listado de órdenes de trabajo.");
  return pagina as Pagina<OrdenTrabajo>;
}

export async function apiObtenerOrdenTrabajo(ordenTrabajoId: number) {
  const orden = await leerDatosApi("/api/v1/ordenes-trabajo/" + ordenTrabajoId, { cache: "no-store" }, "No se pudo obtener la orden de trabajo solicitada.");
  return orden as OrdenTrabajo;
}

export async function apiCambiarEstadoOrdenTrabajo(ordenTrabajoId: number, estado: string, motivo: string) {
  const opciones = crearOpcionesJson("PATCH", { estado: estado, motivo: motivo });
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

export async function apiCrearOrdenTrabajo(orden: CrearOrdenTrabajoInput) {
  const opciones = crearOpcionesJson("POST", orden);
  const ordenCreada = await leerDatosApi("/api/v1/ordenes-trabajo", opciones, "No se pudo crear la orden de trabajo.");
  return ordenCreada as OrdenTrabajo;
}

export async function apiActualizarOrdenTrabajo(ordenTrabajoId: number, orden: ActualizarOrdenTrabajoInput) {
  const opciones = crearOpcionesJson("PUT", orden);
  const ordenActualizada = await leerDatosApi("/api/v1/ordenes-trabajo/" + ordenTrabajoId, opciones, "No se pudo actualizar la orden de trabajo.");
  return ordenActualizada as OrdenTrabajo;
}

export async function apiSolicitarSugerenciaOrdenTrabajo(datosOrden: SolicitarSugerenciaInput) {
  const urlBaseApi = obtenerUrlBaseApi();
  const opciones = crearOpcionesJson("POST", datosOrden);
  const respuesta = await fetch(urlBaseApi + "/api/v1/ordenes-trabajo/sugerencia", opciones);
  if (respuesta.status === 422) {
    throw new Error("El sistema no encontró información suficiente en la documentación técnica para esta tarea.");
  }
  if (!respuesta.ok) {
    throw new Error("No se pudo obtener la sugerencia para la orden de trabajo.");
  }

  const sugerenciaObtenida = await respuesta.json();
  return sugerenciaObtenida as SugerenciaOrdenTrabajo;
}
