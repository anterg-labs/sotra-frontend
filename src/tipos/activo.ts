export type EstadoActivo = "activo" | "inactivo";

export type Activo = {
  id: number;
  clienteId: number;
  numSerie: string;
  descripcion: string | null;
  modeloMaquinaId: number;
  anioFabricacion: number | null;
  nombre: string | null;
  ubicacion: string | null;
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
};

export type ActualizarActivoInput = {
  clienteId: number;
  numSerie: string;
  descripcion: string | null;
  modeloMaquinaId: number;
  anioFabricacion: number | null;
  nombre: string | null;
  ubicacion: string | null;
  estado: EstadoActivo;
};
