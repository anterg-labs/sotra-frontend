export type ActivoEdadUso = {
  activoId: number;
  nombreActivo: string;
  modelo: string;
  edadAnios: number | null;
  lecturaUso: number | null;
  unidadUso: "horas" | "kilometros";
  fechaLectura: string | null;
  correctivas: number;
  ordenesObservadas: number;
};

export type DesgasteEdadUso = {
  fechaDesde: string | null;
  fechaHasta: string | null;
  totalActivos: number;
  conEdad: number;
  conUso: number;
  activos: ActivoEdadUso[];
};
