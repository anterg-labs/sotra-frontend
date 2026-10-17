import {
  apiObtenerAlertasMaquinaria,
  apiObtenerIndicadores,
  apiObtenerReincidencias,
  apiObtenerRepuestosUsados,
  apiObtenerTendencias,
  apiObtenerTiempos,
  apiObtenerUrlReporte,
} from "@/servicios/api/api-reportes";
import type { AgrupacionTendencias, FiltrosIndicadores } from "@/tipos/reporte";

export const tiposDeReporte = [
  { valor: "ordenes-trabajo", etiqueta: "Reporte de órdenes de trabajo" },
  { valor: "activos-intervenidos", etiqueta: "Reporte de activos intervenidos" },
  { valor: "repuestos-utilizados", etiqueta: "Reporte de repuestos utilizados" },
  { valor: "actividad-tecnicos", etiqueta: "Reporte de actividad por técnico" },
  { valor: "indicadores", etiqueta: "Reporte de indicadores operativos" },
];

export async function obtenerIndicadores(filtros: FiltrosIndicadores) {
  return apiObtenerIndicadores(filtros);
}

export function obtenerUrlReportePdf(tipoReporte: string, filtros: FiltrosIndicadores, prioridad: string) {
  return apiObtenerUrlReporte(tipoReporte, filtros, prioridad, "pdf");
}

export function obtenerUrlReporteCsv(tipoReporte: string, filtros: FiltrosIndicadores, prioridad: string) {
  return apiObtenerUrlReporte(tipoReporte, filtros, prioridad, "csv");
}

export async function obtenerTendencias(filtros: FiltrosIndicadores, agrupacion: AgrupacionTendencias) {
  return apiObtenerTendencias(filtros, agrupacion);
}

export async function obtenerTiempos(filtros: FiltrosIndicadores) {
  return apiObtenerTiempos(filtros);
}

export async function obtenerReincidencias(filtros: FiltrosIndicadores) {
  return apiObtenerReincidencias(filtros);
}

export async function obtenerRepuestosUsados(filtros: FiltrosIndicadores) {
  return apiObtenerRepuestosUsados(filtros);
}

export async function obtenerAlertasMaquinaria(filtros: FiltrosIndicadores) {
  return apiObtenerAlertasMaquinaria(filtros);
}

const etiquetasDeAlerta = {
  sin_asignar: "Orden sin asignar",
  demorada_para_iniciar: "Orden demorada para iniciar",
  pausada_demasiado: "Orden pausada demasiado tiempo",
  maquina_detenida: "Máquina detenida mucho tiempo",
} as const;

export function obtenerEtiquetaAlerta(tipo: keyof typeof etiquetasDeAlerta) {
  return etiquetasDeAlerta[tipo];
}

/** Convierte horas en un texto corto: «20 min», «5 h», «2 d 4 h». */
export function formatearDuracion(horas: number | null) {
  if (horas === null) return "Sin datos";
  if (horas < 1) return Math.round(horas * 60) + " min";
  if (horas < 24) return Math.round(horas * 10) / 10 + " h";
  const dias = Math.floor(horas / 24);
  const resto = Math.round(horas - dias * 24);
  return resto === 0 ? dias + " d" : dias + " d " + resto + " h";
}
