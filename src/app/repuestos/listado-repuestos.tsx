import { anticiparConsulta, resolverConsulta, type ConsultaAnticipada } from "@/servicios/servidor/consulta-anticipada";
import { InformarResultados } from "@/componentes/listado/navegacion-listado";
import { PaginacionListado } from "@/componentes/listado/paginacion-listado";
import { listarRepuestosServidor } from "@/servicios/servidor/repuestos";
import { aFiltrosApiRepuestos, RUTA_REPUESTOS, type FiltrosUrlRepuestos } from "./filtros";
import { TablaRepuestos } from "./tabla-repuestos";

/** Trae la página de repuestos en el servidor; si falla, el error queda en línea y los filtros siguen disponibles. */
export async function ListadoRepuestos(props: { filtros: FiltrosUrlRepuestos; consulta?: ConsultaAnticipada<Awaited<ReturnType<typeof listarRepuestosServidor>>> }) {
  const { filtros } = props;

  let pagina;
  try {
    pagina = await resolverConsulta(props.consulta ?? anticiparConsulta(listarRepuestosServidor(aFiltrosApiRepuestos(filtros))));
  } catch {
    return (
      <>
        <InformarResultados total={null} />
        <p className="form-error-banner">No se pudo obtener el listado de repuestos.</p>
      </>
    );
  }

  if (pagina.elementos.length === 0) {
    return (
      <>
      <InformarResultados total={0} />
      <p className="empty-state">
        {filtros.stock === ""
          ? "No se encontraron repuestos con los filtros aplicados."
          : "No hay repuestos con stock bajo o sin stock con los filtros aplicados."}
      </p>
      </>
    );
  }

  return (
    <>
      <InformarResultados total={pagina.totalElementos} />
      <TablaRepuestos filtros={filtros} repuestos={pagina.elementos} />
      <PaginacionListado
        filtros={{ buscar: filtros.buscar, estado: filtros.estado, ubicacion: filtros.ubicacion, stock: filtros.stock, ordenarPor: filtros.ordenarPor, direccionOrden: filtros.direccionOrden }}
        pagina={pagina.pagina}
        plural="repuestos"
        ruta={RUTA_REPUESTOS}
        totalElementos={pagina.totalElementos}
        totalPaginas={pagina.totalPaginas}
      />
    </>
  );
}
