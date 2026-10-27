import { construirConsultaAnalisis, construirConsultaIndicadores } from "@/servicios/api/consultas-reportes";
import { leerDatosApi, obtenerUrlBaseApi } from "@/servicios/api/solicitudes-http";
import type {
  AgrupacionTendencias,
  AlertasMaquinaria,
  FiltrosIndicadores,
  Indicadores,
  Reincidencias,
  RepuestosUsados,
  Tendencias,
  DesempenoOperativo,
  Tiempos,
} from "@/tipos/reporte";

export async function apiObtenerIndicadores(filtros: FiltrosIndicadores) {
  const ruta = "/api/v1/reportes/indicadores" + construirConsultaIndicadores(filtros);
  const indicadores = await leerDatosApi(ruta, { cache: "no-store" }, "No se pudieron obtener los indicadores.");
  return indicadores as Indicadores;
}

export type FormatoReporte = "pdf" | "csv";

/** Enlace de descarga (PDF o CSV) al mismo origen: el reenvío de `/api/v1` le agrega el token de la sesión. */
export function apiObtenerUrlReporte(
  tipoReporte: string,
  filtros: FiltrosIndicadores,
  prioridad: string,
  formato: FormatoReporte,
) {
  return obtenerUrlBaseApi() + "/api/v1/reportes/" + tipoReporte + "/" + formato + construirConsultaIndicadores(filtros, prioridad);
}

export async function apiObtenerTendencias(filtros: FiltrosIndicadores, agrupacion: AgrupacionTendencias) {
  const ruta = "/api/v1/reportes/tendencias" + construirConsultaAnalisis(filtros, { agrupacion });
  return (await leerDatosApi(ruta, { cache: "no-store" }, "No se pudieron obtener las tendencias.")) as Tendencias;
}

export async function apiObtenerTiempos(filtros: FiltrosIndicadores) {
  const ruta = "/api/v1/reportes/tiempos" + construirConsultaAnalisis(filtros);
  return (await leerDatosApi(ruta, { cache: "no-store" }, "No se pudieron obtener los tiempos.")) as Tiempos;
}

export async function apiObtenerDesempeno(filtros: FiltrosIndicadores) {
  const ruta = "/api/v1/reportes/desempeno" + construirConsultaAnalisis(filtros);
  return (await leerDatosApi(ruta, { cache: "no-store" }, "No se pudo obtener el desempeño operativo.")) as DesempenoOperativo;
}

export async function apiObtenerReincidencias(filtros: FiltrosIndicadores) {
  const ruta = "/api/v1/reportes/reincidencias" + construirConsultaAnalisis(filtros);
  return (await leerDatosApi(ruta, { cache: "no-store" }, "No se pudieron obtener las reincidencias.")) as Reincidencias;
}

export async function apiObtenerAlertasMaquinaria(filtros: FiltrosIndicadores) {
  const ruta = "/api/v1/reportes/alertas-maquinaria" + construirConsultaAnalisis(filtros);
  return (await leerDatosApi(ruta, { cache: "no-store" }, "No se pudieron obtener las alertas de maquinaria.")) as AlertasMaquinaria;
}

export async function apiObtenerRepuestosUsados(filtros: FiltrosIndicadores) {
  const ruta = "/api/v1/reportes/repuestos-usados" + construirConsultaAnalisis(filtros);
  return (await leerDatosApi(ruta, { cache: "no-store" }, "No se pudieron obtener los repuestos más usados.")) as RepuestosUsados;
}
