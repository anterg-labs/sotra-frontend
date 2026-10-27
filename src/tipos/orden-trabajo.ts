/** El valor de un estado lo define el catálogo de la base (`estado_ot`): el frontend no conoce la lista. */
export type EstadoOrdenTrabajo = string;

export type FaseEstadoOrden = "pendiente" | "en_curso" | "por_validar" | "cerrada" | "eliminada";

/** Cómo se llama cada fase en la interfaz (las fases las define la base; aquí solo su texto). */
export const ETIQUETAS_FASE_ORDEN: Record<FaseEstadoOrden, string> = {
  pendiente: "Pendientes",
  en_curso: "En curso",
  por_validar: "Por validar",
  cerrada: "Cerradas",
  eliminada: "Eliminadas",
};

export type TonoEstadoOrden = "neutro" | "info" | "alerta" | "exito" | "peligro" | "destacado";

export type TipoOrdenTrabajo = "preventivo" | "correctivo";

export type PrioridadOrdenTrabajo = "baja" | "media" | "alta";

/** Un estado del catálogo que entrega la API (`GET /api/v1/ordenes-trabajo/estados`, tabla `estado_ot`). */
export type OpcionEstadoOrden = {
  valor: EstadoOrdenTrabajo;
  etiqueta: string;
  orden: number;
  fase: FaseEstadoOrden;
  tono: TonoEstadoOrden;
};

/** Un paso permitido desde el estado actual de la orden (tabla `transicion_estado_ot`). */
export type TransicionOrden = {
  estado: EstadoOrdenTrabajo;
  exigeMotivo: boolean;
  puedeTecnico: boolean;
  accion: string | null;
  principal: boolean;
};

export type RepuestoDeOrden = {
  id: number;
  codigo: string;
  nombre: string;
};

/** Un cambio de estado: de qué estado vino (`null` en el alta), a cuál pasó, cuándo, quién lo hizo y el motivo. */
export type HistorialEstadoOrdenTrabajo = {
  estado: EstadoOrdenTrabajo;
  estadoAnterior: EstadoOrdenTrabajo | null;
  fechaHora: string;
  observacion: string | null;
  usuarioId: number | null;
  nombreUsuario: string | null;
};

/** Una asignación o cambio de técnico: de quién a quién (`null` en la primera asignación), quién lo hizo y cuándo. */
export type HistorialTecnicoOrdenTrabajo = {
  tecnicoAnteriorId: number | null;
  nombreTecnicoAnterior: string | null;
  tecnicoId: number | null;
  nombreTecnico: string | null;
  fechaHora: string;
  usuarioId: number | null;
  nombreUsuario: string | null;
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
  transiciones: TransicionOrden[];
  historialEstados: HistorialEstadoOrdenTrabajo[];
  historialTecnicos: HistorialTecnicoOrdenTrabajo[];
  version: string;
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
  sesion: string;
};

export type SolicitarSugerenciaInput = {
  descripcion: string;
  numero: number;
  sesion: string;
  /** Con activo, la búsqueda usa solo la documentación de esa máquina y la general. */
  activoId?: number | null;
};

/** Cómo se redactó la sugerencia: resumen de la IA, texto del manual con la IA caída o resumen descartado. */
export type ModoSugerencia = "ia" | "sin_ia" | "descartada";

export type SugerenciaOrdenTrabajo = {
  sugerencia: string;
  modo?: ModoSugerencia;
};

export type SugerenciaObtenida = {
  texto: string;
  /** El asistente de IA no respondió: el texto es el del manual sin resumir y hay que avisarlo. */
  sinIa: boolean;
};

export type ActualizarOrdenTrabajoInput = CrearOrdenTrabajoInput;

export type FiltrosOrdenesTrabajo = {
  buscar: string;
  clienteId: string;
  activoId: string;
  tecnicoId: string;
  estado: string;
  /** Fase del estado: trae las órdenes de todos los estados de esa fase. */
  fase?: string;
  prioridad: string;
  tipo: string;
  fechaDesde: string;
  fechaHasta: string;
  conSugerencias: boolean;
  pagina: number;
  ordenarPor?: string;
  direccionOrden?: "asc" | "desc" | "";
};
