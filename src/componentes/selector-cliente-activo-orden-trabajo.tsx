import { Combobox, type OpcionCombobox } from "@/componentes/combobox";
import { listarActivosPaginados } from "@/servicios/servicio-activos";
import { listarClientesPaginados } from "@/servicios/servicio-clientes";
import type { Activo } from "@/tipos/activo";
import type { Cliente } from "@/tipos/cliente";

type PropiedadesSelectorClienteActivoOrdenTrabajo = {
  clientes: Cliente[];
  activos: Activo[];
  clienteId: string;
  activoId: string;
  activoIdInicial: string;
  errores?: { clienteId?: string; activoId?: string };
  alCambiarCliente: (clienteId: string) => void;
  alCambiarActivo: (activoId: string) => void;
  alRegistrarCliente: () => void;
};

export function SelectorClienteActivoOrdenTrabajo(props: PropiedadesSelectorClienteActivoOrdenTrabajo) {
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

  async function buscarClientes(consulta: string): Promise<OpcionCombobox[]> {
    const pagina = await listarClientesPaginados({ buscar: consulta, estado: "activo", pagina: 1 });
    return pagina.elementos.map((cliente) => ({ valor: String(cliente.id), etiqueta: cliente.razonSocial }));
  }

  async function buscarActivos(consulta: string): Promise<OpcionCombobox[]> {
    const pagina = await listarActivosPaginados({
      buscar: consulta,
      clienteId: props.clienteId,
      modeloMaquinaId: "",
      estado: "activo",
      pagina: 1,
    });
    return pagina.elementos.map((activo) => ({ valor: String(activo.id), etiqueta: obtenerNombreVisibleDeActivo(activo) }));
  }

  return (
    <>
      <div className="flex min-w-0 flex-wrap items-end gap-2">
        <div className="min-w-0 flex-[1_1_180px]">
          <Combobox
            alCambiar={props.alCambiarCliente}
            buscarOpciones={buscarClientes}
            etiqueta="Cliente"
            id="clienteId"
            idError={props.errores?.clienteId ? "clienteId-error" : undefined}
            opciones={props.clientes.map((cliente) => ({ valor: String(cliente.id), etiqueta: cliente.razonSocial }))}
            requerido
            tieneError={Boolean(props.errores?.clienteId)}
            textoVacio="Seleccioná un cliente"
            valor={props.clienteId}
          />
          {props.errores?.clienteId ? <p className="field-error" id="clienteId-error" role="alert">{props.errores.clienteId}</p> : null}
        </div>
        <button className="secondary-button" onClick={props.alRegistrarCliente} type="button">Nuevo cliente</button>
      </div>

      <div className="min-w-0">
        <Combobox
          alCambiar={props.alCambiarActivo}
          buscarOpciones={buscarActivos}
          deshabilitado={props.clienteId === ""}
          etiqueta="Activo"
          id="activoId"
          idError={props.errores?.activoId ? "activoId-error" : undefined}
          opciones={activosDelCliente.map((activo) => ({ valor: String(activo.id), etiqueta: obtenerNombreVisibleDeActivo(activo) }))}
          requerido
          tieneError={Boolean(props.errores?.activoId)}
          textoVacio="Seleccioná un activo"
          valor={props.activoId}
        />
        {props.errores?.activoId ? <p className="field-error" id="activoId-error" role="alert">{props.errores.activoId}</p> : null}
        {props.clienteId !== "" ? <p className="field-hint">Escribí para buscar entre los activos del cliente.</p> : null}
      </div>
    </>
  );
}
