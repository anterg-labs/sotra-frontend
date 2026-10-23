"use client";

import { Combobox } from "@/componentes/combobox";
import { useFiltrosEnVivo } from "@/componentes/listado/use-filtros-en-vivo";
import { listarClientesPaginados } from "@/servicios/servicio-clientes";
import { listarModelosMaquinaPaginados } from "@/servicios/servicio-modelos-maquina";
import type { FiltrosActivos } from "@/tipos/activo";
import type { Cliente } from "@/tipos/cliente";
import type { ModeloMaquina } from "@/tipos/modelo-maquina";
import { construirUrlActivos } from "./filtros";

type ValoresActivos = Pick<FiltrosActivos, "buscar" | "clienteId" | "modeloMaquinaId" | "estado" | "ordenarPor" | "direccionOrden">;
const VACIOS: ValoresActivos = { buscar: "", clienteId: "", modeloMaquinaId: "", estado: "" };

/** Filtros del listado en vivo: el texto espera un instante; cliente, modelo y estado aplican al instante. */
export function BarraFiltrosActivos(props: { filtros: FiltrosActivos; clientes: Cliente[]; modelosMaquina: ModeloMaquina[] }) {
  const { valores, cambiar, aplicarAhora, limpiar, estaPendiente } = useFiltrosEnVivo<ValoresActivos>({
    inicial: {
      buscar: props.filtros.buscar,
      clienteId: props.filtros.clienteId,
      modeloMaquinaId: props.filtros.modeloMaquinaId,
      estado: props.filtros.estado, ordenarPor: props.filtros.ordenarPor, direccionOrden: props.filtros.direccionOrden },
    construirUrl: (v) => construirUrlActivos({ ...v, pagina: 1 }),
  });

  return (
    <form
      aria-busy={estaPendiente}
      aria-label="Búsqueda y filtros de activos"
      className="barra-filtros"
      onSubmit={(evento) => {
        evento.preventDefault();
        aplicarAhora();
      }}
    >
      <div className="form-field campo-busqueda">
        <label htmlFor="buscarActivo">Buscar</label>
        <input
          id="buscarActivo"
          onChange={(evento) => cambiar({ buscar: evento.target.value }, true)}
          placeholder="Nombre, número de serie, ubicación o descripción"
          type="text"
          value={valores.buscar}
        />
      </div>
      <Combobox
        alCambiar={(clienteId) => cambiar({ clienteId })}
        buscarOpciones={async (consulta) => {
          const pagina = await listarClientesPaginados({ buscar: consulta, estado: "", pagina: 1 });
          return pagina.elementos.map((cliente) => ({ valor: String(cliente.id), etiqueta: cliente.razonSocial }));
        }}
        etiqueta="Cliente"
        id="clienteFiltro"
        opciones={props.clientes.map((cliente) => ({ valor: String(cliente.id), etiqueta: cliente.razonSocial }))}
        textoVacio="Todos los clientes"
        valor={valores.clienteId}
      />
      <Combobox
        alCambiar={(modeloMaquinaId) => cambiar({ modeloMaquinaId })}
        buscarOpciones={async (consulta) => {
          const pagina = await listarModelosMaquinaPaginados({ buscar: consulta, tipoMaquinaId: "", estado: "", pagina: 1 });
          return pagina.elementos.map((modelo) => ({ valor: String(modelo.id), etiqueta: modelo.nombre }));
        }}
        etiqueta="Modelo"
        id="modeloFiltro"
        opciones={props.modelosMaquina.map((modelo) => ({ valor: String(modelo.id), etiqueta: modelo.nombre }))}
        textoVacio="Todos los modelos"
        valor={valores.modeloMaquinaId}
      />
      <div className="form-field">
        <label htmlFor="estadoActivoFiltro">Estado</label>
        <select id="estadoActivoFiltro" onChange={(evento) => cambiar({ estado: evento.target.value })} value={valores.estado}>
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
      </div>
      <div className="barra-filtros-acciones">
        <button className="secondary-button" onClick={() => limpiar(VACIOS)} type="button">
          Limpiar filtros
        </button>
      </div>
    </form>
  );
}
