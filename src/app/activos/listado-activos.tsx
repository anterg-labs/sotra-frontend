import { anticiparConsulta, resolverConsulta, type ConsultaAnticipada } from "@/servicios/servidor/consulta-anticipada";
import { InformarResultados } from "@/componentes/listado/navegacion-listado";
import { PaginacionListado } from "@/componentes/listado/paginacion-listado";
import { listarActivosServidor } from "@/servicios/servidor/activos";
import type { FiltrosActivos } from "@/tipos/activo";
import { RUTA_ACTIVOS } from "./filtros";
import { TablaActivos } from "./tabla-activos";

/** Trae la página de activos en el servidor; si falla, el error queda en línea y los filtros siguen disponibles. */
export async function ListadoActivos(props: { filtros: FiltrosActivos; consulta?: ConsultaAnticipada<Awaited<ReturnType<typeof listarActivosServidor>>> }) {
  const { filtros } = props;

  let pagina;
  try {
    pagina = await resolverConsulta(props.consulta ?? anticiparConsulta(listarActivosServidor(filtros)));
  } catch {
    return (
      <>
        <InformarResultados total={null} />
        <p className="form-error-banner">No se pudo obtener el listado de activos.</p>
      </>
    );
  }

  if (pagina.elementos.length === 0) {
    return (
      <>
        <InformarResultados total={0} />
        <p className="empty-state">No se encontraron activos con los filtros aplicados.</p>
      </>
    );
  }

  return (
    <>
      <InformarResultados total={pagina.totalElementos} />
      <TablaActivos activos={pagina.elementos} filtros={filtros} unaSolaPagina={pagina.totalPaginas <= 1} />
      <PaginacionListado
        filtros={{
          buscar: filtros.buscar,
          clienteId: filtros.clienteId,
          modeloMaquinaId: filtros.modeloMaquinaId,
          estado: filtros.estado,
          ordenarPor: filtros.ordenarPor,
          direccionOrden: filtros.direccionOrden,
        }}
        pagina={pagina.pagina}
        plural="activos"
        ruta={RUTA_ACTIVOS}
        totalElementos={pagina.totalElementos}
        totalPaginas={pagina.totalPaginas}
      />
    </>
  );
}
