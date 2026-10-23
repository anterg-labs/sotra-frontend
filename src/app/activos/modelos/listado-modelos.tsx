import { anticiparConsulta, resolverConsulta, type ConsultaAnticipada } from "@/servicios/servidor/consulta-anticipada";
import { InformarResultados } from "@/componentes/listado/navegacion-listado";
import { PaginacionListado } from "@/componentes/listado/paginacion-listado";
import { listarModelosMaquinaServidor } from "@/servicios/servidor/modelos-maquina";
import type { FiltrosModelosMaquina } from "@/tipos/modelo-maquina";
import { RUTA_MODELOS } from "./filtros";
import { TablaModelos } from "./tabla-modelos";

/** Trae la página de modelos en el servidor; si falla, el error queda en línea y los filtros siguen disponibles. */
export async function ListadoModelos(props: { filtros: FiltrosModelosMaquina; consulta?: ConsultaAnticipada<Awaited<ReturnType<typeof listarModelosMaquinaServidor>>> }) {
  const { filtros } = props;

  let pagina;
  try {
    pagina = await resolverConsulta(props.consulta ?? anticiparConsulta(listarModelosMaquinaServidor(filtros)));
  } catch {
    return (
      <>
        <InformarResultados total={null} />
        <p className="form-error-banner">No se pudo obtener el listado de modelos de máquina.</p>
      </>
    );
  }

  if (pagina.elementos.length === 0) {
    return (
      <>
        <InformarResultados total={0} />
        <p className="empty-state">No se encontraron modelos de máquina con los filtros aplicados.</p>
      </>
    );
  }

  return (
    <>
      <InformarResultados total={pagina.totalElementos} />
      <TablaModelos modelos={pagina.elementos} filtros={filtros} />
      <PaginacionListado
        filtros={{ buscar: filtros.buscar, tipoMaquinaId: filtros.tipoMaquinaId, estado: filtros.estado, ordenarPor: filtros.ordenarPor, direccionOrden: filtros.direccionOrden }}
        pagina={pagina.pagina}
        plural="modelos"
        ruta={RUTA_MODELOS}
        totalElementos={pagina.totalElementos}
        totalPaginas={pagina.totalPaginas}
      />
    </>
  );
}
