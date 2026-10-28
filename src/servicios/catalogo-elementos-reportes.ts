export type ElementoReportes = { codigo: string; nombre: string; categoria: string };

export function codigoDeGrafico(titulo: string) {
  return "grafico_" + titulo.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 92);
}

const graficos = (categoria: string, titulos: string[]): ElementoReportes[] =>
  titulos.map(nombre => ({ codigo: codigoDeGrafico(nombre), nombre, categoria }));

/** Cada elemento visual nuevo se agrega aquí para que aparezca en Configuración. */
export const CATALOGO_REPORTES: ElementoReportes[] = [
  ...[
    ["descarga", "Descargar PDF o CSV"],
    ["descarga_ordenes_trabajo", "Descarga: órdenes de trabajo"],
    ["descarga_activos_intervenidos", "Descarga: activos intervenidos"],
    ["descarga_repuestos_utilizados", "Descarga: repuestos utilizados"],
    ["descarga_indicadores", "Descarga: indicadores operativos"],
    ["kpi_preventivas_porcentaje", "Indicador clave: mantenimiento preventivo"],
    ["kpi_cumplimiento_preventivo", "Indicador clave: cumplimiento preventivo"],
    ["kpi_tiempo_reparacion_horas", "Indicador clave: tiempo de reparación"],
    ["franja_avisos", "Franja de avisos"],
    ["resumen_ordenes_registradas", "Órdenes de trabajo registradas"],
    ["resumen_tiempo_inicio", "Tiempo promedio hasta el inicio"],
    ["resumen_tiempo_cierre", "Tiempo promedio hasta el cierre"],
    ["resumen_atencion", "Atención necesaria"],
    ["resumen_ordenes_recientes", "Órdenes recientes"],
    ["resumen_estado", "Órdenes por estado"],
    ["resumen_prioridad", "Órdenes por prioridad"],
    ["resumen_tipo", "Órdenes por tipo de mantenimiento"],
    ["resumen_activos", "Activos con más intervenciones"],
    ["resumen_bajo_stock", "Repuestos con bajo stock"],
  ].map(([codigo, nombre]) => ({ codigo, nombre, categoria: "Resumen" })),
  ...[
    "Alertas de maquinaria", "Órdenes en el período", "Órdenes creadas por mes, preventivas y correctivas",
    "Órdenes creadas", "Preventivas sobre el total", "Tiempo de respuesta (creación a inicio)",
    "Tiempo de ejecución (inicio a revisión)", "Tiempo de revisión (revisión a cierre)",
    "Pausas", "Devoluciones de revisión a pendiente", "Reasignaciones",
    "Motivos de pausa más frecuentes", "Motivos de devolución más frecuentes",
    "Maquinaria por tipo", "Activos con más horas de parada",
    "Duración promedio", "Mediana", "Percentil 90", "Cumplen la fecha prevista", "Tiempo por etapa",
    "¿Qué repuestos se usan más?", "¿Qué máquinas vuelven una y otra vez a mantenimiento?",
  ].map(nombre => ({ codigo: codigoDeGrafico(nombre), nombre, categoria: "Alertas y desempeño" })),
  ...graficos("Maquinaria", [
    "¿Qué máquinas concentran la parada?", "Trabajo planificado frente a reactivo",
    "Mantenimiento planificado frente a reactivo en horas", "Horas de mantenimiento por tipo de máquina",
    "Tiempo medio de reparación por tipo de máquina", "Tiempo medio de reparación por modelo",
    "Estacionalidad de las correctivas", "Repuestos por modelo", "Consumo de repuestos en unidades", "Resumen por cliente",
  ]),
  { codigo: "indicador_planificado_horas", nombre: "Mantenimiento planificado en horas (indicador)", categoria: "Maquinaria" },
  ...graficos("Proceso", [
    "Cuellos de botella del proceso", "Pendiente", "En progreso", "Revisión", "Pausa",
    "Órdenes demoradas", "Órdenes creadas frente a cerradas", "Antigüedad de las órdenes abiertas",
    "Cumplimiento del plan preventivo", "Horas en pausa por motivo",
  ]),
  ...graficos("Análisis avanzado", [
    "Este período frente al anterior", "Intervalo entre correctivas por máquina",
    "Correctivas frente a edad de la máquina", "Correctivas frente a horas de uso",
    "Correctivas frente a kilómetros de uso",
  ]),
];

export function estaVisibleReporte(desactivados: ReadonlySet<string>, codigo: string) {
  return !desactivados.has(codigo);
}
