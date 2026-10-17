import { construirUrlListado, leerEstado, leerPagina, primerValor, type ParametrosBusqueda } from "@/componentes/listado/url-listado";
import type { FiltrosClientes } from "@/tipos/cliente";

export const RUTA_CLIENTES = "/clientes";

/** Convierte los `searchParams` de la URL en filtros válidos; lo que no se reconoce vuelve al valor por defecto. */
export function leerFiltrosClientes(parametros: ParametrosBusqueda): FiltrosClientes {
  return { buscar: primerValor(parametros.buscar), estado: leerEstado(parametros), pagina: leerPagina(parametros) };
}

export function construirUrlClientes(filtros: FiltrosClientes) {
  return construirUrlListado(RUTA_CLIENTES, filtros);
}
