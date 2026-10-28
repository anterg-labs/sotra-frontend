import type { FiltrosIndicadores } from "@/tipos/reporte";
import type { EtapaDemora, UmbralEtapa } from "@/tipos/demoras-etapas";
import { construirConsultaAnalisis } from "./consultas-reportes";
import { crearOpcionesJson, leerDatosApi } from "./solicitudes-http";
import { leerDemorasEtapas, leerUmbralesEtapa } from "./contrato-demoras-etapas";

const RUTA = "/api/v1/reportes/demoras-etapas";
export async function apiObtenerDemorasEtapas(filtros: FiltrosIndicadores, pagina = 1, etapa: EtapaDemora | "" = "") {
  const extra: Record<string, string> = { pagina: String(pagina) };
  if (etapa) extra.etapa = etapa;
  return leerDemorasEtapas(await leerDatosApi(RUTA + construirConsultaAnalisis(filtros, extra), { cache: "no-store" }, "No se pudieron obtener las demoras por etapa."));
}
export async function apiObtenerUmbralesEtapa() {
  return leerUmbralesEtapa(await leerDatosApi(RUTA + "/umbrales", { cache: "no-store" }, "No se pudieron obtener los umbrales por etapa."));
}
export async function apiGuardarUmbralEtapa(etapa: EtapaDemora, umbralHoras: number | null): Promise<UmbralEtapa> {
  const respuesta: unknown = await leerDatosApi(RUTA + "/umbrales/" + encodeURIComponent(etapa), crearOpcionesJson("PUT", { umbralHoras }), "No se pudo guardar el umbral.");
  return leerUmbralesEtapa([respuesta])[0];
}
