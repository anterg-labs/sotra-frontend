"use client";

import { useFiltrosEnVivo } from "@/componentes/listado/use-filtros-en-vivo";
import type { FiltrosUsuarios, Rol } from "@/tipos/usuario";
import { construirUrlUsuarios } from "./filtros";

type ValoresUsuarios = Pick<FiltrosUsuarios, "buscar" | "rolId" | "estado">;
const VACIOS: ValoresUsuarios = { buscar: "", rolId: "", estado: "" };

/** Filtros del listado en vivo: el texto espera un instante y el rol y el estado aplican al instante. */
export function BarraFiltrosUsuarios(props: { filtros: FiltrosUsuarios; roles: Rol[] }) {
  const { valores, cambiar, aplicarAhora, limpiar, estaPendiente } = useFiltrosEnVivo<ValoresUsuarios>({
    inicial: { buscar: props.filtros.buscar, rolId: props.filtros.rolId, estado: props.filtros.estado },
    construirUrl: (v) => construirUrlUsuarios({ ...v, pagina: 1 }),
  });

  return (
    <form
      aria-busy={estaPendiente}
      aria-label="Búsqueda y filtros"
      className="barra-filtros"
      onSubmit={(evento) => {
        evento.preventDefault();
        aplicarAhora();
      }}
    >
      <div className="form-field campo-busqueda">
        <label htmlFor="buscarUsuario">Buscar</label>
        <input
          id="buscarUsuario"
          onChange={(evento) => cambiar({ buscar: evento.target.value }, true)}
          placeholder="Nombre, apellido o correo electrónico"
          type="text"
          value={valores.buscar}
        />
      </div>
      <div className="form-field">
        <label htmlFor="rolUsuarioFiltro">Rol</label>
        <select id="rolUsuarioFiltro" onChange={(evento) => cambiar({ rolId: evento.target.value })} value={valores.rolId}>
          <option value="">Todos los roles</option>
          {props.roles.map((rol) => (
            <option key={rol.id} value={rol.id}>{rol.nombre}</option>
          ))}
        </select>
      </div>
      <div className="form-field">
        <label htmlFor="estadoUsuarioFiltro">Estado</label>
        <select id="estadoUsuarioFiltro" onChange={(evento) => cambiar({ estado: evento.target.value })} value={valores.estado}>
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
