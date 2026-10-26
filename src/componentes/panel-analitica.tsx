"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GraficoBarras, GraficoTendencia } from "@/componentes/graficos";
import {
  formatearDuracion,
  obtenerAlertasMaquinaria,
  obtenerEtiquetaAlerta,
  obtenerReincidencias,
  obtenerRepuestosUsados,
  obtenerTendencias,
  obtenerTiempos,
} from "@/servicios/servicio-reportes";
import type {
  AgrupacionTendencias,
  AlertasMaquinaria,
  FiltrosIndicadores,
  Reincidencia,
  Reincidencias,
  RepuestosUsados,
  Tendencias,
  Tiempos,
} from "@/tipos/reporte";
import { formatearFechaCorta } from "@/utilidades/fechas";
import { ContenedorTabla } from "@/componentes/contenedor-tabla";
import { useEtiquetaEstadoOrden } from "@/componentes/estados-orden";
import { EncabezadoOrdenLocal, useOrdenLocal } from "@/componentes/listado/orden-local";

type PropiedadesPanelAnalitica = {
  filtros: FiltrosIndicadores;
};

type Resultado<T> = { datos: T | null; error: string };

type ColumnaReincidencias = "activo" | "cliente" | "correctivas" | "reincidencias" | "dias" | "ultima";

const VALORES_REINCIDENCIAS = {
  activo: (fila: Reincidencia) => fila.nombreActivo,
  cliente: (fila: Reincidencia) => fila.cliente,
  correctivas: (fila: Reincidencia) => fila.correctivas,
  reincidencias: (fila: Reincidencia) => fila.reincidencias,
  dias: (fila: Reincidencia) => fila.diasPromedioEntreIntervenciones,
  ultima: (fila: Reincidencia) => Date.parse(fila.ultimaIntervencion),
} satisfies Record<ColumnaReincidencias, (fila: Reincidencia) => string | number | null>;

