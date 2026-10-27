import { anticiparConsulta, resolverConsulta, type ConsultaAnticipada } from "@/servicios/servidor/consulta-anticipada";
import { InformarResultados } from "@/componentes/listado/navegacion-listado";
import { PaginacionListado } from "@/componentes/listado/paginacion-listado";
import { listarDocumentosTecnicosServidor } from "@/servicios/servidor/documentos-tecnicos";
import { seEstaProcesando, type FiltrosDocumentosTecnicos } from "@/tipos/documento-tecnico";
import { ActualizarMientrasProcesa } from "./estado-procesamiento";
import { RUTA_DOCUMENTOS } from "./filtros";
import { TablaDocumentos } from "./tabla-documentos";

/** Trae la página de documentos en el servidor; si falla, el error queda en línea y los filtros siguen disponibles. */
export async function ListadoDocumentos(props: { filtros: FiltrosDocumentosTecnicos; consulta?: ConsultaAnticipada<Awaited<ReturnType<typeof listarDocumentosTecnicosServidor>>> }) {
  const { filtros } = props;

  let pagina;
  try {
    pagina = await resolverConsulta(props.consulta ?? anticiparConsulta(listarDocumentosTecnicosServidor(filtros)));
  } catch {
    return (
      <>
        <InformarResultados total={null} />
        <p className="form-error-banner">No se pudo obtener el listado de documentos técnicos.</p>
      </>
    );
  }

  if (pagina.elementos.length === 0) {
    return (
      <>
        <InformarResultados total={0} />
        <p className="empty-state">No se encontraron documentos técnicos con los filtros aplicados.</p>
      </>
    );
  }

  return (
    <>
      <InformarResultados total={pagina.totalElementos} />
      <ActualizarMientrasProcesa activo={pagina.elementos.some(seEstaProcesando)} />
      <TablaDocumentos documentos={pagina.elementos} filtros={filtros} unaSolaPagina={pagina.totalPaginas <= 1} />
      <PaginacionListado
        filtros={{ buscar: filtros.buscar, activoId: filtros.activoId, modeloMaquinaId: filtros.modeloMaquinaId, tipo: filtros.tipo, vigente: filtros.vigente, ordenarPor: filtros.ordenarPor, direccionOrden: filtros.direccionOrden }}
        pagina={pagina.pagina}
        plural="documentos"
        ruta={RUTA_DOCUMENTOS}
        totalElementos={pagina.totalElementos}
        totalPaginas={pagina.totalPaginas}
      />
    </>
  );
}
