"use client";

import { ContenedorGrafico, Sparkline } from "@/componentes/graficos-avanzados";
import { ElementoReporte } from "@/componentes/visibilidad-reportes";
import { formatearNumero } from "@/componentes/formato-numero";
import { BloqueDeDatos, useDatos } from "@/componentes/use-datos";
import { apiObtenerComparativa } from "@/servicios/api/api-reportes";
import type { FiltrosIndicadores, HorasMantenimiento, Planificacion } from "@/tipos/reporte";
import { tonoDeLaVariacion } from "./tono-variacion";

const AYUDA = "Horas de las órdenes preventivas cerradas divididas por las horas de todas las órdenes cerradas, por 100. Cada duración va de la creación al cierre, incluidas las pausas: es tiempo transcurrido, no horas efectivas de trabajo. El período y los meses se eligen por fecha de creación, aunque el cierre sea posterior. Sin fechas se usan los últimos 90 días. Las órdenes sin cierre no cuentan; si el total es cero, no hay porcentaje.";

function TablaDeHoras({ elementos, columna }: { elementos: { clave: string; nombre: string; resumen: HorasMantenimiento }[]; columna: string }) {
  return (
    <table className="tabla-grafico">
      <caption className="sr-only">Mantenimiento planificado en horas por {columna.toLowerCase()}</caption>
      <thead><tr><th>{columna}</th><th>Órdenes cerradas</th><th>Horas preventivas</th><th>Horas correctivas</th><th>Horas totales</th><th>% planificado</th></tr></thead>
      <tbody>{elementos.map(({ clave, nombre, resumen }) => (
        <tr key={clave}><td>{nombre}</td>
          <td className="celda-numerica">{resumen.ordenesCerradas}</td>
          <td className="celda-numerica">{formatearNumero(resumen.horasPreventivas)}</td>
          <td className="celda-numerica">{formatearNumero(resumen.horasCorrectivas)}</td>
          <td className="celda-numerica">{formatearNumero(resumen.horasTotales)}</td>
          <td className="celda-numerica">{resumen.porcentajePlanificado === null ? "Sin dato" : formatearNumero(resumen.porcentajePlanificado) + " %"}</td>
        </tr>
      ))}</tbody>
    </table>
  );
}

/** Barras en SVG sin estilos en línea, con las dos duraciones sobre una misma escala. */
export function BarrasDeHoras({ elementos }: { elementos: Planificacion["porMes"] }) {
  const maximo = elementos.reduce((mayor, { resumen }) => Math.max(mayor, resumen.horasTotales), 1);
  if (!elementos.some(({ resumen }) => resumen.horasTotales > 0)) return <p>No hay horas de órdenes cerradas en el período.</p>;
  return (
    <div className="planificacion-barras">
      <p className="texto-tenue">Preventivas (azul) · Correctivas (ámbar). Longitud proporcional a las horas totales.</p>
      {elementos.map(({ periodo, resumen }) => (
        <div key={periodo}>
          <p>{periodo.slice(0, 7)} · {formatearNumero(resumen.horasPreventivas)} h preventivas · {formatearNumero(resumen.horasCorrectivas)} h correctivas</p>
          <svg aria-label={periodo.slice(0, 7) + ": " + formatearNumero(resumen.horasTotales) + " horas totales"} className="planificacion-barra" role="img" viewBox="0 0 600 24">
            <rect className="planificacion-preventivas" height="24" width={resumen.horasPreventivas / maximo * 600} x="0" y="0" />
            <rect className="planificacion-correctivas" height="24" width={resumen.horasCorrectivas / maximo * 600} x={resumen.horasPreventivas / maximo * 600} y="0" />
          </svg>
        </div>
      ))}
    </div>
  );
}

function ComparacionDeHoras({ filtros }: { filtros: FiltrosIndicadores }) {
  const consulta = useDatos(() => apiObtenerComparativa(filtros), JSON.stringify(filtros));
  return (
    <BloqueDeDatos cargando="Cargando la comparación en horas…" {...consulta}>
      {(comparativa) => {
        const metrica = comparativa.metricas.find(({ codigo }) => codigo === "planificado_horas_porcentaje");
        if (!metrica) return <p>No hay datos de comparación en horas.</p>;
        const tono = tonoDeLaVariacion(metrica);
        return (
          <div className="kpi-tarjeta">
            <p className="kpi-nombre">Mantenimiento planificado en horas</p>
            <p className="kpi-valor">{metrica.actual === null ? "Sin dato" : formatearNumero(metrica.actual) + " %"}</p>
            <p className={tono}>{metrica.variacionPorcentual === null ? "Sin período anterior para comparar" : (metrica.variacionPorcentual > 0 ? "+" : "") + formatearNumero(metrica.variacionPorcentual) + " % frente al período anterior"}</p>
            <p className="texto-tenue">{metrica.muestra} órdenes cerradas · {comparativa.periodo.desde} – {comparativa.periodo.hasta}</p>
            <Sparkline titulo="Tendencia de seis meses del mantenimiento planificado en horas" tono={tono} valores={metrica.serie.map(({ valor }) => valor)} />
          </div>
        );
      }}
    </BloqueDeDatos>
  );
}

export function PlanificacionEnHoras({ datos, filtros }: { datos: Planificacion; filtros: FiltrosIndicadores }) {
  return (
    <>
    <ElementoReporte codigo="indicador_planificado_horas"><ComparacionDeHoras filtros={filtros} /></ElementoReporte>
    <ContenedorGrafico
      titulo="Mantenimiento planificado frente a reactivo en horas"
      descripcion={"Del " + datos.periodo.desde + " al " + datos.periodo.hasta + ": " + formatearNumero(datos.resumen.horasPreventivas) + " h preventivas y " + formatearNumero(datos.resumen.horasCorrectivas) + " h correctivas. Incluye las pausas."}
      ayuda={AYUDA}
      grafico={<BarrasDeHoras elementos={datos.porMes} />}
      tabla={<TablaDeHoras columna="Mes" elementos={datos.porMes.map(({ periodo, resumen }) => ({ clave: periodo, nombre: periodo.slice(0, 7), resumen }))} />}
    />
    </>
  );
}

export function PlanificacionPorTipo({ datos }: { datos: Planificacion }) {
  const elementos = datos.porTipo.map(({ id, nombre, resumen }) => ({ clave: String(id), nombre, resumen }));
  return (
    <ContenedorGrafico
      titulo="Horas de mantenimiento por tipo de máquina"
      descripcion="Compara el tiempo preventivo y correctivo sin mezclar tipos de máquina."
      ayuda={AYUDA}
      grafico={elementos.length === 0 ? <p>No hay órdenes cerradas en el período.</p> : <TablaDeHoras columna="Tipo de máquina" elementos={elementos} />}
      tabla={<TablaDeHoras columna="Tipo de máquina" elementos={elementos} />}
    />
  );
}
