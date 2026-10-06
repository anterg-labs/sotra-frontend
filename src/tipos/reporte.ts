import type { Repuesto } from "@/tipos/repuesto";

export type CantidadPorGrupo = {
  nombre: string;
  cantidad: number;
};

export type Indicadores = {
  totalOrdenes: number;
  ordenesPorEstado: CantidadPorGrupo[];
  ordenesPorPrioridad: CantidadPorGrupo[];
  ordenesPorTipo: CantidadPorGrupo[];
  ordenesPorTecnico: CantidadPorGrupo[];
  activosConMasIntervenciones: CantidadPorGrupo[];
  repuestosBajoStock: Repuesto[];
};
