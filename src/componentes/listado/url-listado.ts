export type ParametrosBusqueda = Record<string, string | string[] | undefined>;

export function primerValor(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? (valor[0] ?? "") : (valor ?? "");
}

/** Estado de la URL: solo se aceptan `activo` e `inactivo`; cualquier otro valor equivale a «todos». */
export function leerEstado(parametros: ParametrosBusqueda) {
  const estado = primerValor(parametros.estado);
  return estado === "activo" || estado === "inactivo" ? estado : "";
}

/** Página de la URL: entero mayor o igual a 1; si no, la primera. */
export function leerPagina(parametros: ParametrosBusqueda) {
  const pagina = Number(primerValor(parametros.pagina));
  return Number.isInteger(pagina) && pagina >= 1 ? pagina : 1;
}

/** Identificador numérico de un filtro (por ejemplo `clienteId`): solo dígitos; si no, vacío. */
export function leerIdFiltro(parametros: ParametrosBusqueda, nombre: string) {
  const valor = primerValor(parametros[nombre]);
  return /^\d+$/.test(valor) ? valor : "";
}

/** URL del listado con los filtros aplicados; omite los vacíos y la página 1. */
export function construirUrlListado(ruta: string, filtros: Record<string, string | number | undefined>) {
  const parametros = new URLSearchParams();
  const hayOrden = String(filtros.ordenarPor ?? "").trim() !== "";
  for (const [nombre, valor] of Object.entries(filtros)) {
    if (valor === undefined || (nombre === "direccionOrden" && !hayOrden)) continue;
    const texto = String(valor).trim();
    if (texto === "" || (nombre === "pagina" && texto === "1")) continue;
    parametros.set(nombre, texto);
  }
  const consulta = parametros.toString();
  return consulta === "" ? ruta : ruta + "?" + consulta;
}

export type DireccionOrden = "asc" | "desc";

/** Orden elegido en una tabla: `ordenarPor` vacío significa el orden por defecto del listado. */
export type OrdenListado = { ordenarPor: string; direccionOrden: DireccionOrden | "" };

/** Orden de la URL: solo se acepta una columna de la lista del listado y `asc` o `desc`; si no hay, no se agrega nada y rige el orden por defecto. */
export function leerOrden(parametros: ParametrosBusqueda, columnasValidas: readonly string[]): Partial<OrdenListado> {
  const columna = primerValor(parametros.ordenarPor);
  if (!columnasValidas.includes(columna)) return {};
  return { ordenarPor: columna, direccionOrden: primerValor(parametros.direccionOrden) === "desc" ? "desc" : "asc" };
}

/** Orden de una URL del listado (`?ordenarPor=&direccionOrden=`); sin `ordenarPor` es el orden por defecto. */
export function leerOrdenDeUrl(url: string): OrdenListado {
  const parametros = new URL(url, "http://localhost").searchParams;
  const direccion = parametros.get("direccionOrden");
  return { ordenarPor: parametros.get("ordenarPor") ?? "", direccionOrden: direccion === "desc" ? "desc" : direccion === "asc" ? "asc" : "" };
}

/** Un clic ordena la columna de forma ascendente, otro la invierte y un tercero vuelve al orden por defecto. */
export function siguienteOrden(actual: OrdenListado, columna: string): OrdenListado {
  if (actual.ordenarPor !== columna) return { ordenarPor: columna, direccionOrden: "asc" };
  if (actual.direccionOrden === "asc") return { ordenarPor: columna, direccionOrden: "desc" };
  return { ordenarPor: "", direccionOrden: "" };
}

/** Parámetros de orden para la API: con columna elegida se envía su dirección; si no, el orden por defecto que pase cada listado. */
export function parametrosDeOrden(orden: Partial<OrdenListado> | undefined, direccionPorDefecto?: DireccionOrden) {
  const parametros: [string, string][] = [];
  if (orden?.ordenarPor) {
    parametros.push(["ordenarPor", orden.ordenarPor], ["direccionOrden", orden.direccionOrden === "desc" ? "desc" : "asc"]);
  } else if (direccionPorDefecto) {
    parametros.push(["direccionOrden", direccionPorDefecto]);
  }
  return parametros;
}
