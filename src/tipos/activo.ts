export type EstadoActivo = "activo" | "inactivo";

export type Activo = {
  id: number;
  clienteId: number;
  nombreCliente?: string | null;
  numSerie: string;
  descripcion: string | null;
  modeloMaquinaId: number;
  nombreModeloMaquina?: string | null;
  tipoMaquinaId?: number | null;
  nombreTipoMaquina?: string | null;
  anioFabricacion: number | null;
  nombre: string | null;
  ubicacion: string | null;
  /** Cómo se mide el uso de la máquina: horas (horómetro) o kilómetros (odómetro). */
  unidadUso?: "horas" | "kilometros";
  estado: EstadoActivo;
};

export type CrearActivoInput = {
  clienteId: number;
  numSerie: string;
  descripcion: string | null;
  modeloMaquinaId: number;
  anioFabricacion: number | null;
  nombre: string | null;
  ubicacion: string | null;
  unidadUso?: "horas" | "kilometros";
};

export type ActualizarActivoInput = {
  clienteId: number;
  numSerie: string;
  descripcion: string | null;
  modeloMaquinaId: number;
  anioFabricacion: number | null;
  nombre: string | null;
  ubicacion: string | null;
  unidadUso?: "horas" | "kilometros";
  estado: EstadoActivo;
};

export type FiltrosActivos = {
  buscar: string;
  clienteId: string;
  modeloMaquinaId: string;
  estado: string;
  pagina: number;
  ordenarPor?: string;
  direccionOrden?: "asc" | "desc" | "";
};

/** Datos que envía el formulario: en el alta el estado es siempre `activo` y la acción lo ignora. */
export type GuardarActivoInput = CrearActivoInput & {
  estado: EstadoActivo;
};
