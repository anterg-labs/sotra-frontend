import "server-only";
import { construirConsultaAnalisis, construirConsultaIndicadores } from "@/servicios/api/consultas-reportes";
import { leerJsonServidor } from "@/servicios/servidor/cliente-http-servidor";
import type {
  AgrupacionTendencias,
  AlertasMaquinaria,
  FiltrosIndicadores,
  Indicadores,
  Reincidencias,
  RepuestosUsados,
  Tendencias,
  Tiempos,
  Avisos,
  Comparativa,
  ReglaAviso,
} from "@/tipos/reporte";

export function obtenerIndicadoresServidor(filtros: FiltrosIndicadores) {
  return leerJsonServidor<Indicadores>(
    "/api/v1/reportes/indicadores" + construirConsultaIndicadores(filtros),
    "No se pudieron obtener los indicadores.",
  );
}

export function obtenerTendenciasServidor(filtros: FiltrosIndicadores, agrupacion: AgrupacionTendencias) {
  return leerJsonServidor<Tendencias>(
    "/api/v1/reportes/tendencias" + construirConsultaAnalisis(filtros, { agrupacion }),
    "No se pudieron obtener las tendencias.",
  );
}

export function obtenerTiemposServidor(filtros: FiltrosIndicadores) {
  return leerJsonServidor<Tiempos>("/api/v1/reportes/tiempos" + construirConsultaAnalisis(filtros), "No se pudieron obtener los tiempos.");
}

export function obtenerReincidenciasServidor(filtros: FiltrosIndicadores) {
  return leerJsonServidor<Reincidencias>(
    "/api/v1/reportes/reincidencias" + construirConsultaAnalisis(filtros),
    "No se pudieron obtener las reincidencias.",
  );
}

export function obtenerAlertasMaquinariaServidor(filtros: FiltrosIndicadores) {
  return leerJsonServidor<AlertasMaquinaria>(
    "/api/v1/reportes/alertas-maquinaria" + construirConsultaAnalisis(filtros),
    "No se pudieron obtener las alertas de maquinaria.",
  );
}

export function obtenerRepuestosUsadosServidor(filtros: FiltrosIndicadores) {
  return leerJsonServidor<RepuestosUsados>(
    "/api/v1/reportes/repuestos-usados" + construirConsultaAnalisis(filtros),
    "No se pudieron obtener los repuestos más usados.",
  );
}

export function obtenerComparativaServidor(filtros: FiltrosIndicadores) {
  return leerJsonServidor<Comparativa>(
    "/api/v1/reportes/analisis/comparativa" + construirConsultaAnalisis(filtros),
    "No se pudo obtener la comparativa.",
  );
}

export function obtenerAvisosServidor() {
  return leerJsonServidor<Avisos>("/api/v1/reportes/avisos", "No se pudieron obtener los avisos.");
}

export function listarReglasAvisoServidor() {
  return leerJsonServidor<ReglaAviso[]>("/api/v1/reportes/avisos/reglas", "No se pudieron obtener las reglas de aviso.");
}
