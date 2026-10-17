"use client";

import { useEffect, useRef, useState } from "react";
import { useNavegacionListado } from "./navegacion-listado";

/** Espera, en milisegundos, desde la última tecla antes de buscar. Los demás filtros se aplican al instante. */
export const RETARDO_BUSQUEDA_MS = 300;

type Opciones<T> = {
  /** Valores iniciales de los filtros (los de la URL). */
  inicial: T;
  /** URL del listado para unos valores; debe omitir lo vacío y volver a la página 1. */
  construirUrl: (valores: T) => string;
  /** Si devuelve `false` los valores son inválidos (por ejemplo, un rango de fechas invertido): no se navega. */
  sonValidos?: (valores: T) => boolean;
  /** Se llama cuando se descarta una navegación por valores inválidos (para llevar el foco al campo con error). */
  alInvalido?: () => void;
};

/**
 * Filtros en vivo: cada cambio actualiza la URL con `router.replace` dentro de una transición.
 * El texto espera `RETARDO_BUSQUEDA_MS` y los selectores, interruptores, chips y fechas aplican de inmediato.
 * No navega si la URL resultante es la misma, y la última navegación es la que vale.
 */
export function useFiltrosEnVivo<T extends object>(opciones: Opciones<T>) {
  const { estaPendiente, reemplazar, ultimaUrl } = useNavegacionListado();
  const [valores, setValores] = useState<T>(opciones.inicial);
  const valoresActuales = useRef<T>(opciones.inicial);
  const [urlInicial] = useState(() => opciones.construirUrl(opciones.inicial));
  const emitidas = useRef(new Set<string>([urlInicial]));
  const temporizador = useRef<number | null>(null);
  const configuracion = useRef(opciones);
  useEffect(() => {
    configuracion.current = opciones;
  });

  // Si la URL cambia por otra vía (un enlace del listado, el historial del navegador), los campos se ajustan a ella.
  const urlDeLasProps = opciones.construirUrl(opciones.inicial);
  useEffect(() => {
    if (emitidas.current.has(urlDeLasProps)) return;
    emitidas.current.add(urlDeLasProps);
    const { inicial } = configuracion.current;
    valoresActuales.current = inicial;
    setValores(inicial);
  }, [urlDeLasProps]);

  useEffect(
    () => () => {
      if (temporizador.current !== null) window.clearTimeout(temporizador.current);
    },
    [],
  );

  function cancelarPendiente() {
    if (temporizador.current !== null) {
      window.clearTimeout(temporizador.current);
      temporizador.current = null;
    }
  }

  function navegarSiCambio() {
    cancelarPendiente();
    const { construirUrl, sonValidos, alInvalido } = configuracion.current;
    const actuales = valoresActuales.current;
    if (sonValidos && !sonValidos(actuales)) {
      alInvalido?.();
      return;
    }
    const url = construirUrl(actuales);
    if (url === (ultimaUrl() ?? urlInicial)) return;
    emitidas.current.add(url);
    reemplazar(url);
  }

  /** Cambia uno o más filtros. Con `esTexto` espera el retardo; si no, navega enseguida. */
  function cambiar(parcial: Partial<T>, esTexto = false) {
    const nuevos = { ...valoresActuales.current, ...parcial };
    valoresActuales.current = nuevos;
    setValores(nuevos);
    cancelarPendiente();
    if (esTexto) {
      temporizador.current = window.setTimeout(navegarSiCambio, RETARDO_BUSQUEDA_MS);
    } else {
      navegarSiCambio();
    }
  }

  /** Aplica ya mismo lo escrito (por ejemplo, al pulsar Enter en el buscador). */
  function aplicarAhora() {
    navegarSiCambio();
  }

  function limpiar(vacios: T) {
    valoresActuales.current = vacios;
    setValores(vacios);
    navegarSiCambio();
  }

  return { valores, cambiar, aplicarAhora, limpiar, estaPendiente };
}
