export type EstadoModeloMaquina = "activo" | "inactivo";

export type ModeloMaquina = {
  id: number;
  nombre: string;
  tipoMaquinaId: number;
  nombreTipoMaquina?: string | null;
  descripcion: string | null;
  estado: EstadoModeloMaquina;
};

export type CrearModeloMaquinaInput = {
  nombre: string;
  tipoMaquinaId: number;
  descripcion: string | null;
};

export type ActualizarModeloMaquinaInput = {
  nombre: string;
  tipoMaquinaId: number;
  descripcion: string | null;
  estado: EstadoModeloMaquina;
};

export type FiltrosModelosMaquina = {
  buscar: string;
  tipoMaquinaId: string;
  estado: string;
  pagina: number;
};

/** Datos que envía el formulario: en el alta el estado es siempre `activo` y la acción lo ignora. */
export type GuardarModeloMaquinaInput = CrearModeloMaquinaInput & {
  estado: EstadoModeloMaquina;
};
