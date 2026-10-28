import type { OrdenTrabajo } from "@/tipos/orden-trabajo";
import type { Repuesto } from "@/tipos/repuesto";

export type CantidadPorGrupo = {
  nombre: string;
  cantidad: number;
};

export type FiltrosIndicadores = {
  fechaDesde: string;
  fechaHasta: string;
  clienteId: string;
  activoId: string;
  estado: string;
  tipo: string;
};

export type Indicadores = {
  totalOrdenes: number;
  ordenesPorEstado: CantidadPorGrupo[];
  ordenesPorPrioridad: CantidadPorGrupo[];
  ordenesPorTipo: CantidadPorGrupo[];
  activosConMasIntervenciones: CantidadPorGrupo[];
  repuestosBajoStock: Repuesto[];
  promedioHorasHastaInicio: number | null;
  promedioHorasHastaCierre: number | null;
  ordenesAltaPrioridadPendientes: number;
  ordenesPendientesDeValidacion: number;
  ordenesSinAsignar: number;
  ordenesRecientes: OrdenTrabajo[];
};

export type AgrupacionTendencias = "semana" | "mes";

export type PuntoTendencia = {
  periodo: string;
  preventivas: number;
  correctivas: number;
  total: number;
  /** Órdenes cerradas en el período (por fecha de cierre). */
  cerradas: number;
};

export type Tendencias = {
  agrupacion: AgrupacionTendencias;
  puntos: PuntoTendencia[];
  totalPeriodo: number;
  totalPeriodoAnterior: number | null;
};

export type Duracion = {
  cantidad: number;
  promedioHoras: number | null;
  medianaHoras: number | null;
  percentil90Horas: number | null;
};

export type EtapaTiempo = {
  estado: string;
  cantidad: number;
  promedioHoras: number;
};

export type Cumplimiento = {
  evaluadas: number;
  enPlazo: number;
  porcentajeEnPlazo: number | null;
  atrasoPromedioDias: number | null;
};

/** Cumplimiento de la fecha prevista de un grupo (tipo de orden o tipo de máquina). */
export type CumplimientoGrupo = {
  id: number | null;
  nombre: string;
  evaluadas: number;
  enPlazo: number;
  porcentajeEnPlazo: number | null;
};

export type Tiempos = {
  duracion: Duracion;
  etapas: EtapaTiempo[];
  cumplimiento: Cumplimiento;
  cumplimientoPorTipoDeOrden: CumplimientoGrupo[];
  cumplimientoPreventivoPorTipoDeMaquina: CumplimientoGrupo[];
};

/** Desempeño operativo (RD-10): órdenes, procesos y maquinaria. No evalúa personas. */
export type DesempenoOperativo = {
  ordenes: {
    creadas: number;
    cerradas: number;
    eliminadas: number;
    abiertas: number;
    preventivas: number;
    correctivas: number;
    porcentajePreventivas: number | null;
  };
  tiempos: { respuesta: Duracion; ejecucion: Duracion; revision: Duracion };
  flujo: {
    pausas: {
      cantidad: number;
      ordenesConPausa: number;
      duracionPromedioHoras: number | null;
      motivos: MotivoDeProceso[];
      porMotivo: PausaPorMotivo[];
    };
    devoluciones: { cantidad: number; ordenesDevueltas: number; porcentajeDeOrdenes: number | null; motivos: MotivoDeProceso[] };
    reasignaciones: { cantidad: number; ordenesReasignadas: number };
  };
  maquinaria: { porTipo: MaquinariaDesempeno[]; activos: MaquinariaDesempeno[]; porModelo: MaquinariaDesempeno[] };
  estimacion: Estimacion;
  planificacion: Planificacion;
};

export type HorasMantenimiento = {
  ordenesCerradas: number;
  horasPreventivas: number;
  horasCorrectivas: number;
  horasTotales: number;
  porcentajePlanificado: number | null;
};

export type Planificacion = {
  periodo: RangoDeFechas;
  resumen: HorasMantenimiento;
  porMes: { periodo: string; resumen: HorasMantenimiento }[];
  porTipo: { id: number; nombre: string; resumen: HorasMantenimiento }[];
};

export type PausaPorMotivo = { codigo: string; motivo: string; cantidad: number; horas: number; horasPromedio: number | null };

export type Estimacion = {
  ordenes: number;
  horasEstimadas: number | null;
  horasReales: number | null;
  desviacionPromedioPorcentaje: number | null;
};

