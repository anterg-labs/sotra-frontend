import { leerDatosApi, obtenerUrlBaseApi } from "@/servicios/api/solicitudes-http";
import type { FiltrosIndicadores, Indicadores } from "@/tipos/reporte";

export async function apiObtenerIndicadores(filtros: FiltrosIndicadores) {
  const parametros = new URLSearchParams();
  if (filtros.fechaDesde !== "") {
    parametros.append("fechaDesde", filtros.fechaDesde);
  }
  if (filtros.fechaHasta !== "") {
    parametros.append("fechaHasta", filtros.fechaHasta);
  }
  if (filtros.tecnicoId !== "") {
    parametros.append("tecnicoId", filtros.tecnicoId);
  }
  if (filtros.clienteId !== "") {
    parametros.append("clienteId", filtros.clienteId);
  }
  if (filtros.activoId !== "") {
    parametros.append("activoId", filtros.activoId);
  }
  if (filtros.estado !== "") {
    parametros.append("estado", filtros.estado);
  }
  if (filtros.tipo !== "") {
    parametros.append("tipo", filtros.tipo);
  }

  let ruta = "/api/v1/reportes/indicadores";
  const textoParametros = parametros.toString();
  if (textoParametros !== "") {
    ruta = ruta + "?" + textoParametros;
  }

  const indicadores = await leerDatosApi(ruta, { cache: "no-store" }, "No se pudieron obtener los indicadores.");
  return indicadores as Indicadores;
}

export function apiObtenerUrlReportePdf(tipoReporte: string, filtros: FiltrosIndicadores, prioridad: string) {
  const parametros = new URLSearchParams();
  if (filtros.fechaDesde !== "") {
    parametros.append("fechaDesde", filtros.fechaDesde);
  }
  if (filtros.fechaHasta !== "") {
    parametros.append("fechaHasta", filtros.fechaHasta);
  }
  if (filtros.tecnicoId !== "") {
    parametros.append("tecnicoId", filtros.tecnicoId);
  }
  if (filtros.clienteId !== "") {
    parametros.append("clienteId", filtros.clienteId);
  }
  if (filtros.activoId !== "") {
    parametros.append("activoId", filtros.activoId);
  }
  if (filtros.estado !== "") {
    parametros.append("estado", filtros.estado);
  }
  if (filtros.tipo !== "") {
    parametros.append("tipo", filtros.tipo);
  }
  if (prioridad !== "") {
    parametros.append("prioridad", prioridad);
  }

  let url = obtenerUrlBaseApi() + "/api/v1/reportes/" + tipoReporte + "/pdf";
  const textoParametros = parametros.toString();
  if (textoParametros !== "") {
    url = url + "?" + textoParametros;
  }
  return url;
}
