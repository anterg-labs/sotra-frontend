import { apiObtenerIndicadores, apiObtenerUrlReportePdf } from "@/servicios/api/api-reportes";
import type { FiltrosIndicadores } from "@/tipos/reporte";

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
  return apiObtenerUrlReportePdf(tipoReporte, filtros, prioridad);
}
