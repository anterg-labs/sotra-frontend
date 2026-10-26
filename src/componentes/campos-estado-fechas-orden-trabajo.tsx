"use client";

import { useEstadosOrden, useEtiquetaEstadoOrden } from "@/componentes/estados-orden";
import { motivoNoDisponible } from "@/servicios/servicio-ordenes-trabajo";
import type { EstadoOrdenTrabajo } from "@/tipos/orden-trabajo";

type PropiedadesCamposEstadoFechasOrdenTrabajo = {
  permiteCambiarEstado: boolean;
  estado: string;
  /** Estado en el que está guardada la orden: de ahí se calculan los estados a los que se puede pasar. */
  estadoActual: string;
  estadosDisponibles: EstadoOrdenTrabajo[];
  necesitaMotivo: boolean;
  motivoEstado: string;
  fechaPrevistaEjecucion: string;
  errorFechaPrevista?: string;
  errorMotivo?: string;
  alCambiarEstado: (estado: string) => void;
  alCambiarMotivo: (motivoEstado: string) => void;
  alCambiarFechaPrevista: (fechaPrevistaEjecucion: string) => void;
};

export function CamposEstadoFechasOrdenTrabajo(props: PropiedadesCamposEstadoFechasOrdenTrabajo) {
  const estados = useEstadosOrden();
  const etiquetaEstado = useEtiquetaEstadoOrden();
  function cambiarEstado(evento: React.ChangeEvent<HTMLSelectElement>) {
    props.alCambiarEstado(evento.target.value);
  }

  function cambiarMotivo(evento: React.ChangeEvent<HTMLTextAreaElement>) {
    props.alCambiarMotivo(evento.target.value);
  }

  function cambiarFechaPrevista(evento: React.ChangeEvent<HTMLInputElement>) {
    props.alCambiarFechaPrevista(evento.target.value);
  }

  let campoEstado = null;
  if (props.permiteCambiarEstado) {
    campoEstado = (
      <div className="form-field">
        <label htmlFor="estado">Estado</label>
        <select id="estado" onChange={cambiarEstado} value={props.estado}>
          {estados.map((estado) => {
            const disponibilidad = estado.valor === props.estadoActual
              ? {}
              : motivoNoDisponible(estado.valor, props.estadoActual, props.estadosDisponibles, etiquetaEstado);
            return (
              <option disabled={disponibilidad.deshabilitada} key={estado.valor} value={estado.valor}>
                {disponibilidad.motivo ? `${estado.etiqueta} (${disponibilidad.motivo.toLowerCase()})` : estado.etiqueta}
              </option>
            );
          })}
        </select>
      </div>
    );
  }

  let campoMotivo = null;
  if (props.permiteCambiarEstado && props.necesitaMotivo) {
    campoMotivo = (
      <div className="form-field form-field-full">
        <label htmlFor="motivoEstado">Motivo del cambio de estado</label>
        <textarea aria-describedby={props.errorMotivo ? "motivoEstado-error" : undefined} aria-invalid={props.errorMotivo ? true : undefined} id="motivoEstado" onChange={cambiarMotivo} required rows={2} value={props.motivoEstado} />
        {props.errorMotivo ? <p className="field-error" id="motivoEstado-error" role="alert">{props.errorMotivo}</p> : null}
      </div>
    );
  }

  return (
    <>
      <div className="form-field">
        <label htmlFor="fechaPrevistaEjecucion">Fecha prevista de ejecución</label>
        <input
          aria-describedby={props.errorFechaPrevista ? "fechaPrevistaEjecucion-error" : undefined}
          aria-invalid={props.errorFechaPrevista ? true : undefined}
          id="fechaPrevistaEjecucion"
          onChange={cambiarFechaPrevista}
          required
          type="date"
          value={props.fechaPrevistaEjecucion}
        />
        {props.errorFechaPrevista ? <p className="field-error" id="fechaPrevistaEjecucion-error" role="alert">{props.errorFechaPrevista}</p> : null}
      </div>

      {campoEstado}
      {campoMotivo}
    </>
  );
}
