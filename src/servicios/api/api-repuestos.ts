import { leerDatosApi, leerPagina } from "@/servicios/api/solicitudes-http";
import type { Pagina } from "@/tipos/pagina";
import type { AlertasStock, FiltrosRepuestos, Repuesto } from "@/tipos/repuesto";

export async function apiListarRepuestosPaginados(filtros: FiltrosRepuestos) {
  const parametros = new URLSearchParams();
  if (filtros.buscar.trim() !== "") {
    parametros.append("buscar", filtros.buscar.trim());
  }
  if (filtros.estado !== "") {
    parametros.append("estado", filtros.estado);
  }
  if (filtros.ubicacion.trim() !== "") {
    parametros.append("ubicacion", filtros.ubicacion.trim());
  }
  if (filtros.bajoStock) {
    parametros.append("bajoStock", "true");
  }
  if (filtros.estadoStock) {
    parametros.append("estadoStock", filtros.estadoStock);
  }
  if (filtros.orden) {
    parametros.append("orden", filtros.orden);
  }
  parametros.append("pagina", String(filtros.pagina));

  const pagina = await leerPagina("/api/v1/repuestos", parametros, "No se pudo obtener el listado de repuestos.");
  return pagina as Pagina<Repuesto>;
}

export async function apiObtenerRepuesto(repuestoId: number) {
  const repuesto = await leerDatosApi("/api/v1/repuestos/" + repuestoId, { cache: "no-store" }, "No se pudo obtener el repuesto solicitado.");
  return repuesto as Repuesto;
}

export async function apiObtenerAlertasStock() {
  const alertas = await leerDatosApi("/api/v1/repuestos/alertas-stock", { cache: "no-store" }, "No se pudieron obtener las alertas de stock.");
  return alertas as AlertasStock;
}
