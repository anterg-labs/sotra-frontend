import Link from "next/link";
import { IconoOjo } from "@/componentes/iconos";
import type { ParametrosBusqueda } from "@/componentes/listado/url-listado";
import { primerValor } from "@/componentes/listado/url-listado";
import { listarMovimientosStockServidor } from "@/servicios/servidor/movimientos-stock";
import { obtenerRepuestoServidor } from "@/servicios/servidor/repuestos";
import type { MovimientoStock } from "@/tipos/movimiento-stock";
import type { Repuesto } from "@/tipos/repuesto";
import { obtenerEtiquetaTipoMovimiento } from "@/validaciones/movimiento-stock";
import { PanelStock } from "./panel-stock";
import { formatearFechaCorta } from "@/utilidades/fechas";

async function cargarRepuesto(repuestoId: number): Promise<Repuesto | null> {
  if (!Number.isInteger(repuestoId) || repuestoId <= 0) return null;
  try {
    return await obtenerRepuestoServidor(repuestoId);
  } catch {
    return null;
  }
}

async function cargarMovimientos(repuestoId: number): Promise<MovimientoStock[] | null> {
  if (!Number.isInteger(repuestoId) || repuestoId <= 0) return null;
  try {
    const pagina = await listarMovimientosStockServidor({
      buscar: "", repuestoId: String(repuestoId), tipo: "", fechaDesde: "", fechaHasta: "", ubicacion: "", usuarioId: "", pagina: 1,
    });
    return pagina.elementos;
  } catch {
    return null;
  }
}

export default async function PaginaDetalleRepuesto(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<ParametrosBusqueda>;
}) {
  const [{ id }, parametros] = await Promise.all([props.params, props.searchParams]);
  const repuestoId = Number(id);
  const [repuesto, movimientos] = await Promise.all([cargarRepuesto(repuestoId), cargarMovimientos(repuestoId)]);

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Repuestos</p>
          <h1>{repuesto ? repuesto.codigo + " - " + repuesto.nombre : "Detalle del repuesto"}</h1>
        </div>
        <Link className="secondary-button" href="/repuestos">
          Volver al listado
        </Link>
      </header>

      {repuesto ? (
        <div className="grid gap-6">
          <PanelStock abrirIngreso={primerValor(parametros.ingresar) === "1"} repuesto={repuesto} />

          <section className="panel">
            <div className="panel-heading">
              <h2>Movimientos de stock</h2>
            </div>
            {movimientos === null ? (
              <p className="form-error-banner">No se pudieron obtener los movimientos de stock de este repuesto.</p>
            ) : movimientos.length === 0 ? (
              <p className="empty-state">Este repuesto todavía no tiene movimientos de stock.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Cantidad</th>
                      <th>Stock</th>
                      <th>Ubicación</th>
                      <th>Motivo</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientos.map((movimiento) => (
                      <tr key={movimiento.id}>
                        <td>{formatearFechaCorta(movimiento.fecha)}</td>
                        <td>{obtenerEtiquetaTipoMovimiento(movimiento.tipo)}</td>
                        <td>{movimiento.cantidad}</td>
                        <td>{movimiento.stockAnterior + " → " + movimiento.stockPosterior}</td>
                        <td>{movimiento.ubicacion}</td>
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
            )}
          </section>
        </div>
      ) : (
        <p className="form-error-banner">No se pudo obtener la información del repuesto solicitado.</p>
      )}
    </main>
  );
}
