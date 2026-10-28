"use client";

import { useFiltrosEnVivo } from "@/componentes/listado/use-filtros-en-vivo";
import type { FiltrosUsuarios, Rol } from "@/tipos/usuario";
import { construirUrlUsuarios } from "./filtros";
import { FiltrosAvanzados, hayFiltrosAplicados } from "@/componentes/listado/filtros-avanzados";

type ValoresUsuarios = Pick<FiltrosUsuarios, "buscar" | "rolId" | "estado" | "ordenarPor" | "direccionOrden">;
const VACIOS: ValoresUsuarios = { buscar: "", rolId: "", estado: "activo" };

/** Filtros del listado en vivo: el texto espera un instante y el rol y el estado aplican al instante. */
export function BarraFiltrosUsuarios(props: { filtros: FiltrosUsuarios; roles: Rol[] }) {
  const { valores, cambiar, aplicarAhora, limpiar, estaPendiente } = useFiltrosEnVivo<ValoresUsuarios>({
    inicial: { buscar: props.filtros.buscar, rolId: props.filtros.rolId, estado: props.filtros.estado, ordenarPor: props.filtros.ordenarPor, direccionOrden: props.filtros.direccionOrden },
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
      <FiltrosAvanzados alLimpiar={() => limpiar(VACIOS)} hayFiltros={hayFiltrosAplicados(valores, { estado: "activo" })}>
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
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
            <option value="">Todos</option>
          </select>
        </div>
      </FiltrosAvanzados>
    </form>
  );
}