/** Máquinas con correctivas repetidas; se ordena en el navegador al hacer clic en el título de una columna. */
function TablaReincidencias({ elementos }: { elementos: Reincidencia[] }) {
  const { filasOrdenadas, orden, alternar } = useOrdenLocal(elementos, VALORES_REINCIDENCIAS);
  const encabezado = (columna: ColumnaReincidencias, etiqueta: string) => (
    <EncabezadoOrdenLocal alternar={alternar} columna={columna} etiqueta={etiqueta} orden={orden} />
  );

  return (
    <ContenedorTabla etiqueta="Máquinas con correctivas repetidas">
      <table>
        <thead>
          <tr>
            {encabezado("activo", "Activo")}
            {encabezado("cliente", "Cliente")}
            {encabezado("correctivas", "Correctivas")}
            {encabezado("reincidencias", "Reincidencias")}
            {encabezado("dias", "Días entre intervenciones")}
            {encabezado("ultima", "Última")}
          </tr>
        </thead>
        <tbody>
          {filasOrdenadas.map((fila) => (
            <tr key={fila.activoId}>
              <td><Link className="text-link" href={"/activos/" + fila.activoId}>{fila.nombreActivo}</Link></td>
              <td>{fila.cliente}</td>
              <td className="celda-numerica">{fila.correctivas}</td>
              <td className="celda-numerica"><strong>{fila.reincidencias}</strong></td>
              <td className="celda-numerica">{fila.diasPromedioEntreIntervenciones ?? "—"}</td>
              <td>{formatearFechaCorta(fila.ultimaIntervencion)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ContenedorTabla>
  );
}

function mensajeDeError(razon: unknown, porDefecto: string) {
  return razon instanceof Error ? razon.message : porDefecto;
}

function describirVariacion(actual: number, anterior: number | null) {
  if (anterior === null) return "Elegí un rango de fechas para comparar con el período anterior.";
  if (anterior === 0) return actual === 0 ? "Igual que el período anterior (0)." : "Sin órdenes en el período anterior.";
  const porcentaje = Math.round(((actual - anterior) / anterior) * 100);
  const signo = porcentaje > 0 ? "▲ +" : porcentaje < 0 ? "▼ " : "= ";
  return signo + porcentaje + " % contra el período anterior (" + anterior + ")";
}

/** Análisis del mantenimiento: tendencias, tiempos, reincidencias y alertas de maquinaria, con los filtros del tablero. */
export function PanelAnalitica({ filtros }: PropiedadesPanelAnalitica) {
  const etiquetaEstado = useEtiquetaEstadoOrden();
  const [agrupacion, setAgrupacion] = useState<AgrupacionTendencias>("semana");
  const [tendencias, setTendencias] = useState<Resultado<Tendencias> | null>(null);
  const [tiempos, setTiempos] = useState<Resultado<Tiempos> | null>(null);
  const [reincidencias, setReincidencias] = useState<Resultado<Reincidencias> | null>(null);
  const [alertas, setAlertas] = useState<Resultado<AlertasMaquinaria> | null>(null);
  const [repuestosUsados, setRepuestosUsados] = useState<Resultado<RepuestosUsados> | null>(null);
  const claveDeFiltros = JSON.stringify(filtros);

  useEffect(() => {
    let estaVigente = true;

    async function cargar() {
      setTendencias(null);
      setTiempos(null);
      setReincidencias(null);
      setAlertas(null);
      setRepuestosUsados(null);
      const [resultadoTendencias, resultadoTiempos, resultadoReincidencias, resultadoAlertas, resultadoRepuestos] = await Promise.allSettled([
        obtenerTendencias(filtros, agrupacion),
        obtenerTiempos(filtros),
        obtenerReincidencias(filtros),
        obtenerAlertasMaquinaria(filtros),
        obtenerRepuestosUsados(filtros),
      ]);
      if (!estaVigente) return;

      const convertir = <T,>(resultado: PromiseSettledResult<T>, porDefecto: string): Resultado<T> =>
        resultado.status === "fulfilled"
          ? { datos: resultado.value, error: "" }
          : { datos: null, error: mensajeDeError(resultado.reason, porDefecto) };
      setTendencias(convertir(resultadoTendencias, "No se pudieron obtener las tendencias."));
      setTiempos(convertir(resultadoTiempos, "No se pudieron obtener los tiempos."));
      setReincidencias(convertir(resultadoReincidencias, "No se pudieron obtener las reincidencias."));
      setAlertas(convertir(resultadoAlertas, "No se pudieron obtener las alertas de maquinaria."));
      setRepuestosUsados(convertir(resultadoRepuestos, "No se pudieron obtener los repuestos más usados."));
    }

    cargar();
    return () => {
      estaVigente = false;
    };
    // `filtros` se resume en `claveDeFiltros` para no recargar mientras la persona todavía escribe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveDeFiltros, agrupacion]);

  function dibujarBloque<T>(resultado: Resultado<T> | null, cargando: string, dibujar: (datos: T) => React.ReactNode) {
    if (resultado === null) return <p className="empty-state">{cargando}</p>;
    if (resultado.error) return <p className="form-error-banner" role="alert">{resultado.error}</p>;
    return dibujar(resultado.datos as T);
  }

  return (
    <div className="grid gap-6">
      <section aria-labelledby="titulo-alertas-maquinaria" className="panel">
        <div className="panel-heading">
          <h2 id="titulo-alertas-maquinaria">Alertas de maquinaria</h2>
        </div>
        {dibujarBloque(alertas, "Calculando alertas…", (datos) =>
          datos.alertas.length === 0 ? (
            <p className="empty-state">No hay máquinas ni órdenes que superen los plazos. Todo al día.</p>
          ) : (
            <div role="status">
              <p className="px-6 pt-4 text-sm">
                <strong>{datos.total}</strong> {datos.total === 1 ? "alerta" : "alertas"}
                {datos.criticas > 0 ? ", " + datos.criticas + (datos.criticas === 1 ? " crítica" : " críticas") : ""}.
              </p>
              {datos.alertas.map((alerta) => (
                <div className="alerta-maquinaria" key={alerta.tipo + alerta.ordenId}>
                  <p>
                    <strong>{obtenerEtiquetaAlerta(alerta.tipo)}</strong>
                    <br />
                    <small>
                      {alerta.nombreActivo + " · " + alerta.cliente + " · prioridad " + alerta.prioridad + " · " +
                        formatearDuracion(alerta.horasTranscurridas) + " (límite " + formatearDuracion(alerta.umbralHoras) + ")"}
                    </small>
                  </p>
                  <span className="flex flex-wrap items-center gap-2">
                    <span className={"status " + (alerta.gravedad === "critica" ? "prioridad-alta" : "prioridad-media")}>
                      {alerta.gravedad === "critica" ? "Crítica" : "Alta"}
                    </span>
                    <Link className="secondary-button" href={"/ordenes-trabajo/" + alerta.ordenId}>
                      {"Ver orden #" + alerta.ordenId}
                    </Link>
                  </span>
                </div>
              ))}
            </div>
          ),
        )}
      </section>

      <section aria-labelledby="titulo-tendencias" className="panel">
        <div className="panel-heading">
          <h2 id="titulo-tendencias">¿Cómo evoluciona el mantenimiento?</h2>
          <div className="pestanas" role="group" aria-label="Agrupar por" style={{ margin: 0, borderBottom: 0 }}>
            {(["semana", "mes"] as const).map((opcion) => (
              <button
                aria-pressed={agrupacion === opcion}
                className="chip-filtro"
                key={opcion}
                onClick={() => setAgrupacion(opcion)}
                type="button"
              >
                {opcion === "semana" ? "Por semana" : "Por mes"}
              </button>
            ))}
          </div>
        </div>
        {dibujarBloque(tendencias, "Cargando tendencias…", (datos) => (
          <>
            <div className="tarjetas-resumen px-6 pt-4">
              <div className="tarjeta-resumen">
                <span className="tarjeta-resumen-titulo">Órdenes en el período</span>
                <span className="tarjeta-resumen-valor">{datos.totalPeriodo}</span>
                <span className="tarjeta-resumen-variacion">{describirVariacion(datos.totalPeriodo, datos.totalPeriodoAnterior)}</span>
              </div>
            </div>
            <GraficoTendencia
              puntos={datos.puntos}
              titulo={"Órdenes creadas por " + (datos.agrupacion === "mes" ? "mes" : "semana") + ", preventivas y correctivas"}
            />
          </>
        ))}
      </section>

      <section aria-labelledby="titulo-tiempos" className="panel">
        <div className="panel-heading">
          <h2 id="titulo-tiempos">¿Cuánto demoran las órdenes y dónde se pierde el tiempo?</h2>
        </div>
        {dibujarBloque(tiempos, "Cargando tiempos…", (datos) => (
          <>
            <div className="tarjetas-resumen px-6 pt-4">
              <div className="tarjeta-resumen">
                <span className="tarjeta-resumen-titulo">Duración promedio</span>
                <span className="tarjeta-resumen-valor">{formatearDuracion(datos.duracion.promedioHoras)}</span>
                <span className="tarjeta-resumen-variacion">{"Sobre " + datos.duracion.cantidad + " órdenes cerradas"}</span>
              </div>
              <div className="tarjeta-resumen">
                <span className="tarjeta-resumen-titulo">Mediana</span>
                <span className="tarjeta-resumen-valor">{formatearDuracion(datos.duracion.medianaHoras)}</span>
                <span className="tarjeta-resumen-variacion">La mitad se cierra antes</span>
              </div>
              <div className="tarjeta-resumen">
                <span className="tarjeta-resumen-titulo">Percentil 90</span>
                <span className="tarjeta-resumen-valor">{formatearDuracion(datos.duracion.percentil90Horas)}</span>
                <span className="tarjeta-resumen-variacion">El 90 % se cierra antes</span>
              </div>
              <div className="tarjeta-resumen">
                <span className="tarjeta-resumen-titulo">Cumplen la fecha prevista</span>
                <span className="tarjeta-resumen-valor">
                  {datos.cumplimiento.porcentajeEnPlazo === null ? "Sin datos" : datos.cumplimiento.porcentajeEnPlazo + " %"}
                </span>
                <span className="tarjeta-resumen-variacion">
                  {datos.cumplimiento.evaluadas === 0
                    ? "Todavía no hay órdenes cerradas con fecha prevista"
                    : datos.cumplimiento.enPlazo + " de " + datos.cumplimiento.evaluadas + " en plazo" +
                      (datos.cumplimiento.atrasoPromedioDias === null ? "" : " · atraso promedio " + datos.cumplimiento.atrasoPromedioDias + " d")}
                </span>
              </div>
            </div>
            <GraficoBarras
              datos={datos.etapas.map((etapa) => ({
                etiqueta: etiquetaEstado(etapa.estado),
                valor: etapa.promedioHoras,
                valorTexto: formatearDuracion(etapa.promedioHoras),
                detalle: "Promedio de " + etapa.cantidad + (etapa.cantidad === 1 ? " tramo" : " tramos"),
              }))}
              vacio="Todavía no hay tramos terminados para calcular tiempos por etapa."
            />
          </>
        ))}
      </section>

      <section aria-labelledby="titulo-repuestos-usados" className="panel">
        <div className="panel-heading">
          <h2 id="titulo-repuestos-usados">¿Qué repuestos se usan más?</h2>
        </div>
        {dibujarBloque(repuestosUsados, "Cargando repuestos…", (datos) => (
          <GraficoBarras
            datos={datos.elementos.map((repuesto) => ({
              etiqueta: repuesto.codigo + " · " + repuesto.nombre,
              valor: repuesto.ordenes,
              valorTexto: repuesto.ordenes + (repuesto.ordenes === 1 ? " orden" : " órdenes"),
            }))}
            vacio="Todavía no hay repuestos asociados a órdenes en este período."
          />
        ))}
      </section>

      <section aria-labelledby="titulo-reincidencias" className="panel">
        <div className="panel-heading">
          <h2 id="titulo-reincidencias">¿Qué máquinas vuelven una y otra vez a mantenimiento?</h2>
        </div>
        {dibujarBloque(reincidencias, "Cargando reincidencias…", (datos) =>
          datos.elementos.length === 0 ? (
            <p className="empty-state">{"Ningún activo tiene correctivas repetidas en " + datos.dias + " días."}</p>
          ) : (
            <TablaReincidencias elementos={datos.elementos} />
          ),
        )}
      </section>
    </div>
  );
}
