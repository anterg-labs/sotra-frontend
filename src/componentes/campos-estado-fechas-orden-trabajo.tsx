import { obtenerEtiquetaEstadoOrdenTrabajo } from "@/servicios/servicio-ordenes-trabajo";
import type { EstadoOrdenTrabajo } from "@/tipos/orden-trabajo";

type PropiedadesCamposEstadoFechasOrdenTrabajo = {
  permiteCambiarEstado: boolean;
  estado: string;
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
          {props.estadosDisponibles.map((estadoDisponible) => (
            <option key={estadoDisponible} value={estadoDisponible}>
              {obtenerEtiquetaEstadoOrdenTrabajo(estadoDisponible)}
            </option>
          ))}
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
