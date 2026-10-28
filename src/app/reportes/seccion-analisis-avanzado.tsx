"use client";

import Link from "next/link";
import { BloqueDeDatos, useDatos } from "@/componentes/use-datos";
import { formatearNumero } from "@/componentes/formato-numero";
import { ContenedorGrafico, MiniColumnas, Sparkline } from "@/componentes/graficos-avanzados";
import { apiObtenerAtipicas, apiObtenerComparativa, apiObtenerDesgaste } from "@/servicios/api/api-reportes";
import type { Comparativa, Desgaste, FiltrosIndicadores, MetricaComparada } from "@/tipos/reporte";
import { tonoDeLaVariacion } from "./tono-variacion";

const SUFIJO: Record<MetricaComparada["unidad"], string> = { ordenes: "", porcentaje: " %", horas: " h" };
const ETIQUETA_PATRON = { tempranas: "Fallas tempranas", aleatorias: "Fallas aleatorias", desgaste: "Desgaste" } as const;

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

function Atipicas({ filtros }: { filtros: FiltrosIndicadores }) {
  const clave = JSON.stringify(filtros);
  const atipicas = useDatos(() => apiObtenerAtipicas(filtros), clave);
  return (
    <BloqueDeDatos cargando="Buscando órdenes atípicas…" {...atipicas}>
      {(datos) => (
        <ContenedorGrafico
          ayuda={"Para cada tipo de máquina con al menos " + datos.minimoPorGrupo + " correctivas cerradas, marca las que tardaron más que el tercer cuartil más una vez y media el rango intercuartílico. Es un método robusto: unos pocos casos extremos no corren el límite. Se marca la orden, no a quien la hizo."}
          descripcion={datos.elementos.length === 0 ? "Ninguna correctiva se salió de lo habitual (o todavía no hay suficientes datos por tipo de máquina)." : "Reparaciones que tardaron mucho más que lo habitual para su tipo de máquina."}
          grafico={
            datos.elementos.length === 0 ? (
              <p className="empty-state">No hay órdenes atípicas en el período.</p>
            ) : (
              <table className="tabla-grafico">
                <caption className="sr-only">Órdenes atípicas</caption>
                <thead><tr><th>Orden</th><th>Activo</th><th>Tipo de máquina</th><th className="celda-numerica">Horas</th><th className="celda-numerica">Mediana</th><th className="celda-numerica">Veces la mediana</th></tr></thead>
                <tbody>
                  {datos.elementos.map((orden) => (
                    <tr key={orden.ordenId}>
                      <td><Link className="text-link" href={"/ordenes-trabajo/" + orden.ordenId}>{orden.ordenId}</Link></td>
                      <td>{orden.nombreActivo}</td><td>{orden.tipoMaquina}</td>
                      <td className="celda-numerica">{formatearNumero(orden.horas)}</td>
                      <td className="celda-numerica">{formatearNumero(orden.medianaHoras)}</td>
                      <td className="celda-numerica">{formatearNumero(orden.vecesLaMediana)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
          tabla={<p className="texto-tenue">El detalle ya se muestra como tabla.</p>}
          titulo="Reparaciones atípicas"
        />
      )}
    </BloqueDeDatos>
  );
}

function PanelDeDesgaste({ desgaste }: { desgaste: Desgaste }) {
  if (desgaste.datosInsuficientes) {
    return (
      <ContenedorGrafico
        descripcion={"Datos insuficientes: hacen falta al menos " + (desgaste.minimoDeIntervalos + 1) + " correctivas de una misma máquina para analizar sus intervalos, y " + desgaste.minimoParaPatron + " intervalos de un modelo para estimar su patrón de fallas."}
        grafico={<p className="empty-state">Todavía no hay historia suficiente para este análisis.</p>}
        tabla={<p className="texto-tenue">Sin datos suficientes.</p>}
        titulo="Patrones de desgaste"
      />
    );
  }

  return (
    <>
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
      {desgaste.patrones.length > 0 ? (
        <ContenedorGrafico
          ayuda={"Ajusta una distribución de Weibull a los días entre correctivas de cada modelo con al menos " + desgaste.minimoParaPatron + " intervalos (método del rango mediano). Forma menor que 0,9: fallas tempranas; entre 0,9 y 1,1: aleatorias; mayor que 1,1: desgaste. El ajuste R² indica cuán confiable es la estimación."}
          descripcion="Qué tipo de falla predomina en cada modelo."
          grafico={
            <table className="tabla-grafico">
              <caption className="sr-only">Patrón de fallas por modelo</caption>
              <thead><tr><th>Modelo</th><th className="celda-numerica">Intervalos</th><th className="celda-numerica">Forma</th><th className="celda-numerica">Escala (días)</th><th className="celda-numerica">Ajuste R²</th><th>Patrón</th></tr></thead>
              <tbody>
                {desgaste.patrones.map((patron) => (
                  <tr key={patron.modeloId}>
                    <td>{patron.modelo}</td><td className="celda-numerica">{patron.intervalos}</td>
                    <td className="celda-numerica">{formatearNumero(patron.forma)}</td><td className="celda-numerica">{formatearNumero(patron.escalaDias)}</td>
                    <td className="celda-numerica">{formatearNumero(patron.ajusteR2)}</td><td>{ETIQUETA_PATRON[patron.patron]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
          tabla={<p className="texto-tenue">El patrón ya se muestra en la tabla.</p>}
          titulo="Patrón de fallas por modelo"
        />
      ) : null}
    </>
  );
}

/** Sección «Análisis avanzado»: comparación de períodos, reparaciones atípicas y patrones de desgaste. Sin análisis de personas. */
export function SeccionAnalisisAvanzado({ filtros }: { filtros: FiltrosIndicadores }) {
  const clave = JSON.stringify(filtros);
  const comparativa = useDatos(() => apiObtenerComparativa(filtros), clave);
  const desgaste = useDatos(() => apiObtenerDesgaste(filtros), clave);
  return (
    <div className="grid gap-4">
      <BloqueDeDatos cargando="Cargando la comparación de períodos…" {...comparativa}>
        {(datos) => <TablaComparativa comparativa={datos} />}
      </BloqueDeDatos>
      <Atipicas filtros={filtros} />
      <BloqueDeDatos cargando="Cargando el análisis de desgaste…" {...desgaste}>
        {(datos) => <PanelDeDesgaste desgaste={datos} />}
      </BloqueDeDatos>
    </div>
  );
}
