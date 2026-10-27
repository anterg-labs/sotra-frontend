import { InformarResultados } from "@/componentes/listado/navegacion-listado";
import { PaginacionListado } from "@/componentes/listado/paginacion-listado";
import { listarTiposMaquinaServidor } from "@/servicios/servidor/tipos-maquina";
import type { FiltrosTiposMaquina } from "@/tipos/tipo-maquina";
import { RUTA_TIPOS } from "./filtros";
import { TablaTipos } from "./tabla-tipos";

/** Trae la página de tipos de máquina en el servidor; si falla, el error queda en línea y los filtros siguen disponibles. */
export async function ListadoTipos(props: { filtros: FiltrosTiposMaquina }) {
  const { filtros } = props;

  let pagina;
  try {
    pagina = await listarTiposMaquinaServidor(filtros);
  } catch {
    return (
      <>
        <InformarResultados total={null} />
        <p className="form-error-banner">No se pudo obtener el listado de tipos de máquina.</p>
      </>
    );
  }

  if (pagina.elementos.length === 0) {
    return (
      <>
        <InformarResultados total={0} />
        <p className="empty-state">No se encontraron tipos de máquina con los filtros aplicados.</p>
      </>
    );
  }

  return (
    <>
      <InformarResultados total={pagina.totalElementos} />
      <TablaTipos tipos={pagina.elementos} filtros={filtros} unaSolaPagina={pagina.totalPaginas <= 1} />
      <PaginacionListado
        filtros={{ buscar: filtros.buscar, estado: filtros.estado, ordenarPor: filtros.ordenarPor, direccionOrden: filtros.direccionOrden }}
        pagina={pagina.pagina}
        plural="tipos"
        ruta={RUTA_TIPOS}
        totalElementos={pagina.totalElementos}
        totalPaginas={pagina.totalPaginas}
      />
    </>
  );
}
