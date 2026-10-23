"use client";

import { useState } from "react";
import { useAvisos } from "@/componentes/avisos";
import { ModalConfirmacion } from "@/componentes/modal-confirmacion";
import type { ResultadoCambiarEstado } from "@/tipos/resultado-accion";
import { useCambioEstado } from "./use-cambio-estado";

type TextosDeReactivacion<T> = {
  /** Aviso verde al terminar, por ejemplo «Cliente reactivado.». */
  mensaje: string;
  titulo: string;
  descripcion: (registro: T) => string;
  etiqueta?: string;
};

type TextosDeCambioDeEstado<T> = {
  /** Aviso verde al terminar, por ejemplo «Cliente dado de baja.». */
  mensajeBaja: string;
  tituloBaja: string;
  descripcionBaja: (registro: T) => string;
  etiquetaBaja?: string;
  /** Si falta, el registro no se reactiva desde la tabla (por ejemplo, se reactiva al editarlo). */
  reactivacion?: TextosDeReactivacion<T>;
  /** Para lo que cada pantalla necesite hacer además (por ejemplo, refrescar las alertas de stock). */
  alExito?: (estado: "activo" | "inactivo") => void;
};

/**
 * Baja y reactivación con el mismo comportamiento en todos los listados: pide confirmación en un diálogo, marca la fila en
 * proceso, y al terminar muestra un aviso verde (o rojo si falla) arriba a la derecha. Devuelve los diálogos ya armados
 * en `modales` para renderizarlos junto a la tabla.
 */
export function useCambioEstadoConfirmado<T extends { id: number }>(
  accion: (id: number, estado: "activo" | "inactivo") => Promise<ResultadoCambiarEstado>,
  textos: TextosDeCambioDeEstado<T>,
) {
  const { mostrarAviso } = useAvisos();
  const [paraBaja, setParaBaja] = useState<T | null>(null);
  const [paraReactivacion, setParaReactivacion] = useState<T | null>(null);

  const { enProcesoId, ejecutar } = useCambioEstado(
    accion,
    (_id, estado) => {
      setParaBaja(null);
      setParaReactivacion(null);
      mostrarAviso("exito", estado === "inactivo" ? textos.mensajeBaja : (textos.reactivacion?.mensaje ?? ""));
      textos.alExito?.(estado);
    },
    (mensaje) => mostrarAviso("error", mensaje),
  );

  const modales = (
    <>
      {paraBaja ? (
        <ModalConfirmacion
          descripcion={textos.descripcionBaja(paraBaja)}
          estaConfirmando={enProcesoId === paraBaja.id}
          etiquetaConfirmar={textos.etiquetaBaja ?? "Dar de baja"}
          onCancelar={() => setParaBaja(null)}
          onConfirmar={() => ejecutar(paraBaja.id, "inactivo")}
          titulo={textos.tituloBaja}
        />
      ) : null}
      {paraReactivacion && textos.reactivacion ? (
        <ModalConfirmacion
          descripcion={textos.reactivacion.descripcion(paraReactivacion)}
          estaConfirmando={enProcesoId === paraReactivacion.id}
          etiquetaConfirmar={textos.reactivacion.etiqueta ?? "Reactivar"}
          onCancelar={() => setParaReactivacion(null)}
          onConfirmar={() => ejecutar(paraReactivacion.id, "activo")}
          titulo={textos.reactivacion.titulo}
        />
      ) : null}
    </>
  );

    // Un solo diálogo a la vez: al abrir uno se cierra el otro.
  const pedirBaja = (registro: T | null) => {
    setParaReactivacion(null);
    setParaBaja(registro);
  };
  const pedirReactivacion = (registro: T | null) => {
    setParaBaja(null);
    setParaReactivacion(registro);
  };

  return { enProcesoId, pedirBaja, pedirReactivacion, modales };
}
