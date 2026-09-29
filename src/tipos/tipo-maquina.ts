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
