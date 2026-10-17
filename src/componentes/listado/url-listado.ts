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
export function construirUrlListado(ruta: string, filtros: Record<string, string | number>) {
  const parametros = new URLSearchParams();
  for (const [nombre, valor] of Object.entries(filtros)) {
    const texto = String(valor).trim();
    if (texto === "" || (nombre === "pagina" && texto === "1")) continue;
    parametros.set(nombre, texto);
  }
  const consulta = parametros.toString();
  return consulta === "" ? ruta : ruta + "?" + consulta;
}
