import { Sparkline } from "@/componentes/graficos-avanzados";
import { formatearNumero } from "@/componentes/formato-numero";
import { resolverConsulta, type ConsultaAnticipada } from "@/servicios/servidor/consulta-anticipada";
import type { obtenerComparativaServidor } from "@/servicios/servidor/reportes";
import type { CodigoMetrica, MetricaComparada } from "@/tipos/reporte";
import { tonoDeLaVariacion } from "./tono-variacion";

const TARJETAS: { codigo: CodigoMetrica; seccion: string }[] = [
  { codigo: "preventivas_porcentaje", seccion: "maquinaria" },
  { codigo: "cumplimiento_preventivo", seccion: "proceso" },
  { codigo: "tiempo_reparacion_horas", seccion: "maquinaria" },
];

const SUFIJO: Record<MetricaComparada["unidad"], string> = { ordenes: "", porcentaje: "%", horas: "h" };

function describirVariacion(metrica: MetricaComparada) {
  if (metrica.variacionPorcentual === null) return "Sin período anterior para comparar";
  if (metrica.variacionPorcentual === 0) return "Igual que el período anterior";
  const flecha = metrica.variacionPorcentual > 0 ? "▲" : "▼";
  return flecha + " " + formatearNumero(Math.abs(metrica.variacionPorcentual)) + " % frente al período anterior";
}

/** Tres indicadores clave arriba de Reportes: cifra, variación frente al período anterior y tendencia de seis meses. */
export async function TarjetasKpi({ consulta, desactivados = [] }: { consulta: ConsultaAnticipada<Awaited<ReturnType<typeof obtenerComparativaServidor>>>; desactivados?: string[] }) {
  let comparativa;
  try {
    comparativa = await resolverConsulta(consulta);
  } catch {
    return null;
  }

  return (
    <section aria-label="Indicadores clave" className="kpi-franja">
      {TARJETAS.map(({ codigo, seccion }) => {
        if (desactivados.includes("kpi_" + codigo)) return null;
        const metrica = comparativa.metricas.find((item) => item.codigo === codigo);
        if (!metrica) return null;
        const tono = tonoDeLaVariacion(metrica);
        return (
          <a className="kpi-tarjeta" href={"#seccion-" + seccion} key={codigo}>
            <p className="kpi-nombre">{metrica.nombre}</p>
            <p className="kpi-valor">
              {metrica.actual === null ? "Sin datos" : formatearNumero(metrica.actual)}
              {metrica.actual !== null ? <small>{SUFIJO[metrica.unidad]}</small> : null}
            </p>
            <div className="kpi-pie">
              <span className={"kpi-variacion " + tono}>{describirVariacion(metrica)}</span>
              <Sparkline titulo={"Tendencia de seis meses: " + metrica.nombre} tono={tono} valores={metrica.serie.map((punto) => punto.valor)} />
            </div>
          </a>
        );
      })}
    </section>
  );
}