export type MotivoDeProceso = { texto: string; cantidad: number };

export type MaquinariaDesempeno = {
  id: number;
  nombre: string;
  cliente: string | null;
  ordenes: number;
  correctivas: number;
  preventivas: number;
  horasPromedioEjecucion: number | null;
  horasParada: number;
  correctivasCerradas: number;
  tiempoMedioReparacionHoras: number | null;
  porcentajeDeLaParada: number | null;
  porcentajeAcumulado: number | null;
  activosEnServicio: number | null;
  costoParada: number | null;
};

export type RepuestoUsado = {
  repuestoId: number;
  codigo: string;
  nombre: string;
  ordenes: number;
};

export type RepuestosUsados = {
  elementos: RepuestoUsado[];
};

export type Reincidencia = {
  activoId: number;
  nombreActivo: string;
  cliente: string;
  correctivas: number;
  reincidencias: number;
  diasPromedioEntreIntervenciones: number | null;
  ultimaIntervencion: string;
};

export type Reincidencias = {
  dias: number;
  minimo: number;
  elementos: Reincidencia[];
};

export type TipoAlertaMaquinaria = "sin_asignar" | "demorada_para_iniciar" | "pausada_demasiado" | "maquina_detenida";

export type AlertaMaquinaria = {
  tipo: TipoAlertaMaquinaria;
  gravedad: "alta" | "critica";
  ordenId: number;
  activoId: number;
  nombreActivo: string;
  cliente: string;
  estado: string;
  prioridad: string;
  horasTranscurridas: number;
  umbralHoras: number;
};

export type AlertasMaquinaria = {
  total: number;
  criticas: number;
  alertas: AlertaMaquinaria[];
};

export type RangoDeFechas = { desde: string; hasta: string };

export type PuntoDeSerie = { periodo: string; valor: number | null };

export type CodigoMetrica =
  | "preventivas_porcentaje"
  | "planificado_horas_porcentaje"
  | "cumplimiento_preventivo"
  | "tiempo_reparacion_horas"
  | "horas_parada"
  | "ordenes_creadas";

export type MetricaComparada = {
  codigo: CodigoMetrica;
  nombre: string;
  unidad: "ordenes" | "porcentaje" | "horas";
  actual: number | null;
  anterior: number | null;
  anioAnterior: number | null;
  variacionPorcentual: number | null;
  /** `true` si subir es mejor, `false` si bajar es mejor, `null` si no hay juicio de valor. */
  mejorSiSube: boolean | null;
  muestra: number;
  serie: PuntoDeSerie[];
};

export type Comparativa = {
  periodo: RangoDeFechas;
  periodoAnterior: RangoDeFechas;
  periodoAnioAnterior: RangoDeFechas;
  metricas: MetricaComparada[];
};

export type RangoDeEdad = { rango: string; etiqueta: string; cantidad: number };

export type OrdenAntigua = { ordenId: number; nombreActivo: string; cliente: string; estado: string; edadDias: number };

export type Envejecimiento = {
  abiertas: number;
  rangos: RangoDeEdad[];
  cierresPorSemana: number;
  backlogEnSemanas: number | null;
  masAntiguas: OrdenAntigua[];
};

export type DesgasteActivo = {
  activoId: number;
  nombreActivo: string;
  cliente: string;
  modelo: string;
  intervalosDias: number[];
  promedioDias: number;
  pendienteDiasPorIntervalo: number;
  seAcortan: boolean;
  unidadUso: "horas" | "kilometros";
  usoPromedioEntreFallas: number | null;
};

export type Desgaste = {
  minimoDeIntervalos: number;
  activos: DesgasteActivo[];
  datosInsuficientes: boolean;
};

export type EvidenciaDeAviso = {
  valor: number;
  umbral: number;
  unidad: string;
  ventanaDias: number | null;
  muestra: number;
};

export type Aviso = {
  regla: string;
  severidad: "atencion" | "critico";
  titulo: string;
  detalle: string;
  evidencia: EvidenciaDeAviso;
  activoId: number | null;
  enlaceEstado: string | null;
};

export type Avisos = { total: number; criticos: number; avisos: Aviso[] };

export type ReglaAviso = {
  codigo: string;
  nombre: string;
  activa: boolean;
  umbral: number;
  umbralCritico: number | null;
  ventanaDias: number | null;
  ventanaCriticaDias: number | null;
  minimoDatos: number;
};
