export type TipoEvidencia = "foto" | "documento" | "observacion";

export type Evidencia = {
  id: number;
  ordenTrabajoId: number;
  tipo: TipoEvidencia;
  observacion: string;
  fechaRegistro: string;
  creadoEn: string;
  nombreArchivo: string | null;
  tipoContenido: string | null;
  tieneArchivo: boolean;
};

export type CrearEvidenciaInput = {
  tipo: string;
  observacion: string;
  fechaRegistro: string;
  archivo: File | null;
};
