import { construirUrlListado, leerOrden, leerPagina, primerValor, type ParametrosBusqueda } from "@/componentes/listado/url-listado";
import type { FiltrosClientes } from "@/tipos/cliente";

export const RUTA_CLIENTES = "/clientes";

/** Columnas por las que se puede ordenar; coinciden con las que acepta la API. */
export const COLUMNAS_ORDENABLES_CLIENTES = ["razonSocial", "nombreContacto", "correo", "telefono", "cantidadActivosAsociados", "cantidadOrdenesAsociadas", "estado"] as const;

/**
 * Por defecto el listado muestra solo los clientes activos: sin `estado` en la URL se filtra por «activo».
 * «Todos» se escribe `estado=todos` y llega a la API como sin filtro.
 */
function leerEstadoClientes(parametros: ParametrosBusqueda): FiltrosClientes["estado"] {
  const estado = primerValor(parametros.estado);
  if (estado === "inactivo") return "inactivo";
  return estado === "todos" ? "" : "activo";
}

/** Cómo se escribe el estado en la URL (lo que es el valor por defecto no se escribe). */
export function estadoClientesParaUrl(estado: FiltrosClientes["estado"]) {
  if (estado === "") return "todos";
  return estado === "activo" ? "" : estado;
}

/** Convierte los `searchParams` de la URL en filtros válidos; lo que no se reconoce vuelve al valor por defecto. */
export function leerFiltrosClientes(parametros: ParametrosBusqueda): FiltrosClientes {
  return {
    buscar: primerValor(parametros.buscar),
    estado: leerEstadoClientes(parametros),
    conActivos: primerValor(parametros.conActivos) === "true",
    pagina: leerPagina(parametros),
    ...leerOrden(parametros, COLUMNAS_ORDENABLES_CLIENTES),
  };
}

export function construirUrlClientes(filtros: FiltrosClientes) {
  return construirUrlListado(RUTA_CLIENTES, { ...filtros, estado: estadoClientesParaUrl(filtros.estado), conActivos: filtros.conActivos ? "true" : "" });
}
