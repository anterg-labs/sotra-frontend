"use client";

import { useDatos } from "@/componentes/use-datos";
import { apiListarCausasFalla, apiListarMotivosOrden } from "@/servicios/api/api-ordenes-trabajo";
import type { UnidadDeUso } from "@/tipos/orden-trabajo";

type PropiedadesCamposDatosOrden = {
  tipo: string;
  unidadUso: UnidadDeUso;
  tiempoEstimado: string;
  causaFallaId: string;
  lecturaUso: string;
  motivoCodigo: string;
  /** El estado elegido exige un motivo: se ofrece clasificarlo con el catálogo. */
  mostrarMotivo: boolean;
  errorTiempoEstimado?: string;
  errorLecturaUso?: string;
  alCambiarTiempoEstimado: (valor: string) => void;
  alCambiarCausaFalla: (valor: string) => void;
  alCambiarLecturaUso: (valor: string) => void;
  alCambiarMotivo: (valor: string) => void;
};

/** Etiqueta del campo de lectura según cómo se mide el uso de la máquina. */
export function etiquetaDeLectura(unidad: UnidadDeUso) {
  return unidad === "kilometros" ? "Lectura del odómetro (km)" : "Lectura del horómetro (horas)";
}

/**
 * Datos opcionales que alimentan los reportes: tiempo estimado, causa de falla (solo correctivas), lectura de uso del
 * activo y clasificación del motivo de una pausa. Los catálogos se piden solo cuando el campo se muestra.
 */
export function CamposDatosOrden(props: PropiedadesCamposDatosOrden) {
  const pideCausas = props.tipo === "correctivo";
  const causas = useDatos(() => (pideCausas ? apiListarCausasFalla() : Promise.resolve([])), "causas-" + pideCausas);
  const motivos = useDatos(() => (props.mostrarMotivo ? apiListarMotivosOrden() : Promise.resolve([])), "motivos-" + props.mostrarMotivo);
  const opcionesDeCausas = causas.resultado.estado === "listo" ? causas.resultado.datos : [];
  const opcionesDeMotivos = motivos.resultado.estado === "listo" ? motivos.resultado.datos : [];

  return (
    <>
      <div className="form-field">
        <label htmlFor="tiempoEstimadoHoras">Tiempo estimado en horas (opcional)</label>
        <input
          aria-describedby={props.errorTiempoEstimado ? "tiempoEstimadoHoras-error" : undefined}
          aria-invalid={props.errorTiempoEstimado ? true : undefined}
          id="tiempoEstimadoHoras"
          inputMode="decimal"
          onChange={(evento) => props.alCambiarTiempoEstimado(evento.target.value)}
          value={props.tiempoEstimado}
        />
        {props.errorTiempoEstimado ? <p className="field-error" id="tiempoEstimadoHoras-error" role="alert">{props.errorTiempoEstimado}</p> : null}
      </div>

      <div className="form-field">
        <label htmlFor="lecturaUso">{etiquetaDeLectura(props.unidadUso)} (opcional)</label>
        <input
          aria-describedby={props.errorLecturaUso ? "lecturaUso-error" : undefined}
          aria-invalid={props.errorLecturaUso ? true : undefined}
          id="lecturaUso"
          inputMode="decimal"
          onChange={(evento) => props.alCambiarLecturaUso(evento.target.value)}
          value={props.lecturaUso}
        />
        {props.errorLecturaUso ? <p className="field-error" id="lecturaUso-error" role="alert">{props.errorLecturaUso}</p> : null}
      </div>

      {pideCausas ? (
        <div className="form-field">
          <label htmlFor="causaFallaId">Causa de la falla (opcional)</label>
          <select id="causaFallaId" onChange={(evento) => props.alCambiarCausaFalla(evento.target.value)} value={props.causaFallaId}>
            <option value="">Sin indicar</option>
            {opcionesDeCausas.map((causa) => (
              <option key={causa.id} value={causa.id}>{causa.nombre}</option>
            ))}
          </select>
        </div>
      ) : null}

      {props.mostrarMotivo ? (
        <div className="form-field">
          <label htmlFor="motivoCodigo">Tipo de motivo (opcional)</label>
          <select id="motivoCodigo" onChange={(evento) => props.alCambiarMotivo(evento.target.value)} value={props.motivoCodigo}>
            <option value="">Sin clasificar</option>
            {opcionesDeMotivos.map((motivo) => (
              <option key={motivo.codigo} value={motivo.codigo}>{motivo.descripcion}</option>
            ))}
          </select>
        </div>
      ) : null}
    </>
  );
}
