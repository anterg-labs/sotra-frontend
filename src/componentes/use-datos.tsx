"use client";

import { useEffect, useState, type ReactNode } from "react";

export type EstadoDeDatos<T> =
  | { estado: "cargando" }
  | { estado: "listo"; datos: T }
  | { estado: "error"; mensaje: string };

/**
 * Pide datos al montarse y cada vez que cambia la clave (por ejemplo los filtros serializados), ignorando respuestas de
 * pedidos viejos. Es para los bloques que se cargan a pedido (por ejemplo al abrir una sección) y que pueden fallar sin
 * tumbar el resto de la pantalla. Mientras la clave pedida no coincide con la última respuesta, el estado es «cargando».
 */
export function useDatos<T>(cargar: () => Promise<T>, clave: string) {
  const [respuesta, setRespuesta] = useState<{ clave: string; intento: number; resultado: EstadoDeDatos<T> } | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    cargar().then(
      (datos) => {
        if (vigente) setRespuesta({ clave, intento, resultado: { estado: "listo", datos } });
      },
      (error: unknown) => {
        if (vigente) {
          const mensaje = error instanceof Error ? error.message : "No se pudieron obtener los datos.";
          setRespuesta({ clave, intento, resultado: { estado: "error", mensaje } });
        }
      },
    );
    return () => {
      vigente = false;
    };
    // `cargar` es una función nueva en cada render; la clave describe lo que se pide.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, intento]);

  const vigente = respuesta !== null && respuesta.clave === clave && respuesta.intento === intento;
  const resultado: EstadoDeDatos<T> = vigente ? respuesta.resultado : { estado: "cargando" };
  return { resultado, reintentar: () => setIntento((valor) => valor + 1) };
}

type PropiedadesBloque<T> = {
  resultado: EstadoDeDatos<T>;
  reintentar: () => void;
  /** Texto del estado de carga, para el lector de pantalla. */
  cargando: string;
  children: (datos: T) => ReactNode;
};

/** Muestra «cargando», el error con su botón de reintento o los datos, siempre con un texto equivalente para lectores de pantalla. */
export function BloqueDeDatos<T>({ resultado, reintentar, cargando, children }: PropiedadesBloque<T>) {
  if (resultado.estado === "cargando") {
    return (
      <div aria-busy="true" className="grid gap-2" role="status">
        <span aria-hidden="true" className="block h-24 animate-pulse rounded bg-current opacity-10 motion-reduce:animate-none" />
        <span className="sr-only">{cargando}</span>
      </div>
    );
  }

  if (resultado.estado === "error") {
    return (
      <div className="form-error-banner" role="alert">
        <p>{resultado.mensaje}</p>
        <button className="secondary-button" onClick={reintentar} type="button">
          Reintentar
        </button>
      </div>
    );
  }

  return <>{children(resultado.datos)}</>;
}
