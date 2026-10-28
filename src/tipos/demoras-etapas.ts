import type { Pagina } from "./pagina";

export const NOMBRES_ETAPA = { pendiente: "Pendiente", en_progreso: "En progreso", revision: "Revisión", pausa: "Pausa" } as const;
export type EtapaDemora = keyof typeof NOMBRES_ETAPA;
export type UmbralEtapa = { etapa: EtapaDemora; umbralHoras: number | null };
export type EstadisticaEtapa = {
  etapa: EtapaDemora;
  nombre: string;
  cantidadOrdenes: number;
  promedioHoras: number | null;
  medianaHoras: number | null;
  percentil90Horas: number | null;
  promedioHistoricoHoras: number | null;
  muestraHistorica: number;
  umbralHoras: number | null;
  origenUmbral: "configurado" | "historico" | "sin_datos";
  demoradas: number;
};
export type OrdenDemoradaEtapa = {
  ordenId: number;
  activoId: number;
  nombreActivo: string;
  etapa: EtapaDemora;
  horas: number;
  umbralHoras: number;
  excesoHoras: number;
  enCurso: boolean;
};
export type DemorasEtapas = { calculadoEn: string; etapas: EstadisticaEtapa[]; demoradas: Pagina<OrdenDemoradaEtapa> };
