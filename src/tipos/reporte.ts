import type { OrdenTrabajo } from "@/tipos/orden-trabajo";
import type { Repuesto } from "@/tipos/repuesto";

export type CantidadPorGrupo = {
  nombre: string;
  cantidad: number;
};

export type FiltrosIndicadores = {
  fechaDesde: string;
  fechaHasta: string;
  tecnicoId: string;
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
  ordenesPorTecnico: CantidadPorGrupo[];
  activosConMasIntervenciones: CantidadPorGrupo[];
  repuestosBajoStock: Repuesto[];
  promedioHorasHastaInicio: number | null;
  promedioHorasHastaCierre: number | null;
  ordenesAltaPrioridadPendientes: number;
  ordenesPendientesDeValidacion: number;
  ordenesRecientes: OrdenTrabajo[];
};

export type AgrupacionTendencias = "semana" | "mes";

export type PuntoTendencia = {
  periodo: string;
  preventivas: number;
  correctivas: number;
  total: number;
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

export type Tiempos = {
  duracion: Duracion;
  etapas: EtapaTiempo[];
  cumplimiento: Cumplimiento;
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
    pausas: { cantidad: number; ordenesConPausa: number; duracionPromedioHoras: number | null; motivos: MotivoDeProceso[] };
    devoluciones: { cantidad: number; ordenesDevueltas: number; porcentajeDeOrdenes: number | null; motivos: MotivoDeProceso[] };
    reasignaciones: { cantidad: number; ordenesReasignadas: number };
  };
  maquinaria: { porTipo: MaquinariaDesempeno[]; activos: MaquinariaDesempeno[] };
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
