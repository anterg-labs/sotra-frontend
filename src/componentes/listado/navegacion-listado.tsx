"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, useTransition } from "react";
import { leerOrdenDeUrl, type OrdenListado } from "./url-listado";

type ContextoNavegacion = {
  estaPendiente: boolean;
  /** Navegación con historial (paginación). */
  navegar: (url: string) => void;
  /** Navegación de filtros en vivo: reemplaza la entrada del historial para no apilar una por cada cambio. */
  reemplazar: (url: string) => void;
  /** Última URL a la que se navegó desde esta pantalla (`null` si todavía no hubo ninguna). */
  ultimaUrl: () => string | null;
  ordenPendiente: OrdenListado | null;
  informarTotal: (total: number | null) => void;
  etiquetaCarga: string;
};

const Contexto = createContext<ContextoNavegacion | null>(null);

export function useNavegacionListado() {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error("Falta el ProveedorNavegacionListado.");
  return contexto;
}

export function useNavegacionListadoOpcional() {
  return useContext(Contexto);
}

function textoDeResultados(total: number) {
  if (total === 0) return "Sin resultados";
  return total === 1 ? "1 resultado" : total + " resultados";
}

/**
 * Comparte entre los filtros, la paginación y la tabla una misma transición de navegación:
 * la URL cambia dentro de `useTransition` y, mientras el servidor prepara la nueva página, la tabla anterior permanece visible.
 * También mantiene la región `aria-live` que anuncia «Cargando…» y el total de resultados.
 */
export function ProveedorNavegacionListado(props: { etiquetaCarga: string; children: React.ReactNode }) {
  const enrutador = useRouter();
  const [estaPendiente, iniciarTransicion] = useTransition();
  const [total, setTotal] = useState<number | null>(null);
  const ultima = useRef<string | null>(null);
  const [urlPendiente, setUrlPendiente] = useState<string | null>(null);

  const navegar = (url: string) => {
    ultima.current = url;
    setUrlPendiente(url);
    iniciarTransicion(() => enrutador.push(url));
  };
  const reemplazar = (url: string) => {
    ultima.current = url;
    setUrlPendiente(url);
    iniciarTransicion(() => enrutador.replace(url));
  };
  const ordenPendiente = estaPendiente && urlPendiente !== null ? leerOrdenDeUrl(urlPendiente) : null;

  return (
    <Contexto.Provider
      value={{ estaPendiente, navegar, reemplazar, ultimaUrl: () => ultima.current, ordenPendiente, informarTotal: setTotal, etiquetaCarga: props.etiquetaCarga }}
    >
      {props.children}
      <div aria-label="Resultados del listado" aria-live="polite" className="sr-only" role="status">
        {estaPendiente ? "Cargando…" : total === null ? "" : textoDeResultados(total)}
      </div>
    </Contexto.Provider>
  );
}

/** Conserva el contenido anterior durante la navegación para evitar el parpadeo. */
export function ZonaListado(props: { children: React.ReactNode }) {
  const { estaPendiente, etiquetaCarga } = useNavegacionListado();
  return (
    <div aria-busy={estaPendiente} className="zona-listado" data-cargando={estaPendiente}>
      {props.children}
      {estaPendiente ? <span aria-label={etiquetaCarga} className="sr-only" role="status">{etiquetaCarga}</span> : null}
    </div>
  );
}

/** Lo renderiza el listado (en el servidor) para que la región `aria-live` anuncie cuántos resultados hay. */
export function InformarResultados(props: { total: number | null }) {
  const informarTotal = useContext(Contexto)?.informarTotal;
  useEffect(() => {
    informarTotal?.(props.total);
  }, [informarTotal, props.total]);
  return null;
}
