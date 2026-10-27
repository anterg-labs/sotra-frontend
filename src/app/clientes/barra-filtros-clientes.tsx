"use client";

import { useFiltrosEnVivo } from "@/componentes/listado/use-filtros-en-vivo";
import type { FiltrosClientes } from "@/tipos/cliente";
import { construirUrlClientes } from "./filtros";

type ValoresClientes = Pick<FiltrosClientes, "buscar" | "estado" | "conActivos" | "ordenarPor" | "direccionOrden">;
const VACIOS: ValoresClientes = { buscar: "", estado: "", conActivos: false };

/** Filtros del listado en vivo: el texto espera un instante y el estado aplica al instante; ambos escriben la URL. */
export function BarraFiltrosClientes(props: { filtros: FiltrosClientes }) {
  const { valores, cambiar, aplicarAhora, limpiar, estaPendiente } = useFiltrosEnVivo<ValoresClientes>({
    inicial: { buscar: props.filtros.buscar, estado: props.filtros.estado, conActivos: props.filtros.conActivos ?? false, ordenarPor: props.filtros.ordenarPor, direccionOrden: props.filtros.direccionOrden },
    construirUrl: (v) => construirUrlClientes({ ...v, pagina: 1 }),
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
        <label htmlFor="buscarCliente">Buscar</label>
        <input
          id="buscarCliente"
          onChange={(evento) => cambiar({ buscar: evento.target.value }, true)}
          placeholder="Razón social, contacto o correo"
          type="text"
          value={valores.buscar}
        />
      </div>
      <div className="form-field">
        <label htmlFor="estadoClienteFiltro">Estado</label>
        <select id="estadoClienteFiltro" onChange={(evento) => cambiar({ estado: evento.target.value })} value={valores.estado}>
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
      </div>
      <div className="form-field campo-casilla">
        <label className="flex items-center gap-2" htmlFor="conActivosCliente">
          <input
            checked={valores.conActivos ?? false}
            id="conActivosCliente"
            onChange={(evento) => cambiar({ conActivos: evento.target.checked })}
            role="switch"
            type="checkbox"
          />
          Solo con activos asociados
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
