export type DocumentoTecnico = {
  id: number;
  nombreArchivo: string;
  activoId: number | null;
  nombreActivo: string | null;
  usaSugerenciasIA: boolean;
  cantidadFragmentos: number;
  creadoEn: string;
};

export type CrearDocumentoTecnicoInput = {
  archivo: File | null;
  activoId: number | null;
  usaSugerenciasIA: boolean;
};

export type FiltrosDocumentosTecnicos = {
  buscar: string;
  activoId: string;
  pagina: number;
};
