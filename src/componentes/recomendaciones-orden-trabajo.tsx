"use client";

import { useEffect, useState } from "react";
import {
  listarRecomendaciones,
  obtenerEtiquetaEstadoValidacion,
  validarRecomendacion,
} from "@/servicios/servicio-recomendaciones";
import type { Recomendacion } from "@/tipos/recomendacion";

type PropiedadesRecomendacionesOrdenTrabajo = {
  ordenTrabajoId: number;
  sugerencias: string[];
};

export function RecomendacionesOrdenTrabajo(props: PropiedadesRecomendacionesOrdenTrabajo) {
  const [recomendaciones, setRecomendaciones] = useState<Recomendacion[] | null>(null);
  const [errorCarga, setErrorCarga] = useState("");
  const [recomendacionSeleccionadaId, setRecomendacionSeleccionadaId] = useState(0);
  const [observacion, setObservacion] = useState("");
  const [estaEnviando, setEstaEnviando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState("");

  useEffect(() => {
    async function cargarRecomendaciones() {
      try {
        const recomendacionesObtenidas = await listarRecomendaciones(props.ordenTrabajoId);
        setRecomendaciones(recomendacionesObtenidas);
      } catch {
        setErrorCarga("No se pudo obtener la validación de las recomendaciones.");
      }
    }

    cargarRecomendaciones();
  }, [props.ordenTrabajoId]);

  function abrirValidacion(recomendacionId: number) {
    setRecomendacionSeleccionadaId(recomendacionId);
    setObservacion("");
    setErrorValidacion("");
  }

  function cerrarValidacion() {
    setRecomendacionSeleccionadaId(0);
    setErrorValidacion("");
  }

  function cambiarObservacion(evento: React.ChangeEvent<HTMLTextAreaElement>) {
    setObservacion(evento.target.value);
  }

  async function guardarValidacion(resultado: string) {
    setErrorValidacion("");
    setEstaEnviando(true);

    try {
      const recomendacionActualizada = await validarRecomendacion(
        props.ordenTrabajoId,
        recomendacionSeleccionadaId,
        resultado,
        observacion,
      );

      const recomendacionesActualizadas: Recomendacion[] = [];
      if (recomendaciones !== null) {
        for (const recomendacion of recomendaciones) {
          if (recomendacion.id === recomendacionActualizada.id) {
            recomendacionesActualizadas.push(recomendacionActualizada);
          } else {
            recomendacionesActualizadas.push(recomendacion);
          }
        }
      }
      setRecomendaciones(recomendacionesActualizadas);
      setRecomendacionSeleccionadaId(0);
    } catch (error) {
      let mensaje = "No se pudo registrar la validación.";
      if (error instanceof Error) {
        mensaje = error.message;
      }
      setErrorValidacion(mensaje);
    } finally {
      setEstaEnviando(false);
    }
  }

  function aceptar() {
    guardarValidacion("aceptada");
  }

  function rechazar() {
    guardarValidacion("rechazada");
  }

  function observar() {
    guardarValidacion("observada");
  }

  let contenido = <p className="empty-state">Cargando recomendaciones…</p>;

  if (props.sugerencias.length === 0) {
    contenido = <p className="empty-state">Esta orden no tiene recomendaciones guardadas.</p>;
  } else if (errorCarga) {
    contenido = (
      <>
        <p className="form-error-banner">{errorCarga}</p>
        <div className="flex flex-col gap-3">
          {props.sugerencias.map((textoSugerencia, indice) => (
            <p className="whitespace-pre-wrap rounded-lg border border-gray-200 bg-slate-50 p-4 text-sm" key={indice}>
              {textoSugerencia}
            </p>
          ))}
        </div>
      </>
    );
  } else if (recomendaciones !== null) {
    contenido = (
      <div className="flex flex-col gap-4">
        {recomendaciones.map((recomendacion) => {
          let ultimaObservacion = null;
          const cantidadValidaciones = recomendacion.validaciones.length;
          if (cantidadValidaciones > 0) {
            const ultimaValidacion = recomendacion.validaciones[cantidadValidaciones - 1];
            if (ultimaValidacion.observacion !== "") {
              ultimaObservacion = (
                <p className="mt-2 text-sm text-gray-600">{"Observación: " + ultimaValidacion.observacion}</p>
              );
            }
          }

          let zonaValidacion = (
            <div className="form-actions">
              <button
                className="secondary-button"
                onClick={() => abrirValidacion(recomendacion.id)}
                type="button"
              >
                Validar recomendación
              </button>
            </div>
          );

          if (recomendacionSeleccionadaId === recomendacion.id) {
            let mensajeError = null;
            if (errorValidacion) {
              mensajeError = <p className="form-error-banner">{errorValidacion}</p>;
            }

            zonaValidacion = (
              <div className="mt-3">
                {mensajeError}
                <div className="form-field">
                  <label htmlFor={"observacionValidacion" + recomendacion.id}>Observación o motivo del rechazo</label>
                  <textarea
                    id={"observacionValidacion" + recomendacion.id}
                    onChange={cambiarObservacion}
                    rows={2}
                    value={observacion}
                  />
                </div>
                <div className="form-actions">
                  <button className="secondary-button" disabled={estaEnviando} onClick={cerrarValidacion} type="button">
                    Cancelar
                  </button>
                  <button className="secondary-button" disabled={estaEnviando} onClick={observar} type="button">
                    Observar
                  </button>
                  <button className="danger-button" disabled={estaEnviando} onClick={rechazar} type="button">
                    Rechazar
                  </button>
                  <button className="primary-button" disabled={estaEnviando} onClick={aceptar} type="button">
                    Aceptar
                  </button>
                </div>
              </div>
            );
          }

          return (
            <article className="rounded-lg border border-gray-200 p-4" key={recomendacion.id}>
              <span className={"status validacion-" + recomendacion.estadoValidacion}>
                {obtenerEtiquetaEstadoValidacion(recomendacion.estadoValidacion)}
              </span>
              <p className="mt-3 whitespace-pre-wrap text-sm">{recomendacion.texto}</p>
              {ultimaObservacion}
              {zonaValidacion}
            </article>
          );
        })}
      </div>
    );
  }

  return (
    <section className="panel detail-panel">
      <h2>Recomendaciones de IA</h2>
      <p className="mb-4 mt-1 text-sm text-gray-500">
        Son información de apoyo: el responsable de mantenimiento las acepta, rechaza u observa antes de aplicarlas.
      </p>
      {contenido}
    </section>
  );
}
