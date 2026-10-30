export type EstadoRepuesto = "activo" | "inactivo";

export type EstadoStock = "normal" | "bajo" | "sin_stock";

export type AlertasStock = {
  bajo: number;
  sinStock: number;
  total: number;
};

export type Repuesto = {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  marca: string;
  ubicacion: string;
  /** Categoría o tipo; vacío si no se cargó. */
  categoria: string;
  /** Modelo de máquina o compatibilidad; vacío si no se cargó. */
  modeloCompatibilidad: string;
  /** Unidad de medida (por ejemplo `unidad`, `litro` o `metro`). */
  unidadMedida: string;
  observaciones: string;
  cantidad: number;
  cantidadMinima: number;
  /** Reservadas por órdenes que todavía no empezaron: siguen en la empresa pero no se pueden asignar a otra orden. */
  cantidadReservada: number;
  /** Entregadas a órdenes en curso: se descuentan del stock al cerrar la orden. */
  cantidadEntregada: number;
  /** Lo que se puede asignar a una orden: el stock menos lo reservado y lo entregado. */
  cantidadDisponible: number;
  estado: EstadoRepuesto;
  estadoStock: EstadoStock;
};

export type CrearRepuestoInput = {
  codigo: string;
  nombre: string;
  descripcion: string | null;
  marca: string | null;
  ubicacion: string | null;
  categoria: string | null;
  modeloCompatibilidad: string | null;
  /** Si va vacía, la API la guarda como `unidad`. */
  unidadMedida: string | null;
  observaciones: string | null;
  cantidad: number;
  cantidadMinima: number;
};

export type ActualizarRepuestoInput = CrearRepuestoInput;

export type FiltrosRepuestos = {
  buscar: string;
  estado: string;
  ubicacion: string;
  categoria?: string;
  bajoStock: boolean;
  estadoStock?: EstadoStock | "";
  orden?: "criticidad";
  ordenarPor?: string;
  direccionOrden?: "asc" | "desc" | "";
  pagina: number;
};
