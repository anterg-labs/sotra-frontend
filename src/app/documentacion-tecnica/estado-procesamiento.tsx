"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { DocumentoTecnico } from "@/tipos/documento-tecnico";
import { reprocesarDocumentoAccion } from "./acciones";

/** Cada cuánto se vuelve a consultar un documento que todavía se está procesando. */
export const INTERVALO_DE_ACTUALIZACION_MS = 5000;

/** Mientras haya documentos procesándose, vuelve a pedir la página al servidor para mostrar el estado nuevo. */
export function ActualizarMientrasProcesa(props: { activo: boolean }) {
  const enrutador = useRouter();

  useEffect(() => {
    if (!props.activo) return;
    const intervalo = window.setInterval(() => enrutador.refresh(), INTERVALO_DE_ACTUALIZACION_MS);
    return () => window.clearInterval(intervalo);
  }, [props.activo, enrutador]);

  return null;
}

type DatosDelEstado = Pick<
  DocumentoTecnico,
  "usaSugerenciasIA" | "estadoProcesamiento" | "cantidadFragmentos" | "mensajeErrorProcesamiento"
>;

/** Si el documento se usa para la IA y en qué punto está su procesamiento. */
export function EstadoSugerenciasIa(props: { documento: DatosDelEstado; conDetalle?: boolean }) {
  const { documento } = props;
  if (!documento.usaSugerenciasIA) {
    return props.conDetalle ? <span>No se usa para sugerencias de IA</span> : <span className="status status-inactivo">No</span>;
  }

  if (documento.estadoProcesamiento === "error") {
    return (
      <>
        <span className="status status-tono-peligro">Error al procesar</span>
        {props.conDetalle && documento.mensajeErrorProcesamiento ? (
          <p className="field-error">{documento.mensajeErrorProcesamiento}</p>
        ) : null}
      </>
    );
  }

  if (documento.estadoProcesamiento !== "listo") {
    return (
      <>
        <span className="status status-tono-alerta" role="status">
          {documento.estadoProcesamiento === "procesando" ? "Procesando…" : "En cola"}
        </span>
        {props.conDetalle ? (
          <p className="field-hint">Se está preparando para las sugerencias de IA. Puede tardar varios minutos.</p>
        ) : null}
      </>
    );
  }

  return props.conDetalle ? (
    <span>Se usa para sugerencias de IA ({documento.cantidadFragmentos} fragmentos procesados)</span>
  ) : (
    <span className="status status-activo">Sí</span>
  );
}

/** Vuelve a poner en la cola un documento cuyo procesamiento falló. */
export function BotonReprocesar(props: { documentoId: number }) {
  const enrutador = useRouter();
  const [error, setError] = useState("");
  const [estaPendiente, iniciarTransicion] = useTransition();

  function reprocesar() {
    setError("");
    iniciarTransicion(async () => {
      const resultado = await reprocesarDocumentoAccion(props.documentoId);
      if (resultado.exito) enrutador.refresh();
      else setError(resultado.mensaje);
    });
  }

  return (
    <>
      <button className="secondary-button" disabled={estaPendiente} onClick={reprocesar} type="button">
        {estaPendiente ? "Enviando…" : "Volver a procesar"}
      </button>
      {error ? <p className="field-error" role="alert">{error}</p> : null}
    </>
  );
}
