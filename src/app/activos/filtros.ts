import {
  construirUrlListado,
  leerEstado,
  leerIdFiltro,
  leerPagina,
  primerValor,
  type ParametrosBusqueda,
} from "@/componentes/listado/url-listado";
import type { FiltrosActivos } from "@/tipos/activo";

export const RUTA_ACTIVOS = "/activos";

export function leerFiltrosActivos(parametros: ParametrosBusqueda): FiltrosActivos {
  return {
    buscar: primerValor(parametros.buscar),
    clienteId: leerIdFiltro(parametros, "clienteId"),
    modeloMaquinaId: leerIdFiltro(parametros, "modeloMaquinaId"),
    estado: leerEstado(parametros),
    pagina: leerPagina(parametros),
  };
}

export function construirUrlActivos(filtros: FiltrosActivos) {
  return construirUrlListado(RUTA_ACTIVOS, filtros);
}
