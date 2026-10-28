import type { DemorasEtapas, EstadisticaEtapa, EtapaDemora, OrdenDemoradaEtapa, UmbralEtapa } from "@/tipos/demoras-etapas";

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}
const esNumero = (valor: unknown): valor is number => typeof valor === "number" && Number.isFinite(valor) && valor >= 0;
const esOpcional = (valor: unknown) => valor === null || esNumero(valor);
const esEntero = (valor: unknown) => esNumero(valor) && Number.isInteger(valor);
export function esEtapa(valor: unknown): valor is EtapaDemora {
  return valor === "pendiente" || valor === "en_progreso" || valor === "revision" || valor === "pausa";
}
function esEstadistica(valor: unknown): valor is EstadisticaEtapa {
  return esObjeto(valor) && esEtapa(valor.etapa) && typeof valor.nombre === "string"
    && esEntero(valor.cantidadOrdenes) && esEntero(valor.muestraHistorica) && esEntero(valor.demoradas)
    && esOpcional(valor.promedioHoras) && esOpcional(valor.medianaHoras) && esOpcional(valor.percentil90Horas)
    && esOpcional(valor.promedioHistoricoHoras) && esOpcional(valor.umbralHoras)
    && ["configurado", "historico", "sin_datos"].includes(String(valor.origenUmbral));
}
function esOrden(valor: unknown): valor is OrdenDemoradaEtapa {
  return esObjeto(valor) && esEntero(valor.ordenId) && esEntero(valor.activoId) && typeof valor.nombreActivo === "string"
    && esEtapa(valor.etapa) && esNumero(valor.horas) && esNumero(valor.umbralHoras) && esNumero(valor.excesoHoras)
    && typeof valor.enCurso === "boolean";
}
export function leerDemorasEtapas(valor: unknown): DemorasEtapas {
  if (esObjeto(valor) && typeof valor.calculadoEn === "string" && Number.isFinite(Date.parse(valor.calculadoEn))
    && Array.isArray(valor.etapas) && valor.etapas.length === 4 && valor.etapas.every(esEstadistica)
    && new Set(valor.etapas.map(e => e.etapa)).size === 4
    && esObjeto(valor.demoradas) && Array.isArray(valor.demoradas.elementos) && valor.demoradas.elementos.every(esOrden)
    && esEntero(valor.demoradas.pagina) && esEntero(valor.demoradas.tamanoPagina)
    && esEntero(valor.demoradas.totalElementos) && esEntero(valor.demoradas.totalPaginas)) {
    return { calculadoEn: valor.calculadoEn, etapas: valor.etapas, demoradas: {
      elementos: valor.demoradas.elementos, pagina: Number(valor.demoradas.pagina), tamanoPagina: Number(valor.demoradas.tamanoPagina),
      totalElementos: Number(valor.demoradas.totalElementos), totalPaginas: Number(valor.demoradas.totalPaginas),
    } };
  }
  throw new Error("La respuesta de demoras por etapa no tiene el formato esperado.");
}
export function leerUmbralesEtapa(valor: unknown): UmbralEtapa[] {
  if (!Array.isArray(valor) || !valor.every((item): item is UmbralEtapa => esObjeto(item) && esEtapa(item.etapa) && esOpcional(item.umbralHoras))) {
    throw new Error("La respuesta de umbrales por etapa no tiene el formato esperado.");
  }
  return valor;
}
