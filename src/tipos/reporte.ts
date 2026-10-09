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
