export type EstadoActivo = "activo" | "inactivo";

export type Activo = {
  id: number;
  nombre: string;
  numeroSerie: string;
  descripcion: string;
  estado: EstadoActivo;
  clienteId: number;
  nombreCliente: string;
};

export type CrearActivoInput = {
  nombre: string;
  numeroSerie: string;
  descripcion: string;
  clienteId: number;
};

export type ActualizarActivoInput = CrearActivoInput;
