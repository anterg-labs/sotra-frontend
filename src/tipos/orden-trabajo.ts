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

/** Ciclo de un repuesto en una orden: reservado al asignarlo, entregado cuando la orden empieza, descontado al cerrarla. */
export type EstadoRepuestoDeOrden = "reservado" | "entregado" | "descontado";

export type RepuestoDeOrden = {
  id: number;
  codigo: string;
  nombre: string;
  cantidad: number;
  estado: EstadoRepuestoDeOrden;
};

/** Un repuesto y la cantidad que se pide para la orden (lo que viaja en el alta y la modificación). */
export type RepuestoPedido = {
  repuestoId: number;
  cantidad: number;
};

export type AccionRepuestoOrden = "reservar" | "modificar" | "entregar" | "descontar" | "liberar";

/** Un cambio de un repuesto en la orden: qué se hizo, con cuántas unidades, quién y cuándo. */
export type HistorialRepuestoOrdenTrabajo = {
  repuestoId: number;
  codigo: string;
  nombre: string;
  accion: AccionRepuestoOrden;
  cantidadAnterior: number | null;
  cantidadNueva: number;
  estadoAnterior: string | null;
  estadoNuevo: string;
  fechaHora: string;
  usuarioId: number | null;
  nombreUsuario: string | null;
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

/** Cómo se mide el uso de la máquina: horas (horómetro) o kilómetros (odómetro). */
export type UnidadDeUso = "horas" | "kilometros";

/** Un cambio de la lectura de uso de la orden: valor anterior (`null` la primera vez), valor nuevo, cuándo y quién. */
export type HistorialLecturaUsoOrden = {
  lecturaAnterior: number | null;
  lecturaNueva: number | null;
  fechaHora: string;
  usuarioId: number | null;
  nombreUsuario: string | null;
};

export type CausaFalla = { id: number; nombre: string; estado: "activo" | "inactivo" };

/** Motivo codificado de una pausa o devolución (`falta_repuesto`, `esperando_autorizacion`, `esperando_cliente`, `otro`). */
export type MotivoDeOrden = { codigo: string; descripcion: string };

export type OrdenTrabajo = {
  id: number;
  clienteId: number;
  nombreCliente: string;
  activoId: number;
  nombreActivo: string;
  /** Quién creó la orden (el responsable). */
  responsableId: number;
  nombreResponsable: string | null;
  tecnicoId: number | null;
  nombreTecnico: string | null;
  tipo: TipoOrdenTrabajo;
  prioridad: PrioridadOrdenTrabajo;
  descripcion: string;
  observaciones: string;
  fechaPrevistaEjecucion: string;
  tiempoEstimadoHoras?: number | null;
  causaFallaId?: number | null;
  causaFalla?: string | null;
  lecturaUso?: number | null;
  unidadUso?: UnidadDeUso;
  historialLecturaUso?: HistorialLecturaUsoOrden[];
  estado: EstadoOrdenTrabajo;
  creadoEn: string;
  fechaInicio: string | null;
  fechaCierre: string | null;
  sugerencias: string[];
  repuestos: RepuestoDeOrden[];
  transiciones: TransicionOrden[];
  historialEstados: HistorialEstadoOrdenTrabajo[];
  historialTecnicos: HistorialTecnicoOrdenTrabajo[];
  historialRepuestos: HistorialRepuestoOrdenTrabajo[];
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
  repuestos: RepuestoPedido[];
  estado: EstadoOrdenTrabajo;
  motivoEstado: string;
  sesion: string;
  /** Datos opcionales para los reportes; si no se envían, la API no cambia lo guardado. */
  tiempoEstimadoHoras?: number;
  causaFallaId?: number;
  lecturaUso?: number;
  motivoCodigo?: string;
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
  /** Solo órdenes en fase pendiente sin técnico asignado. */
  sinAsignar?: boolean;
  estado: string;
  /** Fase del estado: trae las órdenes de todos los estados de esa fase. */
  fase?: string;
  /** Solo órdenes pendientes, en curso o por validar (las que cuentan los listados de clientes y usuarios). */
  soloActivas?: boolean;
  prioridad: string;
  tipo: string;
  fechaDesde: string;
  fechaHasta: string;
  conSugerencias: boolean;
  /** `calendario` muestra las órdenes en un calendario por su fecha prevista; vacío es la lista. */
  vista?: string;
  /** Primer mes visible del calendario (`aaaa-mm`). */
  mes?: string;
  /** Cantidad de meses visibles del calendario (1 a 3). */
  meses?: string;
  /** El calendario incluye las órdenes eliminadas. */
  eliminadas?: boolean;
  pagina: number;
  ordenarPor?: string;
  direccionOrden?: "asc" | "desc" | "";
};

/** Una orden ubicada en el calendario por su fecha prevista de ejecución. */
export type CalendarioOrden = {
  id: number;
  fecha: string;
  nombreActivo: string;
  nombreCliente: string;
  tipo: TipoOrdenTrabajo;
  prioridad: PrioridadOrdenTrabajo;
  estado: EstadoOrdenTrabajo;
  fase: FaseEstadoOrden;
  vencida: boolean;
};

export type RespuestaCalendarioOrdenes = {
  desde: string;
  hasta: string;
  truncado: boolean;
  elementos: CalendarioOrden[];
};
