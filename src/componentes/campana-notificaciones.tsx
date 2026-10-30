"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { IconoCampana } from "@/componentes/iconos";
import { useNotificacionesNoLeidas } from "@/hooks/use-notificaciones";
import {
  listarNotificaciones,
  marcarNotificacionLeida,
  marcarTodasLasNotificacionesLeidas,
} from "@/servicios/servicio-notificaciones";
import type { Notificacion } from "@/tipos/notificacion";
import { formatearFechaHora } from "@/utilidades/fechas";

type PropiedadesCampana = {
  /** Dirección de la orden de trabajo a la que lleva un aviso (cambia entre la vista de escritorio y la del técnico). */
  rutaDeLaOrden: (ordenId: number) => string;
};

const AVISOS_VISIBLES = 10;

/** Campana del encabezado: cantidad de avisos sin leer (RFG-05) y bandeja con los últimos. */
export function CampanaNotificaciones({ rutaDeLaOrden }: PropiedadesCampana) {
  const { noLeidas, setNoLeidas, actualizar } = useNotificacionesNoLeidas();
  const [estaAbierta, setEstaAbierta] = useState(false);
  const [avisos, setAvisos] = useState<Notificacion[] | null>(null);
  const [hayError, setHayError] = useState(false);
  const referencia = useRef<HTMLDivElement>(null);
  const referenciaBoton = useRef<HTMLButtonElement>(null);
  const idPanel = useId();

  useEffect(() => {
    if (!estaAbierta) return;
    let estaMontado = true;
    listarNotificaciones(AVISOS_VISIBLES)
      .then((lista) => {
        if (!estaMontado) return;
        setAvisos(lista);
        setHayError(false);
      })
      .catch(() => estaMontado && setHayError(true));

    function cerrarDesdeFuera(evento: PointerEvent) {
      if (evento.target instanceof Node && !referencia.current?.contains(evento.target)) setEstaAbierta(false);
    }
    function cerrarConEscape(evento: KeyboardEvent) {
      if (evento.key !== "Escape") return;
      setEstaAbierta(false);
      referenciaBoton.current?.focus();
    }
    document.addEventListener("pointerdown", cerrarDesdeFuera);
    document.addEventListener("keydown", cerrarConEscape);
    return () => {
      estaMontado = false;
      document.removeEventListener("pointerdown", cerrarDesdeFuera);
      document.removeEventListener("keydown", cerrarConEscape);
    };
  }, [estaAbierta]);

  async function abrirAviso(aviso: Notificacion) {
    setEstaAbierta(false);
    if (aviso.leida) return;
    setAvisos((actuales) => actuales?.map((item) => (item.id === aviso.id ? { ...item, leida: true } : item)) ?? null);
    setNoLeidas((actual) => Math.max(0, actual - 1));
    try {
      await marcarNotificacionLeida(aviso.id);
    } catch {
      void actualizar();
    }
  }

  async function marcarTodas() {
    setAvisos((actuales) => actuales?.map((item) => ({ ...item, leida: true })) ?? null);
    setNoLeidas(0);
    try {
      await marcarTodasLasNotificacionesLeidas();
    } catch {
      void actualizar();
    }
  }

  const contador = noLeidas > 99 ? "99+" : String(noLeidas);
  const nombre = noLeidas > 0 ? `Notificaciones: ${noLeidas} sin leer` : "Notificaciones";

  return (
    <div
      className="campana-notificaciones"
      onBlur={(evento) => {
        if (!evento.currentTarget.contains(evento.relatedTarget)) setEstaAbierta(false);
      }}
      ref={referencia}
    >
      <button
        aria-controls={idPanel}
        aria-expanded={estaAbierta}
        aria-label={nombre}
        className="campana-boton"
        onClick={() => setEstaAbierta((actual) => !actual)}
        ref={referenciaBoton}
        type="button"
      >
        <IconoCampana />
        {noLeidas > 0 ? <span aria-hidden="true" className="campana-contador">{contador}</span> : null}
      </button>
      <div aria-label="Notificaciones" className="campana-panel" hidden={!estaAbierta} id={idPanel} role="region">
        <div className="campana-panel-cabecera">
          <strong>Notificaciones</strong>
          <button className="text-link" disabled={noLeidas === 0} onClick={marcarTodas} type="button">
            Marcar todas como leídas
          </button>
        </div>
        {hayError ? (
          <p className="campana-estado" role="alert">No se pudieron cargar las notificaciones.</p>
        ) : avisos === null ? (
          <p className="campana-estado" role="status">Cargando…</p>
        ) : avisos.length === 0 ? (
          <p className="campana-estado">No tenés notificaciones.</p>
        ) : (
          <ul className="campana-lista">
            {avisos.map((aviso) => (
              <li key={aviso.id}>
                {aviso.ordenId !== null ? (
                  <Link className="campana-aviso" data-sin-leer={!aviso.leida || undefined} href={rutaDeLaOrden(aviso.ordenId)} onClick={() => abrirAviso(aviso)}>
                    <span>{aviso.mensaje}</span>
                    <time dateTime={aviso.creadaEn}>{formatearFechaHora(aviso.creadaEn)}</time>
                  </Link>
                ) : (
                  <div className="campana-aviso" data-sin-leer={!aviso.leida || undefined}>
                    <span>{aviso.mensaje}</span>
                    <time dateTime={aviso.creadaEn}>{formatearFechaHora(aviso.creadaEn)}</time>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
