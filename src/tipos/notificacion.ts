export type TipoNotificacion = "orden_asignada" | "orden_cambio_estado" | "orden_en_revision";

export type Notificacion = {
  id: number;
  tipo: TipoNotificacion;
  mensaje: string;
  /** Orden de trabajo a la que se refiere, si corresponde. */
  ordenId: number | null;
  /** Instante en que se generó (ISO 8601, UTC). */
  creadaEn: string;
  leida: boolean;
};

export type NoLeidas = {
  total: number;
};
