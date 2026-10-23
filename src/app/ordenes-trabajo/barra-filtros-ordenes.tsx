"use client";

import { Combobox } from "@/componentes/combobox";
import { FiltroFecha, rangoDeFechasInvalido } from "@/componentes/filtro-fecha";
import { useFiltrosEnVivo } from "@/componentes/listado/use-filtros-en-vivo";
import { listarActivosPaginados } from "@/servicios/servicio-activos";
import { listarClientesPaginados } from "@/servicios/servicio-clientes";
import { listarTecnicosPaginados, obtenerEtiquetaEstadoOrdenTrabajo } from "@/servicios/servicio-ordenes-trabajo";
import type { Activo } from "@/tipos/activo";
import type { Cliente } from "@/tipos/cliente";
import { estadosOrdenTrabajo, type FiltrosOrdenesTrabajo } from "@/tipos/orden-trabajo";
import type { Usuario } from "@/tipos/usuario";
import { construirUrlOrdenes } from "./filtros";

type ValoresOrdenes = Omit<FiltrosOrdenesTrabajo, "pagina">;
const VACIOS: ValoresOrdenes = {
  buscar: "", clienteId: "", activoId: "", tecnicoId: "", estado: "", prioridad: "", tipo: "",
  fechaDesde: "", fechaHasta: "", conSugerencias: false,
};

function nombreVisibleDeActivo(activo: Activo) {
  return activo.nombre !== null && activo.nombre.trim() !== "" ? activo.nombre : activo.numSerie;
}

type PropiedadesBarra = {
  filtros: FiltrosOrdenesTrabajo;
  clientes: Cliente[];
  activos: Activo[];
  tecnicos: Usuario[];
  /** Sin permiso para listar usuarios (técnico, pañolero) no se muestra el filtro por técnico. */
  puedeFiltrarPorTecnico?: boolean;
};

/**
 * Filtros del listado en vivo: el texto espera un instante y lo demás aplica al instante.
 * Con un rango de fechas invertido no se consulta: el error queda junto al campo y el foco en la fecha final.
 */
