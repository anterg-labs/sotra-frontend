import type { AlertasMaquinaria, CantidadPorGrupo, Indicadores } from "@/tipos/reporte";

const ESTADOS_TERMINADOS = new Set(["finalizada", "cerrada", "cancelada"]);

export type Acceso = { etiqueta: string; valor: number | string; detalle?: string; href: string; destacado?: boolean };

function cantidadEnEstado(grupos: CantidadPorGrupo[], estado: string) {
  return grupos.find((grupo) => grupo.nombre === estado)?.cantidad ?? 0;
}

export function armarAccesos(indicadores: Indicadores, alertas: AlertasMaquinaria | null): Acceso[] {
  const abiertas = indicadores.ordenesPorEstado
    .filter((grupo) => !ESTADOS_TERMINADOS.has(grupo.nombre))
    .reduce((total, grupo) => total + grupo.cantidad, 0);
  const sinAsignar = cantidadEnEstado(indicadores.ordenesPorEstado, "creada");
  const enEjecucion = cantidadEnEstado(indicadores.ordenesPorEstado, "en_ejecucion");

  return [
    { etiqueta: "Órdenes abiertas", valor: abiertas, detalle: "Creadas, asignadas, en ejecución o pausadas", href: "/ordenes-trabajo" },
    { etiqueta: "Prioridad alta pendientes", valor: indicadores.ordenesAltaPrioridadPendientes, href: "/ordenes-trabajo?prioridad=alta", destacado: indicadores.ordenesAltaPrioridadPendientes > 0 },
    { etiqueta: "Sin asignar", valor: sinAsignar, detalle: "Esperan un técnico", href: "/ordenes-trabajo?estado=creada" },
    { etiqueta: "En ejecución", valor: enEjecucion, href: "/ordenes-trabajo?estado=en_ejecucion" },
    { etiqueta: "Pendientes de validación", valor: indicadores.ordenesPendientesDeValidacion, detalle: "Finalizadas sin cerrar", href: "/ordenes-trabajo?estado=finalizada" },
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
