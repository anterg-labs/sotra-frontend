import { construirUrlListado, leerEstado, leerOrden, leerPagina, primerValor, type ParametrosBusqueda } from "@/componentes/listado/url-listado";
import type { FiltrosClientes } from "@/tipos/cliente";

export const RUTA_CLIENTES = "/clientes";

/** Columnas por las que se puede ordenar; coinciden con las que acepta la API. */
export const COLUMNAS_ORDENABLES_CLIENTES = ["razonSocial", "nombreContacto", "correo", "telefono", "cantidadActivosAsociados", "cantidadOrdenesAsociadas", "estado"] as const;

/** Convierte los `searchParams` de la URL en filtros válidos; lo que no se reconoce vuelve al valor por defecto. */
export function leerFiltrosClientes(parametros: ParametrosBusqueda): FiltrosClientes {
  return {
    buscar: primerValor(parametros.buscar),
    estado: leerEstado(parametros),
    pagina: leerPagina(parametros),
    ...leerOrden(parametros, COLUMNAS_ORDENABLES_CLIENTES),
  };
}

export function construirUrlClientes(filtros: FiltrosClientes) {
  return construirUrlListado(RUTA_CLIENTES, filtros);
}
