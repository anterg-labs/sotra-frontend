export type EstadoRepuesto = "activo" | "inactivo";

export type Repuesto = {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  marca: string;
  ubicacion: string;
  cantidad: number;
  cantidadMinima: number;
  estado: EstadoRepuesto;
};

export type CrearRepuestoInput = {
  codigo: string;
  nombre: string;
  descripcion: string;
  marca: string;
  ubicacion: string;
  cantidad: number;
  cantidadMinima: number;
};

export type ActualizarRepuestoInput = CrearRepuestoInput;

export type FiltrosRepuestos = {
  buscar: string;
  estado: string;
  ubicacion: string;
  bajoStock: boolean;
  pagina: number;
};
