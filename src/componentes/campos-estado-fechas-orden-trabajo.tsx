import { obtenerEtiquetaEstadoOrdenTrabajo } from "@/servicios/servicio-ordenes-trabajo";
import { estadosOrdenTrabajo } from "@/tipos/orden-trabajo";

type PropiedadesCamposEstadoFechasOrdenTrabajo = {
  permiteCambiarEstado: boolean;
  estado: string;
  fechaPrevistaEjecucion: string;
  alCambiarEstado: (estado: string) => void;
  alCambiarFechaPrevista: (fechaPrevistaEjecucion: string) => void;
};

export function CamposEstadoFechasOrdenTrabajo(props: PropiedadesCamposEstadoFechasOrdenTrabajo) {
  function cambiarEstado(evento: React.ChangeEvent<HTMLSelectElement>) {
    props.alCambiarEstado(evento.target.value);
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
          {estadosOrdenTrabajo.map((estadoDisponible) => (
            <option key={estadoDisponible} value={estadoDisponible}>
              {obtenerEtiquetaEstadoOrdenTrabajo(estadoDisponible)}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <>
      <div className="form-field">
        <label htmlFor="fechaPrevistaEjecucion">Fecha prevista de ejecución</label>
        <input
          id="fechaPrevistaEjecucion"
          onChange={cambiarFechaPrevista}
          required
          type="date"
          value={props.fechaPrevistaEjecucion}
        />
      </div>

      {campoEstado}
    </>
  );
}
