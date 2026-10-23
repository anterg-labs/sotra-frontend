export type EstadoTipoMaquina = "activo" | "inactivo";

export type TipoMaquina = {
  id: number;
  nombre: string;
  estado: EstadoTipoMaquina;
};

export type CrearTipoMaquinaInput = {
  nombre: string;
};

export type ActualizarTipoMaquinaInput = {
  nombre: string;
  estado: EstadoTipoMaquina;
};

export type FiltrosTiposMaquina = {
  buscar: string;
  estado: string;
  pagina: number;
  ordenarPor?: string;
  direccionOrden?: "asc" | "desc" | "";
};

/** Datos que envía el formulario: en el alta el estado es siempre `activo` y la acción lo ignora. */
export type GuardarTipoMaquinaInput = {
  nombre: string;
  estado: EstadoTipoMaquina;
};
