import Link from "next/link";
import { obtenerMovimientoStockServidor } from "@/servicios/servidor/movimientos-stock";
import type { MovimientoStock } from "@/tipos/movimiento-stock";
import { obtenerEtiquetaTipoMovimiento } from "@/validaciones/movimiento-stock";
import { formatearFechaHora } from "@/utilidades/fechas";
import { EnlaceVolver } from "@/componentes/enlace-volver";

async function cargarMovimiento(movimientoId: number): Promise<MovimientoStock | null> {
  if (!Number.isInteger(movimientoId) || movimientoId <= 0) return null;
  try {
    return await obtenerMovimientoStockServidor(movimientoId);
  } catch {
    return null;
  }
}

export default async function PaginaDetalleMovimientoStock(props: { params: Promise<{ id: string }> }) {
  const movimientoId = Number((await props.params).id);
  const movimiento = await cargarMovimiento(movimientoId);

  return (
    <main className="page-content">
      <header className="page-heading">
        <div className="encabezado-volver">
          <EnlaceVolver etiqueta="Volver a movimientos" href="/repuestos/movimientos" />
          <div>
            <p className="eyebrow">Movimientos de stock</p>
            <h1>{"Movimiento N° " + (Number.isNaN(movimientoId) ? "" : movimientoId)}</h1>
          </div>
        </div>
      </header>

      {movimiento ? (
        <section className="panel detail-panel">
          <dl className="detail-list">
            <div>
              <dt>Repuesto</dt>
              <dd>
                <Link className="text-link" href={"/repuestos/" + movimiento.repuestoId}>
                  {movimiento.codigoRepuesto + " - " + movimiento.nombreRepuesto}
                </Link>
              </dd>
            </div>
            <div>
              <dt>Tipo de movimiento</dt>
              <dd>{obtenerEtiquetaTipoMovimiento(movimiento.tipo)}</dd>
            </div>
            <div>
              <dt>Cantidad</dt>
              <dd>{movimiento.cantidad}</dd>
            </div>
            <div>
              <dt>Variación del stock</dt>
              <dd>
                {movimiento.stockAnterior !== null && movimiento.stockPosterior !== null
                  ? "De " + movimiento.stockAnterior + " a " + movimiento.stockPosterior + " unidades"
                  : "Sin datos"}
              </dd>
            </div>
            <div>
              <dt>Fecha del movimiento</dt>
              <dd>{formatearFechaHora(movimiento.fecha)}</dd>
            </div>
            <div>
              <dt>Ubicación o depósito</dt>
              <dd>{movimiento.ubicacion}</dd>
            </div>
            <div>
              <dt>Usuario responsable</dt>
              <dd>{movimiento.nombreUsuario ?? "Sin registrar (todavía no hay login)"}</dd>
            </div>
            <div>
              <dt>Motivo</dt>
              <dd>{movimiento.motivo}</dd>
            </div>
            <div>
              <dt>Observaciones</dt>
              <dd>{movimiento.observaciones !== "" ? movimiento.observaciones : "Sin observaciones"}</dd>
            </div>
          </dl>
        </section>
      ) : (
        <p className="form-error-banner">No se pudo obtener la información del movimiento solicitado.</p>
      )}
    </main>
  );
}
