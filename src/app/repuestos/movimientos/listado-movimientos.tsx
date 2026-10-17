import { anticiparConsulta, resolverConsulta, type ConsultaAnticipada } from "@/servicios/servidor/consulta-anticipada";
import Link from "next/link";
import { IconoOjo } from "@/componentes/iconos";
import { InformarResultados } from "@/componentes/listado/navegacion-listado";
import { PaginacionListado } from "@/componentes/listado/paginacion-listado";
import { listarMovimientosStockServidor } from "@/servicios/servidor/movimientos-stock";
import type { FiltrosMovimientosStock } from "@/tipos/movimiento-stock";
import { obtenerEtiquetaTipoMovimiento } from "@/validaciones/movimiento-stock";
import { RUTA_MOVIMIENTOS } from "./filtros";
import { formatearFechaCorta } from "@/utilidades/fechas";

/** Trae la página de movimientos en el servidor; si falla, el error queda en línea y los filtros siguen disponibles. */
export async function ListadoMovimientos(props: { filtros: FiltrosMovimientosStock; consulta?: ConsultaAnticipada<Awaited<ReturnType<typeof listarMovimientosStockServidor>>> }) {
  const { filtros } = props;

  let pagina;
  try {
    pagina = await resolverConsulta(props.consulta ?? anticiparConsulta(listarMovimientosStockServidor(filtros)));
  } catch (error) {
    return (
      <>
      <InformarResultados total={null} />
      <p className="form-error-banner" role="alert">
        {error instanceof Error ? error.message : "No se pudo obtener el listado de movimientos de stock."}
      </p>
      </>
    );
  }

  if (pagina.elementos.length === 0) {
    return (
      <>
        <InformarResultados total={0} />
        <p className="empty-state">No se encontraron movimientos de stock con los filtros aplicados.</p>
      </>
    );
  }

  const filtrosSinPagina = Object.fromEntries(Object.entries(filtros).filter(([nombre]) => nombre !== "pagina")) as Record<string, string>;

  return (
    <>
      <InformarResultados total={pagina.totalElementos} />
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Código</th>
              <th>Repuesto</th>
              <th>Tipo</th>
              <th>Cantidad</th>
              <th>Ubicación</th>
              <th>Usuario</th>
              <th>Motivo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pagina.elementos.map((movimiento) => (
              <tr key={movimiento.id}>
                <td>{formatearFechaCorta(movimiento.fecha)}</td>
                <td><strong>{movimiento.codigoRepuesto}</strong></td>
                <td>{movimiento.nombreRepuesto}</td>
                <td>{obtenerEtiquetaTipoMovimiento(movimiento.tipo)}</td>
                <td>{movimiento.cantidad}</td>
                <td>{movimiento.ubicacion}</td>
                <td>{movimiento.nombreUsuario ?? "Sin registrar"}</td>
                <td>{movimiento.motivo}</td>
                <td>
                  <Link aria-label="Ver detalle" className="boton-icono" href={"/repuestos/movimientos/" + movimiento.id} title="Ver detalle">
                    <IconoOjo />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginacionListado
        filtros={filtrosSinPagina}
        pagina={pagina.pagina}
        plural="movimientos"
        ruta={RUTA_MOVIMIENTOS}
        totalElementos={pagina.totalElementos}
        totalPaginas={pagina.totalPaginas}
      />
    </>
  );
}
