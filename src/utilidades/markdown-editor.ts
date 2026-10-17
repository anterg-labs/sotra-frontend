/**
 * Ediciones de Markdown sobre un texto y una selección, sin tocar el DOM. Cada función devuelve el tramo del texto
 * original a reemplazar (`desde`-`hasta`), el reemplazo y cómo debe quedar seleccionado el resultado (en coordenadas del texto nuevo).
 * El editor aplica el reemplazo con el mecanismo nativo del navegador para conservar deshacer y rehacer.
 */
export type Edicion = {
  desde: number;
  hasta: number;
  texto: string;
  seleccionDesde: number;
  seleccionHasta: number;
};

export type TipoBloque = "titulo" | "subtitulo" | "vinietas" | "numerada" | "cita";

const EJEMPLO = "texto";
const EJEMPLO_ENLACE = "texto del enlace";

const PROTOCOLOS_ENLACE = ["http:", "https:", "mailto:"];
const LARGO_MAXIMO_ENLACE = 2000;

/** Negrita (`**`) y cursiva (`*`): envuelve la selección, o inserta el marcador con un ejemplo seleccionado. Si ya está envuelta, lo quita. */
export function envolver(valor: string, desde: number, hasta: number, marcador: string): Edicion {
  const seleccion = valor.slice(desde, hasta);
  const largo = marcador.length;
  const esCursiva = marcador === "*";
  const empiezaConNegrita = (texto: string) => esCursiva && texto.startsWith("**");

  if (seleccion === "") {
    return {
      desde,
      hasta,
      texto: marcador + EJEMPLO + marcador,
      seleccionDesde: desde + largo,
      seleccionHasta: desde + largo + EJEMPLO.length,
    };
  }

  if (seleccion.length > largo * 2 && seleccion.startsWith(marcador) && seleccion.endsWith(marcador) && !empiezaConNegrita(seleccion)) {
    const interior = seleccion.slice(largo, seleccion.length - largo);
    return { desde, hasta, texto: interior, seleccionDesde: desde, seleccionHasta: desde + interior.length };
  }

  const antes = valor.slice(Math.max(0, desde - largo), desde);
  const despues = valor.slice(hasta, hasta + largo);
  const rodeadaPorNegrita = esCursiva && valor.slice(Math.max(0, desde - 2), desde) === "**" && valor.slice(hasta, hasta + 2) === "**";
  if (antes === marcador && despues === marcador && desde >= largo && !rodeadaPorNegrita) {
    return { desde: desde - largo, hasta: hasta + largo, texto: seleccion, seleccionDesde: desde - largo, seleccionHasta: desde - largo + seleccion.length };
  }

  return {
    desde,
    hasta,
    texto: marcador + seleccion + marcador,
    seleccionDesde: desde + largo,
    seleccionHasta: desde + largo + seleccion.length,
  };
}

const PREFIJOS: Record<TipoBloque, { aplicar: (indice: number) => string; cualquiera: RegExp; exacto: RegExp }> = {
  titulo: { aplicar: () => "## ", cualquiera: /^#{1,6}\s+/, exacto: /^## (?!#)/ },
  subtitulo: { aplicar: () => "### ", cualquiera: /^#{1,6}\s+/, exacto: /^### (?!#)/ },
  vinietas: { aplicar: () => "- ", cualquiera: /^[-*+]\s+/, exacto: /^[-*+]\s+/ },
  numerada: { aplicar: (indice) => indice + 1 + ". ", cualquiera: /^\d+[.)]\s+/, exacto: /^\d+[.)]\s+/ },
  cita: { aplicar: () => "> ", cualquiera: /^>\s?/, exacto: /^>\s?/ },
};

/** Títulos, listas y citas: trabajan sobre las líneas completas que toca la selección y vuelven a quitarse si ya estaban aplicados. */
export function prefijarLineas(valor: string, desde: number, hasta: number, tipo: TipoBloque): Edicion {
  const inicioLinea = desde === 0 ? 0 : valor.lastIndexOf("\n", desde - 1) + 1;
  const finBusqueda = hasta > desde && valor[hasta - 1] === "\n" ? hasta - 1 : hasta;
  const indiceFin = valor.indexOf("\n", finBusqueda);
  const finLinea = indiceFin === -1 ? valor.length : indiceFin;
  const bloque = valor.slice(inicioLinea, finLinea);
  const prefijo = PREFIJOS[tipo];

  if (bloque.trim() === "") {
    const nuevo = prefijo.aplicar(0) + EJEMPLO;
    const seleccionDesde = inicioLinea + prefijo.aplicar(0).length;
    return { desde: inicioLinea, hasta: finLinea, texto: nuevo, seleccionDesde, seleccionHasta: seleccionDesde + EJEMPLO.length };
  }

  const lineas = bloque.split("\n");
  const conContenido = lineas.filter((linea) => linea.trim() !== "");
  const yaAplicado = conContenido.every((linea) => prefijo.exacto.test(linea));

  let contador = 0;
  const nuevas = lineas.map((linea) => {
    if (linea.trim() === "") return linea;
    const sinPrefijo = linea.replace(prefijo.cualquiera, "");
    if (yaAplicado) return sinPrefijo;
    return prefijo.aplicar(contador++) + sinPrefijo;
  });
  const texto = nuevas.join("\n");
  return { desde: inicioLinea, hasta: finLinea, texto, seleccionDesde: inicioLinea, seleccionHasta: inicioLinea + texto.length };
}

/** Devuelve el mensaje de error si la dirección no sirve como enlace, o `undefined` si es válida. */
export function validarDireccionEnlace(direccion: string): string | undefined {
  const url = direccion.trim();
  if (url === "") return "Ingresá la dirección del enlace.";
  if (url.length > LARGO_MAXIMO_ENLACE || /\s/.test(url)) return "La dirección no puede tener espacios ni superar los 2000 caracteres.";
  try {
    const analizada = new URL(url);
    if (!PROTOCOLOS_ENLACE.includes(analizada.protocol)) throw new Error("protocolo");
    if (analizada.protocol !== "mailto:" && analizada.hostname === "") throw new Error("sin sitio");
    if (analizada.protocol === "mailto:" && analizada.pathname === "") throw new Error("sin correo");
  } catch {
    return "Ingresá una dirección válida que empiece con http://, https:// o mailto:.";
  }
  return undefined;
}

/** `[texto](dirección)`: usa la selección como texto del enlace, o un texto de ejemplo seleccionado. La dirección debe estar validada. */
export function insertarEnlace(valor: string, desde: number, hasta: number, direccion: string): Edicion {
  const seleccion = valor.slice(desde, hasta);
  const etiqueta = seleccion === "" ? EJEMPLO_ENLACE : seleccion;
  const url = direccion.trim().replaceAll("(", "%28").replaceAll(")", "%29");
  return {
    desde,
    hasta,
    texto: "[" + etiqueta + "](" + url + ")",
    seleccionDesde: desde + 1,
    seleccionHasta: desde + 1 + etiqueta.length,
  };
}

/** Línea horizontal (`---`) separada del resto por líneas en blanco. */
export function insertarSeparador(valor: string, desde: number, hasta: number): Edicion {
  const antes = valor.slice(0, desde);
  const inicio = antes === "" || antes.endsWith("\n\n") ? "" : antes.endsWith("\n") ? "\n" : "\n\n";
  const texto = inicio + "---\n\n";
  const posicion = desde + texto.length;
  return { desde, hasta, texto, seleccionDesde: posicion, seleccionHasta: posicion };
}
