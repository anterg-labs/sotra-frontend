export type RepuestoConsumido = {
  repuestoId: number;
  codigo: string;
  repuesto: string;
  unidades: number;
  ordenes: number;
};

export type ConsumoDeRepuestos = {
  fechaDesde: string | null;
  fechaHasta: string | null;
  totalUnidades: number;
  repuestos: RepuestoConsumido[];
};
