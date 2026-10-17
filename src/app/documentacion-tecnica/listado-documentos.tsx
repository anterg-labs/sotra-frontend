import { anticiparConsulta, resolverConsulta, type ConsultaAnticipada } from "@/servicios/servidor/consulta-anticipada";
import { InformarResultados } from "@/componentes/listado/navegacion-listado";
import { PaginacionListado } from "@/componentes/listado/paginacion-listado";
import { listarDocumentosTecnicosServidor } from "@/servicios/servidor/documentos-tecnicos";
import type { FiltrosDocumentosTecnicos } from "@/tipos/documento-tecnico";
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
      <TablaDocumentos documentos={pagina.elementos} />
      <PaginacionListado
        filtros={{ buscar: filtros.buscar, activoId: filtros.activoId }}
        pagina={pagina.pagina}
        plural="documentos"
        ruta={RUTA_DOCUMENTOS}
        totalElementos={pagina.totalElementos}
        totalPaginas={pagina.totalPaginas}
      />
    </>
  );
}
