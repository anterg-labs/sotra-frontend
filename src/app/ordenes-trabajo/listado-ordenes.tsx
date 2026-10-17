import { anticiparConsulta, resolverConsulta, type ConsultaAnticipada } from "@/servicios/servidor/consulta-anticipada";
import Link from "next/link";
import { IconoLapiz, IconoOjo } from "@/componentes/iconos";
import { InformarResultados } from "@/componentes/listado/navegacion-listado";
import { PaginacionListado } from "@/componentes/listado/paginacion-listado";
import { listarOrdenesTrabajoServidor } from "@/servicios/servidor/ordenes-trabajo";
import { formatearFechaPrevista, obtenerEtiquetaEstadoOrdenTrabajo } from "@/servicios/servicio-ordenes-trabajo";
import type { FiltrosOrdenesTrabajo } from "@/tipos/orden-trabajo";
import { RUTA_ORDENES } from "./filtros";
import { formatearFechaCorta } from "@/utilidades/fechas";

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
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>N°</th>
              <th>Cliente</th>
              <th>Activo</th>
              <th>Tipo</th>
              <th>Prioridad</th>
              <th>Técnico</th>
              <th>Estado</th>
              <th>Fecha de creación</th>
              <th>Fecha prevista</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pagina.elementos.map((orden) => (
              <tr key={orden.id}>
                <td><strong>{orden.id}</strong></td>
                <td>{orden.nombreCliente}</td>
                <td>{orden.nombreActivo}</td>
                <td>{orden.tipo}</td>
                <td>
                  <span className={"status prioridad-" + orden.prioridad}>{orden.prioridad}</span>
                </td>
                <td>{orden.nombreTecnico ? orden.nombreTecnico : "Sin asignar"}</td>
                <td>
                  <span className={"status status-" + orden.estado}>{obtenerEtiquetaEstadoOrdenTrabajo(orden.estado)}</span>
                </td>
                <td>{formatearFechaCorta(orden.creadoEn)}</td>
                <td>{formatearFechaPrevista(orden.fechaPrevistaEjecucion)}</td>
                <td>
                  <div className="table-actions">
                    <Link aria-label="Ver detalle" className="boton-icono" href={"/ordenes-trabajo/" + orden.id} title="Ver detalle">
                      <IconoOjo />
                    </Link>
                    {orden.estado !== "cerrada" ? (
                      <Link
                        aria-label="Modificar orden"
                        className="boton-icono"
                        href={"/ordenes-trabajo/" + orden.id + "/editar"}
                        title="Modificar orden"
                      >
                        <IconoLapiz />
                      </Link>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
