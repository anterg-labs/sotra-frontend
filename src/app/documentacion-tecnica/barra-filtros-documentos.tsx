"use client";

import { Combobox } from "@/componentes/combobox";
import { useFiltrosEnVivo } from "@/componentes/listado/use-filtros-en-vivo";
import { listarActivosPaginados } from "@/servicios/servicio-activos";
import type { Activo } from "@/tipos/activo";
import type { FiltrosDocumentosTecnicos } from "@/tipos/documento-tecnico";
import { construirUrlDocumentos } from "./filtros";

type ValoresDocumentos = Pick<FiltrosDocumentosTecnicos, "buscar" | "activoId">;
const VACIOS: ValoresDocumentos = { buscar: "", activoId: "" };

function nombreVisibleDeActivo(activo: Activo) {
  return activo.nombre !== null && activo.nombre.trim() !== "" ? activo.nombre : activo.numSerie;
}

/** Filtros del listado en vivo: el texto espera un instante y el activo aplica al instante. */
export function BarraFiltrosDocumentos(props: { filtros: FiltrosDocumentosTecnicos; activos: Activo[] }) {
  const { valores, cambiar, aplicarAhora, limpiar, estaPendiente } = useFiltrosEnVivo<ValoresDocumentos>({
    inicial: { buscar: props.filtros.buscar, activoId: props.filtros.activoId },
    construirUrl: (v) => construirUrlDocumentos({ ...v, pagina: 1 }),
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
        <label htmlFor="buscarDocumento">Buscar</label>
        <input
          id="buscarDocumento"
          onChange={(evento) => cambiar({ buscar: evento.target.value }, true)}
          placeholder="Nombre del archivo o del activo"
          type="text"
          value={valores.buscar}
        />
      </div>
      <Combobox
        alCambiar={(activoId) => cambiar({ activoId })}
        buscarOpciones={async (consulta) => {
          const pagina = await listarActivosPaginados({ buscar: consulta, clienteId: "", modeloMaquinaId: "", estado: "", pagina: 1 });
          return pagina.elementos.map((activo) => ({ valor: String(activo.id), etiqueta: nombreVisibleDeActivo(activo) }));
        }}
        etiqueta="Activo asociado"
        id="activoDocumentoFiltro"
        opciones={props.activos.map((activo) => ({ valor: String(activo.id), etiqueta: nombreVisibleDeActivo(activo) }))}
        textoVacio="Todos los activos"
        valor={valores.activoId}
      />
      <div className="barra-filtros-acciones">
        <button className="secondary-button" onClick={() => limpiar(VACIOS)} type="button">
          Limpiar filtros
        </button>
      </div>
    </form>
  );
}
