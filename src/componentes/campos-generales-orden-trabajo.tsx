import { Combobox } from "@/componentes/combobox";
import { listarTecnicosPaginados } from "@/servicios/servicio-ordenes-trabajo";
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

      <Combobox
        alCambiar={props.alCambiarTecnico}
        buscarOpciones={async (consulta) => {
          const tecnicos = await listarTecnicosPaginados(consulta);
          return tecnicos.map((tecnico) => ({ valor: String(tecnico.id), etiqueta: `${tecnico.nombre} ${tecnico.apellido}` }));
        }}
        etiqueta="Técnico responsable (opcional)"
        id="tecnicoId"
        opciones={props.tecnicos.map((tecnico) => ({
          valor: String(tecnico.id),
          etiqueta: tecnico.nombre + " " + tecnico.apellido,
        }))}
        textoVacio="Sin técnico asignado"
        valor={props.tecnicoId}
      />
    </>
  );
}
