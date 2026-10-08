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

export type RepuestoDeOrden = {
  id: number;
  codigo: string;
  nombre: string;
};

export type HistorialEstadoOrdenTrabajo = {
  estado: EstadoOrdenTrabajo;
  fechaHora: string;
  observacion: string | null;
};

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
  sugerencias: string[];
  repuestos: RepuestoDeOrden[];
  estadosSiguientes: EstadoOrdenTrabajo[];
  historialEstados: HistorialEstadoOrdenTrabajo[];
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
  sugerencias: string[];
  repuestosIds: number[];
  estado: EstadoOrdenTrabajo;
  motivoEstado: string;
};

export type SolicitarSugerenciaInput = {
  descripcion: string;
  numero: number;
};

export type SugerenciaOrdenTrabajo = {
  sugerencia: string;
};

export type ActualizarOrdenTrabajoInput = CrearOrdenTrabajoInput;

export type FiltrosOrdenesTrabajo = {
  buscar: string;
  clienteId: string;
  activoId: string;
  tecnicoId: string;
  estado: string;
  prioridad: string;
  tipo: string;
  fechaDesde: string;
  fechaHasta: string;
  pagina: number;
};
