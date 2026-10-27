export const TIPOS_DOCUMENTO = [
  "normativa",
  "procedimiento_interno",
  "manual_tecnico",
  "politica_seguridad",
  "otro",
] as const;

export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number];

export const TIPO_DOCUMENTO_POR_DEFECTO: TipoDocumento = "manual_tecnico";
export const LARGO_MAXIMO_TITULO_DOCUMENTO = 200;
export const LARGO_MAXIMO_DESCRIPCION_DOCUMENTO = 1000;

const ETIQUETAS_TIPO_DOCUMENTO: Record<TipoDocumento, string> = {
  normativa: "Normativa",
  procedimiento_interno: "Procedimiento interno",
  manual_tecnico: "Manual técnico",
  politica_seguridad: "Política de seguridad",
  otro: "Otro",
};

export function obtenerEtiquetaTipoDocumento(tipo: string) {
  return tipo in ETIQUETAS_TIPO_DOCUMENTO ? ETIQUETAS_TIPO_DOCUMENTO[tipo as TipoDocumento] : tipo;
}

export function esTipoDocumento(valor: string): valor is TipoDocumento {
  return (TIPOS_DOCUMENTO as readonly string[]).includes(valor);
}

/** Procesamiento para las sugerencias de IA: se hace en segundo plano después de subir el PDF. */
export type EstadoProcesamiento = "pendiente" | "procesando" | "listo" | "error";

/** El documento todavía no terminó de procesarse: conviene volver a consultarlo. */
export function seEstaProcesando(documento: Pick<DocumentoTecnico, "usaSugerenciasIA" | "estadoProcesamiento">) {
  return documento.usaSugerenciasIA && (documento.estadoProcesamiento === "pendiente" || documento.estadoProcesamiento === "procesando");
}

export type DocumentoTecnico = {
  id: number;
  nombreArchivo: string;
  titulo: string;
  tipo: TipoDocumento;
  descripcion: string | null;
  vigente: boolean;
  activoId: number | null;
  nombreActivo: string | null;
  modeloMaquinaId: number | null;
  nombreModelo: string | null;
  usaSugerenciasIA: boolean;
  cantidadFragmentos: number;
  creadoEn: string;
  estadoProcesamiento: EstadoProcesamiento;
  codigoErrorProcesamiento: string | null;
  mensajeErrorProcesamiento: string | null;
};

export type CrearDocumentoTecnicoInput = {
  archivo: File | null;
  titulo: string;
  tipo: TipoDocumento;
  descripcion: string;
  activoId: number | null;
  modeloMaquinaId: number | null;
  usaSugerenciasIA: boolean;
};

export type ActualizarDocumentoTecnicoInput = {
  titulo: string | null;
  tipo: TipoDocumento;
  descripcion: string | null;
  activoId: number | null;
  modeloMaquinaId: number | null;
};

export type FiltrosDocumentosTecnicos = {
  buscar: string;
  activoId: string;
  modeloMaquinaId: string;
  tipo: string;
  /** Vacío, "true" (solo vigentes) o "false" (solo obsoletos). */
  vigente: string;
  pagina: number;
  ordenarPor?: string;
  direccionOrden?: "asc" | "desc" | "";
};
