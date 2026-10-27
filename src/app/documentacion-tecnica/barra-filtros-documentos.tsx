"use client";

import { Combobox } from "@/componentes/combobox";
import { useFiltrosEnVivo } from "@/componentes/listado/use-filtros-en-vivo";
import { listarActivosPaginados } from "@/servicios/servicio-activos";
import { listarModelosMaquinaPaginados } from "@/servicios/servicio-modelos-maquina";
import type { Activo } from "@/tipos/activo";
import type { ModeloMaquina } from "@/tipos/modelo-maquina";
import { obtenerEtiquetaTipoDocumento, TIPOS_DOCUMENTO, type FiltrosDocumentosTecnicos } from "@/tipos/documento-tecnico";
import { construirUrlDocumentos } from "./filtros";
import { FiltrosAvanzados, hayFiltrosAplicados } from "@/componentes/listado/filtros-avanzados";

type ValoresDocumentos = Pick<FiltrosDocumentosTecnicos, "buscar" | "activoId" | "modeloMaquinaId" | "tipo" | "vigente" | "ordenarPor" | "direccionOrden">;
const VACIOS: ValoresDocumentos = { buscar: "", activoId: "", modeloMaquinaId: "", tipo: "", vigente: "" };

function nombreVisibleDeActivo(activo: Activo) {
  return activo.nombre !== null && activo.nombre.trim() !== "" ? activo.nombre : activo.numSerie;
}

/** Filtros del listado en vivo: el texto espera un instante y el activo aplica al instante. */
export function BarraFiltrosDocumentos(props: { filtros: FiltrosDocumentosTecnicos; activos: Activo[]; modelosMaquina: ModeloMaquina[] }) {
  const { valores, cambiar, aplicarAhora, limpiar, estaPendiente } = useFiltrosEnVivo<ValoresDocumentos>({
    inicial: { buscar: props.filtros.buscar, activoId: props.filtros.activoId, modeloMaquinaId: props.filtros.modeloMaquinaId, tipo: props.filtros.tipo, vigente: props.filtros.vigente, ordenarPor: props.filtros.ordenarPor, direccionOrden: props.filtros.direccionOrden },
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
          placeholder="Título, descripción, archivo o activo"
          type="text"
          value={valores.buscar}
        />
      </div>
      <FiltrosAvanzados alLimpiar={() => limpiar(VACIOS)} hayFiltros={hayFiltrosAplicados(valores)}>
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
        <Combobox
          alCambiar={(modeloMaquinaId) => cambiar({ modeloMaquinaId })}
          buscarOpciones={async (consulta) => {
            const pagina = await listarModelosMaquinaPaginados({ buscar: consulta, tipoMaquinaId: "", estado: "", pagina: 1 });
            return pagina.elementos.map((modelo) => ({ valor: String(modelo.id), etiqueta: modelo.nombre }));
          }}
          etiqueta="Modelo de máquina"
          id="modeloDocumentoFiltro"
          opciones={props.modelosMaquina.map((modelo) => ({ valor: String(modelo.id), etiqueta: modelo.nombre }))}
          textoVacio="Todos los modelos"
          valor={valores.modeloMaquinaId}
        />
        <div className="form-field">
          <label htmlFor="tipoDocumentoFiltro">Tipo</label>
          <select id="tipoDocumentoFiltro" onChange={(evento) => cambiar({ tipo: evento.target.value })} value={valores.tipo}>
            <option value="">Todos los tipos</option>
            {TIPOS_DOCUMENTO.map((tipo) => (
              <option key={tipo} value={tipo}>{obtenerEtiquetaTipoDocumento(tipo)}</option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="vigenciaDocumentoFiltro">Vigencia</label>
          <select id="vigenciaDocumentoFiltro" onChange={(evento) => cambiar({ vigente: evento.target.value })} value={valores.vigente}>
            <option value="">Todos</option>
            <option value="true">Vigentes</option>
            <option value="false">Obsoletos</option>
          </select>
        </div>
      </FiltrosAvanzados>
    </form>
  );
}
