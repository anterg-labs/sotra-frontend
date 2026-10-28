export type MesEstacionalidad = { mes: number; correctivas: number };
export type TipoEstacionalidad = { tipoMaquinaId: number; tipoMaquina: string; total: number; meses: MesEstacionalidad[] };
export type Estacionalidad = {
  fechaDesde: string | null;
  fechaHasta: string | null;
  total: number;
  meses: MesEstacionalidad[];
  tipos: TipoEstacionalidad[];
};
