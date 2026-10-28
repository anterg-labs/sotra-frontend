"use client";

import { BloqueDeDatos, useDatos } from "@/componentes/use-datos";
import { formatearNumero } from "@/componentes/formato-numero";
import { ContenedorGrafico, MiniColumnas, Sparkline } from "@/componentes/graficos-avanzados";
import { apiObtenerComparativa, apiObtenerDesgaste } from "@/servicios/api/api-reportes";
import type { Comparativa, Desgaste, FiltrosIndicadores, MetricaComparada } from "@/tipos/reporte";
import { tonoDeLaVariacion } from "./tono-variacion";
import { DesgasteEdadUso } from "./desgaste-edad-uso";

const SUFIJO: Record<MetricaComparada["unidad"], string> = { ordenes: "", porcentaje: " %", horas: " h" };

function valorConUnidad(valor: number | null, unidad: MetricaComparada["unidad"]) {
  return valor === null ? "—" : formatearNumero(valor) + SUFIJO[unidad];
}

function TablaComparativa({ comparativa }: { comparativa: Comparativa }) {
  return (
    <ContenedorGrafico
      ayuda="Compara cada indicador del período elegido con el período anterior de la misma duración y con el mismo período un año antes. La variación se calcula frente al período anterior; la línea muestra los últimos seis meses."
      descripcion={"Del " + comparativa.periodo.desde + " al " + comparativa.periodo.hasta + ", frente al " + comparativa.periodoAnterior.desde + " – " + comparativa.periodoAnterior.hasta + "."}
      grafico={
        <table className="tabla-grafico">
          <caption className="sr-only">Comparación de indicadores entre períodos</caption>
          <thead>
            <tr>
              <th>Indicador</th><th className="celda-numerica">Período</th><th className="celda-numerica">Anterior</th>
              <th className="celda-numerica">Año anterior</th><th className="celda-numerica">Variación</th><th>Seis meses</th>
            </tr>
          </thead>
          <tbody>
            {comparativa.metricas.map((metrica) => (
              <tr key={metrica.codigo}>
                <td>{metrica.nombre}<br /><small className="texto-tenue">{metrica.muestra} órdenes</small></td>
                <td className="celda-numerica"><strong>{valorConUnidad(metrica.actual, metrica.unidad)}</strong></td>
                <td className="celda-numerica">{valorConUnidad(metrica.anterior, metrica.unidad)}</td>
                <td className="celda-numerica">{valorConUnidad(metrica.anioAnterior, metrica.unidad)}</td>
                <td className={"celda-numerica " + tonoDeLaVariacion(metrica)}>
                  {metrica.variacionPorcentual === null ? "—" : (metrica.variacionPorcentual > 0 ? "+" : "") + formatearNumero(metrica.variacionPorcentual) + " %"}
                </td>
                <td><Sparkline tono={tonoDeLaVariacion(metrica)} titulo={"Seis meses: " + metrica.nombre} valores={metrica.serie.map((punto) => punto.valor)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      }
      tabla={<p className="texto-tenue">La comparación ya se muestra como tabla.</p>}
      titulo="Este período frente al anterior"
    />
  );
}

function PanelDeDesgaste({ desgaste }: { desgaste: Desgaste }) {
  if (desgaste.datosInsuficientes) {
    return (
      <ContenedorGrafico
        descripcion={"Datos insuficientes: hacen falta al menos " + (desgaste.minimoDeIntervalos + 1) + " correctivas de una misma máquina para analizar sus intervalos."}
        grafico={<p className="empty-state">Todavía no hay historia suficiente para este análisis.</p>}
        tabla={<p className="texto-tenue">Sin datos suficientes.</p>}
        titulo="Intervalo entre correctivas por máquina"
      />
    );
  }

  return (
    <ContenedorGrafico
        ayuda="Para cada máquina con suficientes correctivas, calcula los días entre correctivas consecutivas y su tendencia (pendiente de la recta que mejor ajusta). Si los intervalos se acortan de forma sostenida, la máquina falla cada vez más seguido, una señal clásica de desgaste. Una señal no es una causa: sirve para revisar la máquina, no para concluir por qué falla."
        descripcion="Si los intervalos entre correctivas se acortan, la máquina falla cada vez más seguido."
        grafico={
          <table className="tabla-grafico">
            <caption className="sr-only">Intervalos entre correctivas por máquina</caption>
            <thead><tr><th>Activo</th><th>Modelo</th><th>Intervalos (días)</th><th className="celda-numerica">Promedio</th><th>Tendencia</th><th className="celda-numerica">Uso entre fallas</th></tr></thead>
            <tbody>
              {desgaste.activos.map((activo) => (
                <tr key={activo.activoId}>
                  <td>{activo.nombreActivo}<br /><small className="texto-tenue">{activo.cliente}</small></td>
                  <td>{activo.modelo}</td>
                  <td><MiniColumnas tono={activo.seAcortan ? "grafico-tono-malo" : "grafico-tono-neutro"} titulo={"Intervalos entre correctivas: " + activo.intervalosDias.join(", ") + " días"} valores={activo.intervalosDias} /></td>
                  <td className="celda-numerica">{formatearNumero(activo.promedioDias)}</td>
                  <td className={activo.seAcortan ? "grafico-tono-malo" : ""}>{activo.seAcortan ? "Se acortan" : "Estable o crecen"}</td>
                  <td className="celda-numerica">{activo.usoPromedioEntreFallas === null ? "—" : formatearNumero(activo.usoPromedioEntreFallas) + " " + (activo.unidadUso === "horas" ? "h" : "km")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        }
        tabla={<p className="texto-tenue">Los intervalos ya se muestran en la tabla.</p>}
        titulo="Intervalo entre correctivas por máquina"
    />
  );
}

/** Sección «Análisis avanzado»: comparación de períodos e intervalos entre correctivas. Sin análisis de personas. */
export function SeccionAnalisisAvanzado({ filtros }: { filtros: FiltrosIndicadores }) {
  const clave = JSON.stringify(filtros);
  const comparativa = useDatos(() => apiObtenerComparativa(filtros), clave);
  const desgaste = useDatos(() => apiObtenerDesgaste(filtros), clave);
  return (
    <div className="grid gap-4">
      <BloqueDeDatos cargando="Cargando la comparación de períodos…" {...comparativa}>
        {(datos) => <TablaComparativa comparativa={datos} />}
      </BloqueDeDatos>
      <BloqueDeDatos cargando="Cargando el análisis de desgaste…" {...desgaste}>
        {(datos) => <PanelDeDesgaste desgaste={datos} />}
      </BloqueDeDatos>
      <DesgasteEdadUso filtros={filtros} />
    </div>
  );
}
