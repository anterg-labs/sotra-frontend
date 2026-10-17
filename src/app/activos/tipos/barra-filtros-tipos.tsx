"use client";

import { useFiltrosEnVivo } from "@/componentes/listado/use-filtros-en-vivo";
import type { FiltrosTiposMaquina } from "@/tipos/tipo-maquina";
import { construirUrlTipos } from "./filtros";

type ValoresTipos = Pick<FiltrosTiposMaquina, "buscar" | "estado">;
const VACIOS: ValoresTipos = { buscar: "", estado: "" };

/** Filtros del listado en vivo: el texto espera un instante y el estado aplica al instante. */
export function BarraFiltrosTipos(props: { filtros: FiltrosTiposMaquina }) {
  const { valores, cambiar, aplicarAhora, limpiar, estaPendiente } = useFiltrosEnVivo<ValoresTipos>({
    inicial: { buscar: props.filtros.buscar, estado: props.filtros.estado },
    construirUrl: (v) => construirUrlTipos({ ...v, pagina: 1 }),
  });

  return (
    <form
      aria-busy={estaPendiente}
      aria-label="Filtros"
      className="barra-filtros"
      onSubmit={(evento) => {
        evento.preventDefault();
        aplicarAhora();
      }}
    >
      <div className="form-field campo-busqueda">
        <label htmlFor="buscarTipo">Buscar tipo</label>
        <input
          id="buscarTipo"
          onChange={(evento) => cambiar({ buscar: evento.target.value }, true)}
          placeholder="Nombre"
          type="text"
          value={valores.buscar}
        />
      </div>
      <div className="form-field">
        <label htmlFor="estadoTipoFiltro">Estado del tipo</label>
        <select id="estadoTipoFiltro" onChange={(evento) => cambiar({ estado: evento.target.value })} value={valores.estado}>
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
      </div>
      <div className="barra-filtros-acciones">
        <button className="secondary-button" onClick={() => limpiar(VACIOS)} type="button">
          Limpiar
        </button>
      </div>
    </form>
  );
}
