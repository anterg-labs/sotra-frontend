import "server-only";
import { parametrosDeOrden } from "@/componentes/listado/url-listado";
import { leerJsonServidor, opcionesJsonServidor } from "@/servicios/servidor/cliente-http-servidor";
import type {
  AjusteStockInput,
  EgresoStockInput,
  FiltrosMovimientosStock,
  IngresoStockInput,
  MovimientoStock,
} from "@/tipos/movimiento-stock";
import type { Pagina } from "@/tipos/pagina";

export function listarMovimientosStockServidor(filtros: FiltrosMovimientosStock) {
  const parametros = new URLSearchParams();
  if (filtros.buscar.trim() !== "") parametros.append("buscar", filtros.buscar.trim());
  if (filtros.repuestoId !== "") parametros.append("repuestoId", filtros.repuestoId);
  if (filtros.tipo !== "") parametros.append("tipo", filtros.tipo);
  if (filtros.fechaDesde !== "") parametros.append("fechaDesde", filtros.fechaDesde);
  if (filtros.fechaHasta !== "") parametros.append("fechaHasta", filtros.fechaHasta);
  if (filtros.ubicacion.trim() !== "") parametros.append("ubicacion", filtros.ubicacion.trim());
  if (filtros.usuarioId !== "") parametros.append("usuarioId", filtros.usuarioId);
  for (const [nombre, valor] of parametrosDeOrden(filtros)) parametros.append(nombre, valor);
  parametros.append("pagina", String(filtros.pagina));
  return leerJsonServidor<Pagina<MovimientoStock>>(
    "/api/v1/movimientos-stock?" + parametros.toString(),
    "No se pudo obtener el listado de movimientos de stock.",
  );
}

export function obtenerMovimientoStockServidor(movimientoId: number) {
  return leerJsonServidor<MovimientoStock>(
    "/api/v1/movimientos-stock/" + movimientoId,
    "No se pudo obtener el movimiento solicitado.",
  );
}

export function registrarIngresoStockServidor(repuestoId: number, ingreso: IngresoStockInput) {
  return leerJsonServidor<MovimientoStock>(
    "/api/v1/repuestos/" + repuestoId + "/ingresos",
    "No se pudo registrar el ingreso de stock.",
    opcionesJsonServidor("POST", ingreso),
  );
}

export function registrarEgresoStockServidor(repuestoId: number, egreso: EgresoStockInput) {
  return leerJsonServidor<MovimientoStock>(
    "/api/v1/repuestos/" + repuestoId + "/egresos",
    "No se pudo registrar el egreso de stock.",
    opcionesJsonServidor("POST", egreso),
  );
}

export function registrarAjusteStockServidor(repuestoId: number, ajuste: AjusteStockInput) {
  return leerJsonServidor<MovimientoStock>(
    "/api/v1/repuestos/" + repuestoId + "/ajustes",
    "No se pudo registrar el ajuste de stock.",
    opcionesJsonServidor("POST", ajuste),
  );
}
