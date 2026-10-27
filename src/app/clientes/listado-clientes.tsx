import { InformarResultados } from "@/componentes/listado/navegacion-listado";
import { PaginacionListado } from "@/componentes/listado/paginacion-listado";
import { listarClientesServidor } from "@/servicios/servidor/clientes";
import type { FiltrosClientes } from "@/tipos/cliente";
import { estadoClientesParaUrl, RUTA_CLIENTES } from "./filtros";
import { TablaClientes } from "./tabla-clientes";

/** Trae la página de clientes en el servidor; si falla, el error queda en línea y los filtros siguen disponibles. */
export async function ListadoClientes(props: { filtros: FiltrosClientes }) {
  const { filtros } = props;

  let pagina;
  try {
    pagina = await listarClientesServidor(filtros);
  } catch {
    return (
      <>
        <InformarResultados total={null} />
        <p className="form-error-banner">No se pudo obtener el listado de clientes.</p>
      </>
    );
  }

  if (pagina.elementos.length === 0) {
    return (
      <>
        <InformarResultados total={0} />
        <p className="empty-state">No se encontraron clientes con los filtros aplicados.</p>
      </>
    );
  }

  return (
    <>
      <InformarResultados total={pagina.totalElementos} />
      <TablaClientes clientes={pagina.elementos} filtros={filtros} unaSolaPagina={pagina.totalPaginas <= 1} />
      <PaginacionListado
        filtros={{ buscar: filtros.buscar, estado: estadoClientesParaUrl(filtros.estado), conActivos: filtros.conActivos ? "true" : "", ordenarPor: filtros.ordenarPor, direccionOrden: filtros.direccionOrden }}
        pagina={pagina.pagina}
        plural="clientes"
        ruta={RUTA_CLIENTES}
        totalElementos={pagina.totalElementos}
        totalPaginas={pagina.totalPaginas}
      />
    </>
  );
}
