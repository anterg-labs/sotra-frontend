import { construirConsultaAnalisis } from "./consultas-reportes";
import { leerDatosApi } from "./solicitudes-http";
import type { FiltrosIndicadores } from "@/tipos/reporte";
import type { DesgasteEdadUso } from "@/tipos/desgaste-edad-uso";

export function leerDesgasteEdadUso(valor: unknown): DesgasteEdadUso {
  const valido = (numero: unknown) => typeof numero === "number" && Number.isFinite(numero) && numero >= 0;
  const entero = (numero: unknown) => valido(numero) && Number.isInteger(numero);
  const fecha = (texto: unknown) => texto === null || typeof texto === "string" && /^\d{4}-\d{2}-\d{2}/.test(texto);
  if (typeof valor !== "object" || valor === null) throw new Error("El análisis de edad y uso no tiene el formato esperado.");
  const datos = valor as Record<string, unknown>;
  if (!fecha(datos.fechaDesde) || !fecha(datos.fechaHasta) ||
      !entero(datos.totalActivos) || !entero(datos.conEdad) || !entero(datos.conUso) ||
      !Array.isArray(datos.activos) || datos.activos.length !== datos.totalActivos ||
      datos.activos.some((activo: unknown) => {
        if (typeof activo !== "object" || activo === null) return true;
        const fila = activo as Record<string, unknown>;
        return !entero(fila.activoId) || fila.activoId === 0 ||
          typeof fila.nombreActivo !== "string" || typeof fila.modelo !== "string" ||
          !(fila.edadAnios === null || entero(fila.edadAnios)) ||
          !(fila.lecturaUso === null || valido(fila.lecturaUso)) ||
          !["horas", "kilometros"].includes(String(fila.unidadUso)) ||
          !fecha(fila.fechaLectura) || !entero(fila.correctivas) || !entero(fila.ordenesObservadas);
      })) throw new Error("El análisis de edad y uso no tiene el formato esperado.");
  return valor as DesgasteEdadUso;
}

export async function apiObtenerDesgasteEdadUso(filtros: FiltrosIndicadores): Promise<DesgasteEdadUso> {
  const ruta = "/api/v1/reportes/analisis/desgaste-edad-uso" + construirConsultaAnalisis(filtros);
  return leerDesgasteEdadUso(await leerDatosApi(ruta, { cache: "no-store" },
    "No se pudo obtener el análisis de desgaste por edad y uso."));
}
