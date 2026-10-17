import type { FiltrosIndicadores } from "@/tipos/reporte";

const CAMPOS_INDICADORES = ["fechaDesde", "fechaHasta", "tecnicoId", "clienteId", "activoId", "estado", "tipo"] as const;
const CAMPOS_ANALISIS = ["fechaDesde", "fechaHasta", "clienteId", "activoId", "tecnicoId"] as const;

/** Texto de consulta (con `?` inicial o vacío) de los indicadores; omite los filtros vacíos. */
export function construirConsultaIndicadores(filtros: FiltrosIndicadores, prioridad = "") {
  const parametros = new URLSearchParams();
  for (const campo of CAMPOS_INDICADORES) {
    if (filtros[campo] !== "") parametros.append(campo, filtros[campo]);
  }
  if (prioridad !== "") parametros.append("prioridad", prioridad);
  const texto = parametros.toString();
  return texto === "" ? "" : "?" + texto;
}

/** Texto de consulta de los reportes analíticos (tendencias, tiempos, reincidencias, repuestos y alertas). */
export function construirConsultaAnalisis(filtros: FiltrosIndicadores, extra: Record<string, string> = {}) {
  const parametros = new URLSearchParams();
  for (const campo of CAMPOS_ANALISIS) {
    if (filtros[campo] !== "") parametros.append(campo, filtros[campo]);
  }
  for (const [clave, valor] of Object.entries(extra)) parametros.append(clave, valor);
  const texto = parametros.toString();
  return texto === "" ? "" : "?" + texto;
}
