export type EstadoModeloMaquina = "activo" | "inactivo";

export type ModeloMaquina = {
  id: number;
  nombre: string;
  tipoMaquinaId: number;
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
