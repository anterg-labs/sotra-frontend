import type { Usuario } from "@/tipos/usuario";

type PropiedadesCamposGeneralesOrdenTrabajo = {
  tecnicos: Usuario[];
  tecnicoId: string;
  tipo: string;
  prioridad: string;
  alCambiarTecnico: (tecnicoId: string) => void;
  alCambiarTipo: (tipo: string) => void;
  alCambiarPrioridad: (prioridad: string) => void;
};

export function CamposGeneralesOrdenTrabajo(props: PropiedadesCamposGeneralesOrdenTrabajo) {
  function cambiarTecnico(evento: React.ChangeEvent<HTMLSelectElement>) {
    props.alCambiarTecnico(evento.target.value);
  }

  function cambiarTipo(evento: React.ChangeEvent<HTMLSelectElement>) {
    props.alCambiarTipo(evento.target.value);
  }

  function cambiarPrioridad(evento: React.ChangeEvent<HTMLSelectElement>) {
    props.alCambiarPrioridad(evento.target.value);
  }

  return (
    <>
      <div className="form-field">
        <label htmlFor="tipo">Tipo de mantenimiento</label>
        <select id="tipo" onChange={cambiarTipo} value={props.tipo}>
          <option value="preventivo">Preventivo</option>
          <option value="correctivo">Correctivo</option>
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="prioridad">Prioridad</label>
        <select id="prioridad" onChange={cambiarPrioridad} value={props.prioridad}>
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="tecnicoId">Técnico responsable (opcional)</label>
        <select id="tecnicoId" onChange={cambiarTecnico} value={props.tecnicoId}>
          <option value="">Sin técnico asignado</option>
          {props.tecnicos.map((tecnico) => (
            <option key={tecnico.id} value={tecnico.id}>{tecnico.nombre + " " + tecnico.apellido}</option>
          ))}
        </select>
      </div>
    </>
  );
}
