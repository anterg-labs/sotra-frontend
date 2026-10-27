import { ETIQUETAS_FASE_ORDEN, type OpcionEstadoOrden } from "@/tipos/orden-trabajo";
import type { AlertasMaquinaria, Indicadores } from "@/tipos/reporte";
import { contarPorFase } from "@/utilidades/estados-orden";

export type Acceso = { etiqueta: string; valor: number | string; detalle?: string; href: string; destacado?: boolean };

/** `estados` es el catálogo de la base: qué estados son pendientes, en curso o por validar lo dice cada estado (`fase`). */
export function armarAccesos(indicadores: Indicadores, alertas: AlertasMaquinaria | null, estados: readonly OpcionEstadoOrden[]): Acceso[] {
  const grupos = indicadores.ordenesPorEstado;
  const pendientes = contarPorFase(grupos, estados, "pendiente");
  const enCurso = contarPorFase(grupos, estados, "en_curso");

  return [
    { etiqueta: "Órdenes abiertas", valor: pendientes + enCurso, detalle: "Pendientes y en curso", href: "/ordenes-trabajo" },
    { etiqueta: "Prioridad alta pendientes", valor: indicadores.ordenesAltaPrioridadPendientes, href: "/ordenes-trabajo?prioridad=alta", destacado: indicadores.ordenesAltaPrioridadPendientes > 0 },
    { etiqueta: ETIQUETAS_FASE_ORDEN.pendiente, valor: pendientes, detalle: "Esperan técnico o inicio", href: "/ordenes-trabajo?fase=pendiente" },
    { etiqueta: ETIQUETAS_FASE_ORDEN.en_curso, valor: enCurso, href: "/ordenes-trabajo?fase=en_curso" },
    { etiqueta: ETIQUETAS_FASE_ORDEN.por_validar, valor: indicadores.ordenesPendientesDeValidacion, detalle: "Terminadas sin cerrar", href: "/ordenes-trabajo?fase=por_validar" },
    {
      etiqueta: "Alertas de maquinaria",
      valor: alertas?.total ?? "—",
      detalle: alertas ? `${alertas.criticas} críticas` : "No disponible por ahora",
      href: "/reportes",
      destacado: (alertas?.criticas ?? 0) > 0,
    },
    { etiqueta: "Repuestos con bajo stock", valor: indicadores.repuestosBajoStock.length, href: "/repuestos?stock=alerta", destacado: indicadores.repuestosBajoStock.length > 0 },
  ];
}
