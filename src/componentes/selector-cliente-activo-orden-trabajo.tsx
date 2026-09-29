import type { Activo } from "@/tipos/activo";
import type { Cliente } from "@/tipos/cliente";

type PropiedadesSelectorClienteActivoOrdenTrabajo = {
  clientes: Cliente[];
  activos: Activo[];
  clienteId: string;
  activoId: string;
  activoIdInicial: string;
  alCambiarCliente: (clienteId: string) => void;
  alCambiarActivo: (activoId: string) => void;
};

export function SelectorClienteActivoOrdenTrabajo(props: PropiedadesSelectorClienteActivoOrdenTrabajo) {
  function cambiarCliente(evento: React.ChangeEvent<HTMLSelectElement>) {
    props.alCambiarCliente(evento.target.value);
  }

  function cambiarActivo(evento: React.ChangeEvent<HTMLSelectElement>) {
    props.alCambiarActivo(evento.target.value);
  }

  function obtenerNombreVisibleDeActivo(activo: Activo) {
    if (activo.nombre !== null && activo.nombre.trim() !== "") {
      return activo.nombre;
    }

    return activo.numSerie;
  }

  const activosDelCliente: Activo[] = [];
  for (const activo of props.activos) {
    const perteneceAlCliente = String(activo.clienteId) === props.clienteId;
    const estaDisponible = activo.estado === "activo" || String(activo.id) === props.activoIdInicial;
    if (perteneceAlCliente && estaDisponible) {
      activosDelCliente.push(activo);
    }
  }

  let avisoSinActivos = null;
  if (props.clienteId !== "" && activosDelCliente.length === 0) {
    avisoSinActivos = (
      <p className="field-error">Este cliente no tiene activos disponibles. Registrá uno en la sección Activos.</p>
    );
  }

  return (
    <>
      <div className="form-field">
        <label htmlFor="clienteId">Cliente</label>
        <select id="clienteId" onChange={cambiarCliente} required value={props.clienteId}>
          <option disabled value="">Seleccioná un cliente</option>
          {props.clientes.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>{cliente.razonSocial}</option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="activoId">Activo</label>
        <select id="activoId" onChange={cambiarActivo} required value={props.activoId}>
          <option disabled value="">Seleccioná un activo</option>
          {activosDelCliente.map((activo) => (
            <option key={activo.id} value={activo.id}>{obtenerNombreVisibleDeActivo(activo)}</option>
          ))}
        </select>
        {avisoSinActivos}
      </div>
    </>
  );
}
