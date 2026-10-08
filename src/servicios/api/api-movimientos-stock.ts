import { crearOpcionesJson, leerDatosApi, leerPagina } from "@/servicios/api/solicitudes-http";
import type { FiltrosMovimientosStock, IngresoStockInput, MovimientoStock } from "@/tipos/movimiento-stock";
import type { Pagina } from "@/tipos/pagina";

export async function apiListarMovimientosStock(filtros: FiltrosMovimientosStock) {
  const parametros = new URLSearchParams();
  if (filtros.buscar.trim() !== "") {
    parametros.append("buscar", filtros.buscar.trim());
  }
  if (filtros.repuestoId !== "") {
    parametros.append("repuestoId", filtros.repuestoId);
  }
  if (filtros.tipo !== "") {
    parametros.append("tipo", filtros.tipo);
  }
  if (filtros.fechaDesde !== "") {
    parametros.append("fechaDesde", filtros.fechaDesde);
  }
  if (filtros.fechaHasta !== "") {
    parametros.append("fechaHasta", filtros.fechaHasta);
  }
  if (filtros.ubicacion.trim() !== "") {
    parametros.append("ubicacion", filtros.ubicacion.trim());
  }
  if (filtros.usuarioId !== "") {
    parametros.append("usuarioId", filtros.usuarioId);
  }
  parametros.append("pagina", String(filtros.pagina));

  const pagina = await leerPagina("/api/v1/movimientos-stock", parametros, "No se pudo obtener el listado de movimientos de stock.");
  return pagina as Pagina<MovimientoStock>;
}

export async function apiObtenerMovimientoStock(movimientoId: number) {
  const ruta = "/api/v1/movimientos-stock/" + movimientoId;
  const movimiento = await leerDatosApi(ruta, { cache: "no-store" }, "No se pudo obtener el movimiento solicitado.");
  return movimiento as MovimientoStock;
}

export async function apiRegistrarIngresoStock(repuestoId: number, ingreso: IngresoStockInput) {
  const opciones = crearOpcionesJson("POST", ingreso);
  const ruta = "/api/v1/repuestos/" + repuestoId + "/ingresos";
  const movimiento = await leerDatosApi(ruta, opciones, "No se pudo registrar el ingreso de stock.");
  return movimiento as MovimientoStock;
}
