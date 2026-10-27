"use client";

import { useFiltrosEnVivo } from "@/componentes/listado/use-filtros-en-vivo";
import type { FiltrosClientes } from "@/tipos/cliente";
import { construirUrlClientes } from "./filtros";
import { FiltrosAvanzados, hayFiltrosAplicados } from "@/componentes/listado/filtros-avanzados";

type ValoresClientes = Pick<FiltrosClientes, "buscar" | "estado" | "conActivos" | "ordenarPor" | "direccionOrden">;
const VACIOS: ValoresClientes = { buscar: "", estado: "activo", conActivos: false };

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
      <FiltrosAvanzados alLimpiar={() => limpiar(VACIOS)} hayFiltros={hayFiltrosAplicados(valores, { estado: "activo" })}>
          <div className="form-field">
            <label htmlFor="estadoClienteFiltro">Mostrar</label>
            <select id="estadoClienteFiltro" onChange={(evento) => cambiar({ estado: evento.target.value })} value={valores.estado}>
              <option value="activo">Solo clientes activos</option>
              <option value="inactivo">Solo clientes inactivos</option>
              <option value="">Todos los clientes</option>
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
      </FiltrosAvanzados>
    </form>
  );
}
