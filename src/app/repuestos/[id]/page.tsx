import Link from "next/link";
import type { ParametrosBusqueda } from "@/componentes/listado/url-listado";
import { primerValor } from "@/componentes/listado/url-listado";
import { listarMovimientosStockServidor } from "@/servicios/servidor/movimientos-stock";
import { obtenerRepuestoServidor } from "@/servicios/servidor/repuestos";
import type { MovimientoStock } from "@/tipos/movimiento-stock";
import type { Pagina } from "@/tipos/pagina";
import type { Repuesto } from "@/tipos/repuesto";
import { PanelStock } from "./panel-stock";
import { TablaMovimientosRepuesto } from "@/componentes/tablas-ordenables";
import { EnlaceVolver } from "@/componentes/enlace-volver";

async function cargarRepuesto(repuestoId: number): Promise<Repuesto | null> {
  if (!Number.isInteger(repuestoId) || repuestoId <= 0) return null;
  try {
    return await obtenerRepuestoServidor(repuestoId);
  } catch {
    return null;
  }
}

async function cargarMovimientos(repuestoId: number): Promise<Pagina<MovimientoStock> | null> {
  if (!Number.isInteger(repuestoId) || repuestoId <= 0) return null;
  try {
    const pagina = await listarMovimientosStockServidor({
      buscar: "", repuestoId: String(repuestoId), tipo: "", fechaDesde: "", fechaHasta: "", ubicacion: "", usuarioId: "", pagina: 1,
    });
    return pagina;
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
        <div className="encabezado-volver">
          <EnlaceVolver etiqueta="Volver al listado" href="/repuestos" />
          <div>
            <p className="eyebrow">Repuestos</p>
            <h1>{repuesto ? repuesto.codigo + " - " + repuesto.nombre : "Detalle del repuesto"}</h1>
          </div>
        </div>
      </header>

      {repuesto ? (
        <div className="grid gap-6">
          <PanelStock abrirIngreso={primerValor(parametros.ingresar) === "1"} repuesto={repuesto} />

          <section className="panel">
            <div className="panel-heading">
              <h2>Historial de movimientos</h2>
              {movimientos !== null && movimientos.totalElementos > movimientos.elementos.length ? (
                <Link className="text-link" href={"/repuestos/movimientos?repuestoId=" + repuesto.id}>
                  {"Ver los " + movimientos.totalElementos + " movimientos"}
                </Link>
              ) : null}
            </div>
            {movimientos === null ? (
              <p className="form-error-banner">No se pudieron obtener los movimientos de stock de este repuesto.</p>
            ) : movimientos.elementos.length === 0 ? (
              <p className="empty-state">Este repuesto todavía no tiene movimientos de stock.</p>
            ) : (
              <TablaMovimientosRepuesto movimientos={movimientos.elementos} />
            )}
          </section>
        </div>
      ) : (
        <p className="form-error-banner">No se pudo obtener la información del repuesto solicitado.</p>
      )}
    </main>
  );
}
