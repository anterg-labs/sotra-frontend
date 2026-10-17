"use client";

import { Combobox } from "@/componentes/combobox";
import { useFiltrosEnVivo } from "@/componentes/listado/use-filtros-en-vivo";
import { listarTiposMaquinaPaginados } from "@/servicios/servicio-tipos-maquina";
import type { FiltrosModelosMaquina } from "@/tipos/modelo-maquina";
import type { TipoMaquina } from "@/tipos/tipo-maquina";
import { construirUrlModelos } from "./filtros";

type ValoresModelos = Pick<FiltrosModelosMaquina, "buscar" | "tipoMaquinaId" | "estado">;
const VACIOS: ValoresModelos = { buscar: "", tipoMaquinaId: "", estado: "" };

/** Filtros del listado en vivo: el texto espera un instante; el tipo y el estado aplican al instante. */
export function BarraFiltrosModelos(props: { filtros: FiltrosModelosMaquina; tiposMaquina: TipoMaquina[] }) {
  const { valores, cambiar, aplicarAhora, limpiar, estaPendiente } = useFiltrosEnVivo<ValoresModelos>({
    inicial: { buscar: props.filtros.buscar, tipoMaquinaId: props.filtros.tipoMaquinaId, estado: props.filtros.estado },
    construirUrl: (v) => construirUrlModelos({ ...v, pagina: 1 }),
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
        <label htmlFor="buscarModelo">Buscar modelo</label>
        <input
          id="buscarModelo"
          onChange={(evento) => cambiar({ buscar: evento.target.value }, true)}
          placeholder="Nombre o descripción"
          type="text"
          value={valores.buscar}
        />
      </div>
      <Combobox
        alCambiar={(tipoMaquinaId) => cambiar({ tipoMaquinaId })}
        buscarOpciones={async (consulta) => {
          const pagina = await listarTiposMaquinaPaginados({ buscar: consulta, estado: "", pagina: 1 });
          return pagina.elementos.map((tipo) => ({ valor: String(tipo.id), etiqueta: tipo.nombre }));
        }}
        etiqueta="Tipo"
        id="tipoModeloFiltro"
        opciones={props.tiposMaquina.map((tipo) => ({ valor: String(tipo.id), etiqueta: tipo.nombre }))}
        textoVacio="Todos los tipos"
        valor={valores.tipoMaquinaId}
      />
      <div className="form-field">
        <label htmlFor="estadoModeloFiltro">Estado del modelo</label>
        <select id="estadoModeloFiltro" onChange={(evento) => cambiar({ estado: evento.target.value })} value={valores.estado}>
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