export function BarraFiltrosOrdenes(props: PropiedadesBarra) {
  const { filtros } = props;
  const { valores, cambiar, aplicarAhora, limpiar, estaPendiente } = useFiltrosEnVivo<ValoresOrdenes>({
    inicial: {
      buscar: filtros.buscar, clienteId: filtros.clienteId, activoId: filtros.activoId, tecnicoId: filtros.tecnicoId,
      estado: filtros.estado, prioridad: filtros.prioridad, tipo: filtros.tipo, fechaDesde: filtros.fechaDesde,
      fechaHasta: filtros.fechaHasta, conSugerencias: filtros.conSugerencias,
    },
    construirUrl: (v) => construirUrlOrdenes({ ...v, pagina: 1 }),
    sonValidos: (v) => !rangoDeFechasInvalido(v.fechaDesde, v.fechaHasta),
    alInvalido: () => document.getElementById("fechaCreacion-hasta")?.focus(),
  });

  const activosDelCliente = props.activos.filter((activo) => valores.clienteId === "" || String(activo.clienteId) === valores.clienteId);

  return (
    <form
      aria-busy={estaPendiente}
      aria-label="Búsqueda y filtros"
      className="barra-filtros"
      noValidate
      onSubmit={(evento) => {
        evento.preventDefault();
        aplicarAhora();
      }}
    >
      <div className="form-field campo-busqueda">
        <label htmlFor="buscar">Buscar</label>
        <input
          id="buscar"
          onChange={(evento) => cambiar({ buscar: evento.target.value }, true)}
          placeholder="Número, descripción, cliente, activo o técnico"
          type="text"
          value={valores.buscar}
        />
      </div>

      <Combobox
        alCambiar={(clienteId) => cambiar({ clienteId, activoId: "" })}
        buscarOpciones={async (consulta) => {
          const pagina = await listarClientesPaginados({ buscar: consulta, estado: "", pagina: 1 });
          return pagina.elementos.map((cliente) => ({ valor: String(cliente.id), etiqueta: cliente.razonSocial }));
        }}
        etiqueta="Cliente"
        id="clienteId"
        opciones={props.clientes.map((cliente) => ({ valor: String(cliente.id), etiqueta: cliente.razonSocial }))}
        textoVacio="Todos los clientes"
        valor={valores.clienteId}
      />

      <Combobox
        alCambiar={(activoId) => cambiar({ activoId })}
        buscarOpciones={async (consulta) => {
          const pagina = await listarActivosPaginados({ buscar: consulta, clienteId: valores.clienteId, modeloMaquinaId: "", estado: "", pagina: 1 });
          return pagina.elementos.map((activo) => ({ valor: String(activo.id), etiqueta: nombreVisibleDeActivo(activo) }));
        }}
        etiqueta="Activo"
        id="activoId"
        opciones={activosDelCliente.map((activo) => ({ valor: String(activo.id), etiqueta: nombreVisibleDeActivo(activo) }))}
        textoVacio="Todos los activos"
        valor={valores.activoId}
      />

      {props.puedeFiltrarPorTecnico ?? true ? (
        <Combobox
          alCambiar={(tecnicoId) => cambiar({ tecnicoId })}
          buscarOpciones={async (consulta) => {
            const tecnicos = await listarTecnicosPaginados(consulta);
            return tecnicos.map((tecnico) => ({ valor: String(tecnico.id), etiqueta: `${tecnico.nombre} ${tecnico.apellido}` }));
          }}
          etiqueta="Técnico"
          id="tecnicoId"
          opciones={props.tecnicos.map((tecnico) => ({ valor: String(tecnico.id), etiqueta: `${tecnico.nombre} ${tecnico.apellido}` }))}
          textoVacio="Todos los técnicos"
          valor={valores.tecnicoId}
        />
      ) : null}

      <div className="form-field">
        <label htmlFor="estado">Estado</label>
        <select id="estado" onChange={(evento) => cambiar({ estado: evento.target.value })} value={valores.estado}>
          <option value="">Todos los estados</option>
          {estadosOrdenTrabajo.map((estadoOrden) => (
            <option key={estadoOrden} value={estadoOrden}>{obtenerEtiquetaEstadoOrdenTrabajo(estadoOrden)}</option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="prioridad">Prioridad</label>
        <select id="prioridad" onChange={(evento) => cambiar({ prioridad: evento.target.value })} value={valores.prioridad}>
          <option value="">Todas las prioridades</option>
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="tipo">Tipo de mantenimiento</label>
        <select id="tipo" onChange={(evento) => cambiar({ tipo: evento.target.value })} value={valores.tipo}>
          <option value="">Todos los tipos</option>
          <option value="preventivo">Preventivo</option>
          <option value="correctivo">Correctivo</option>
        </select>
      </div>

      <FiltroFecha
        alCambiar={(fechaDesde, fechaHasta) => cambiar({ fechaDesde, fechaHasta })}
        etiqueta="Creada"
        fechaDesde={valores.fechaDesde}
        fechaHasta={valores.fechaHasta}
        id="fechaCreacion"
      />

      <div className="form-field campo-casilla">
        <label className="flex items-center gap-2" htmlFor="conSugerencias">
          <input
            checked={valores.conSugerencias}
            id="conSugerencias"
            onChange={(evento) => cambiar({ conSugerencias: evento.target.checked })}
            role="switch"
            type="checkbox"
          />
          Solo con recomendaciones de IA
        </label>
      </div>
      <div className="barra-filtros-acciones">
        <button className="secondary-button" onClick={() => limpiar(VACIOS)} type="button">
          Limpiar filtros
        </button>
      </div>
    </form>
  );
}
