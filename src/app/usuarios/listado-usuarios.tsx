import { anticiparConsulta, resolverConsulta, type ConsultaAnticipada } from "@/servicios/servidor/consulta-anticipada";
import { InformarResultados } from "@/componentes/listado/navegacion-listado";
import { PaginacionListado } from "@/componentes/listado/paginacion-listado";
import { listarUsuariosServidor } from "@/servicios/servidor/usuarios";
import type { FiltrosUsuarios } from "@/tipos/usuario";
import { RUTA_USUARIOS, estadoUsuariosParaUrl } from "./filtros";
import { TablaUsuarios } from "./tabla-usuarios";

/** Trae la página de usuarios en el servidor; si falla, el error queda en línea y los filtros siguen disponibles. */
export async function ListadoUsuarios(props: { filtros: FiltrosUsuarios; consulta?: ConsultaAnticipada<Awaited<ReturnType<typeof listarUsuariosServidor>>> }) {
  const { filtros } = props;

  let pagina;
  try {
    pagina = await resolverConsulta(props.consulta ?? anticiparConsulta(listarUsuariosServidor(filtros)));
  } catch {
    return (
      <>
        <InformarResultados total={null} />
        <p className="form-error-banner">No se pudo obtener el listado de usuarios.</p>
      </>
    );
  }

  if (pagina.elementos.length === 0) {
    return (
      <>
        <InformarResultados total={0} />
        <p className="empty-state">No se encontraron usuarios con los filtros aplicados.</p>
      </>
    );
  }

  return (
    <>
      <InformarResultados total={pagina.totalElementos} />
      <TablaUsuarios usuarios={pagina.elementos} filtros={filtros} unaSolaPagina={pagina.totalPaginas <= 1} />
      <PaginacionListado
        filtros={{ buscar: filtros.buscar, rolId: filtros.rolId, estado: estadoUsuariosParaUrl(filtros.estado), ordenarPor: filtros.ordenarPor, direccionOrden: filtros.direccionOrden }}
        pagina={pagina.pagina}
        plural="usuarios"
        ruta={RUTA_USUARIOS}
        totalElementos={pagina.totalElementos}
        totalPaginas={pagina.totalPaginas}
      />
    </>
  );
}
