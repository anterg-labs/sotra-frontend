export type RepuestoDeModelo = {
  repuestoId: number;
  codigo: string;
  repuesto: string;
  ordenesAsociadas: number;
  ordenesSuministradas: number;
};

export type ModeloConRepuestos = {
  modeloId: number;
  modelo: string;
  tipoMaquinaId: number;
  tipoMaquina: string;
  repuestos: RepuestoDeModelo[];
};

export type RepuestosPorModelo = {
  fechaDesde: string | null;
  fechaHasta: string | null;
  modelos: ModeloConRepuestos[];
};
