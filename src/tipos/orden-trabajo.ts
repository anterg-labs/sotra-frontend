export type EstadoOrdenTrabajo =
  | "creada"
  | "asignada"
  | "en_ejecucion"
  | "pausada"
  | "finalizada"
  | "cerrada"
  | "cancelada";

export type TipoOrdenTrabajo = "preventivo" | "correctivo";

export type PrioridadOrdenTrabajo = "baja" | "media" | "alta";

export const estadosOrdenTrabajo: EstadoOrdenTrabajo[] = [
  "creada",
  "asignada",
  "en_ejecucion",
  "pausada",
  "finalizada",
  "cerrada",
  "cancelada",
];

export type OrdenTrabajo = {
  id: number;
  clienteId: number;
  nombreCliente: string;
  activoId: number;
  nombreActivo: string;
  tecnicoId: number | null;
  nombreTecnico: string | null;
  tipo: TipoOrdenTrabajo;
  prioridad: PrioridadOrdenTrabajo;
  descripcion: string;
  observaciones: string;
  fechaPrevistaEjecucion: string;
  estado: EstadoOrdenTrabajo;
  creadoEn: string;
  fechaInicio: string | null;
  fechaCierre: string | null;
  recomendacionIa: string;
};

export type CrearOrdenTrabajoInput = {
  clienteId: number;
  activoId: number;
  tecnicoId: number | null;
  tipo: TipoOrdenTrabajo;
  prioridad: PrioridadOrdenTrabajo;
  descripcion: string;
  observaciones: string;
  fechaPrevistaEjecucion: string;
};

export type ActualizarOrdenTrabajoInput = CrearOrdenTrabajoInput;
