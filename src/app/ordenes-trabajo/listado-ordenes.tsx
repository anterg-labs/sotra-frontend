import { anticiparConsulta, resolverConsulta, type ConsultaAnticipada } from "@/servicios/servidor/consulta-anticipada";
import { InformarResultados } from "@/componentes/listado/navegacion-listado";
import { PaginacionListado } from "@/componentes/listado/paginacion-listado";
import { listarOrdenesTrabajoServidor } from "@/servicios/servidor/ordenes-trabajo";
import type { FiltrosOrdenesTrabajo } from "@/tipos/orden-trabajo";
import { RUTA_ORDENES } from "./filtros";
import { TablaOrdenes } from "./tabla-ordenes";

/** Trae la página de órdenes en el servidor; si falla, el mensaje queda en línea y los filtros siguen disponibles. */
export async function ListadoOrdenes(props: { filtros: FiltrosOrdenesTrabajo; consulta?: ConsultaAnticipada<Awaited<ReturnType<typeof listarOrdenesTrabajoServidor>>> }) {
  const { filtros } = props;

  let pagina;
  try {
    pagina = await resolverConsulta(props.consulta ?? anticiparConsulta(listarOrdenesTrabajoServidor(filtros)));
  } catch (error) {
    return (
      <>
      <InformarResultados total={null} />
      <p className="form-error-banner" role="alert">
        {error instanceof Error ? error.message : "No se pudo obtener el listado de órdenes de trabajo."}
      </p>
      </>
    );
  }

  if (pagina.elementos.length === 0) {
    return (
      <>
        <InformarResultados total={0} />
        <p className="empty-state">No se encontraron órdenes de trabajo con los filtros aplicados.</p>
      </>
    );
  }

  const filtrosSinPagina = Object.fromEntries(
    Object.entries({ ...filtros, conSugerencias: filtros.conSugerencias ? "true" : "" }).filter(([nombre]) => nombre !== "pagina"),
  ) as Record<string, string>;

  return (
    <>
      <InformarResultados total={pagina.totalElementos} />
      <TablaOrdenes filtros={filtros} ordenes={pagina.elementos} unaSolaPagina={pagina.totalPaginas <= 1} />
      <PaginacionListado
        filtros={filtrosSinPagina}
        pagina={pagina.pagina}
        plural="órdenes"
        ruta={RUTA_ORDENES}
        totalElementos={pagina.totalElementos}
        totalPaginas={pagina.totalPaginas}
      />
    </>
  );
}
