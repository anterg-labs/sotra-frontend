export type TerminosCondiciones = {
  id: number;
  version: number;
  texto: string;
  vigente: boolean;
  creadoEn: string;
};

export type EstadoTerminos = {
  vigente: TerminosCondiciones;
  pendiente: boolean;
  versionAceptada: number | null;
  aceptadoEn: string | null;
};

export type AceptarTerminosInput = { usuarioId: number; terminosId: number; version: number; acepta: boolean };

export type PublicarTerminosInput = {
  texto: string;
};

/** Resultado de pedir el texto vigente desde el navegador (por ejemplo, el modal del pie). */
export type ResultadoTerminosVigentes =
  | { estado: "listo"; terminos: TerminosCondiciones }
  | { estado: "vacio" }
  | { estado: "error" };
