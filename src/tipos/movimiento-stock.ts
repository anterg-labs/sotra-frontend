export type TipoMovimientoStock = "ingreso" | "egreso" | "ajuste";

export type MovimientoStock = {
  id: number;
  repuestoId: number;
  codigoRepuesto: string;
  nombreRepuesto: string;
  tipo: TipoMovimientoStock;
  cantidad: number;
  fecha: string;
  ubicacion: string;
  usuarioId: number | null;
  nombreUsuario: string | null;
  motivo: string;
  observaciones: string;
  stockAnterior: number | null;
  stockPosterior: number | null;
};

export type FiltrosMovimientosStock = {
  buscar: string;
  repuestoId: string;
  tipo: string;
  fechaDesde: string;
  fechaHasta: string;
  ubicacion: string;
  usuarioId: string;
  pagina: number;
};

export type IngresoStockInput = {
  cantidad: number;
  fecha: string;
  motivo: string;
  ubicacion: string;
  observaciones: string;
};
