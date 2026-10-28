"use client";

import Link from "next/link";
import { BloqueDeDatos, useDatos } from "@/componentes/use-datos";
import { formatearNumero } from "@/componentes/formato-numero";
import { ContenedorGrafico, GraficoColumnas, GraficoLineas, type DatoColumna } from "@/componentes/graficos-avanzados";
import { GraficoBarras } from "@/componentes/graficos";
import { apiObtenerDesempeno, apiObtenerEnvejecimiento, apiObtenerTendencias, apiObtenerTiempos } from "@/servicios/api/api-reportes";
import type { Envejecimiento, FiltrosIndicadores, Tendencias } from "@/tipos/reporte";
import { DemorasPorEtapa } from "./demoras-por-etapa";

const SEVERIDAD_POR_RANGO: Record<string, DatoColumna["severidad"]> = {
  hasta_3: "normal",
  "4_a_7": "normal",
  "8_a_30": "atencion",
  "31_a_90": "atencion",
  mas_de_90: "critico",
};

function etiquetaDelPeriodo(periodo: string) {
  const [anio, mes] = periodo.split("-");
  return mes + "/" + anio.slice(2);
}

function CreadasYCerradas({ tendencias }: { tendencias: Tendencias }) {
  const etiquetas = tendencias.puntos.map((punto) => etiquetaDelPeriodo(punto.periodo));
  const series = [
    { nombre: "Creadas", clase: "grafico-serie-creadas", valores: tendencias.puntos.map((punto) => punto.total) },
    { nombre: "Cerradas", clase: "grafico-serie-cerradas", valores: tendencias.puntos.map((punto) => punto.cerradas) },
  ];
  const acumulacion = tendencias.puntos.reduce((suma, punto) => suma + punto.total - punto.cerradas, 0);
  return (
    <ContenedorGrafico
      ayuda="Cuenta las órdenes creadas y las cerradas en cada mes (por su fecha de creación y de cierre). Si la línea de creadas queda arriba de la de cerradas durante varios meses, el trabajo pendiente se acumula."
      descripcion={
        acumulacion > 0
          ? "En el período se crearon " + formatearNumero(acumulacion) + " órdenes más de las que se cerraron."
          : "En el período se cerraron al menos tantas órdenes como se crearon."
      }
      grafico={<GraficoLineas etiquetas={etiquetas} series={series} titulo="Órdenes creadas frente a cerradas por mes" />}
      tabla={
        <table className="tabla-grafico">
          <caption className="sr-only">Órdenes creadas frente a cerradas por mes</caption>
          <thead><tr><th>Mes</th><th className="celda-numerica">Creadas</th><th className="celda-numerica">Cerradas</th></tr></thead>
          <tbody>
            {tendencias.puntos.map((punto) => (
              <tr key={punto.periodo}><td>{etiquetaDelPeriodo(punto.periodo)}</td><td className="celda-numerica">{punto.total}</td><td className="celda-numerica">{punto.cerradas}</td></tr>
            ))}
          </tbody>
        </table>
      }
      titulo="Órdenes creadas frente a cerradas"
    />
  );
}

function EnvejecimientoDeOrdenes({ datos }: { datos: Envejecimiento }) {
  const columnas: DatoColumna[] = datos.rangos.map((rango) => ({
    etiqueta: rango.etiqueta.replace(" días", ""),
    valor: rango.cantidad,
    severidad: SEVERIDAD_POR_RANGO[rango.rango] ?? "normal",
  }));
  return (
    <ContenedorGrafico
      ayuda="Cuenta las órdenes pendientes, en curso o en revisión según los días que pasaron desde su creación. El backlog en semanas divide las órdenes abiertas por las que se cerraron por semana en las últimas ocho semanas; es una aproximación por cantidad de órdenes, no por horas."
      descripcion={
        datos.backlogEnSemanas === null
          ? formatearNumero(datos.abiertas) + " órdenes abiertas; todavía no hay cierres recientes para estimar el backlog."
          : formatearNumero(datos.abiertas) + " órdenes abiertas: al ritmo de cierre actual se vaciarían en " + formatearNumero(datos.backlogEnSemanas) + " semanas."
      }
      grafico={
        <>
          <GraficoColumnas datos={columnas} titulo="Órdenes abiertas por antigüedad en días" unidad="órdenes" />
          {datos.masAntiguas.length > 0 ? (
            <ul className="lista-simple">
              {datos.masAntiguas.map((orden) => (
                <li key={orden.ordenId}>
                  <Link className="text-link" href={"/ordenes-trabajo/" + orden.ordenId}>Orden {orden.ordenId}</Link>
                  {" · " + orden.nombreActivo + " · " + orden.estado + " · " + formatearNumero(orden.edadDias) + " días"}
                </li>
              ))}
            </ul>
          ) : null}
        </>
      }
      tabla={
        <table className="tabla-grafico">
          <caption className="sr-only">Órdenes abiertas por antigüedad</caption>
          <thead><tr><th>Antigüedad</th><th className="celda-numerica">Órdenes</th></tr></thead>
          <tbody>
            {datos.rangos.map((rango) => (
              <tr key={rango.rango}><td>{rango.etiqueta}</td><td className="celda-numerica">{rango.cantidad}</td></tr>
            ))}
          </tbody>
        </table>
      }
      titulo="Antigüedad de las órdenes abiertas"
    />
  );
}

/** Sección «Proceso»: cómo fluye el trabajo (acumulación, antigüedad, cumplimiento de fechas y demoras por motivo). */
export function SeccionProceso({ filtros }: { filtros: FiltrosIndicadores }) {
  const clave = JSON.stringify(filtros);
  const tendencias = useDatos(() => apiObtenerTendencias(filtros, "mes"), clave);
  const envejecimiento = useDatos(() => apiObtenerEnvejecimiento(filtros), clave);
  const tiempos = useDatos(() => apiObtenerTiempos(filtros), clave);
  const desempeno = useDatos(() => apiObtenerDesempeno(filtros), clave);

  return (
    <div className="seccion-grilla">
      <DemorasPorEtapa filtros={filtros} key={clave} />
      <BloqueDeDatos cargando="Cargando la evolución de las órdenes…" {...tendencias}>
        {(datos) => <CreadasYCerradas tendencias={datos} />}
      </BloqueDeDatos>
      <BloqueDeDatos cargando="Cargando la antigüedad de las órdenes…" {...envejecimiento}>
        {(datos) => <EnvejecimientoDeOrdenes datos={datos} />}
      </BloqueDeDatos>
      <BloqueDeDatos cargando="Cargando el cumplimiento de fechas…" {...tiempos}>
        {(datos) => {
          const grupos = datos.cumplimientoPreventivoPorTipoDeMaquina.filter((grupo) => grupo.porcentajeEnPlazo !== null);
          return (
            <ContenedorGrafico
              ayuda="De los preventivos cerrados, el porcentaje que se cerró a más tardar en su fecha prevista de ejecución, por tipo de máquina."
              descripcion={
                datos.cumplimiento.porcentajeEnPlazo === null
                  ? "Todavía no hay órdenes cerradas con fecha prevista."
                  : formatearNumero(datos.cumplimiento.porcentajeEnPlazo) + " % de las órdenes cerradas se cerró en fecha."
              }
              grafico={
                <GraficoBarras
                  datos={grupos.map((grupo) => ({
                    etiqueta: grupo.nombre,
                    valor: grupo.porcentajeEnPlazo ?? 0,
                    valorTexto: formatearNumero(grupo.porcentajeEnPlazo) + " %",
                    detalle: grupo.enPlazo + " de " + grupo.evaluadas + " preventivos",
                  }))}
                  vacio="Todavía no hay preventivos cerrados con fecha prevista."
                />
              }
              tabla={
                <table className="tabla-grafico">
                  <caption className="sr-only">Cumplimiento preventivo por tipo de máquina</caption>
                  <thead><tr><th>Tipo de máquina</th><th className="celda-numerica">Cerrados</th><th className="celda-numerica">En fecha</th><th className="celda-numerica">%</th></tr></thead>
                  <tbody>
                    {datos.cumplimientoPreventivoPorTipoDeMaquina.map((grupo) => (
                      <tr key={grupo.nombre}><td>{grupo.nombre}</td><td className="celda-numerica">{grupo.evaluadas}</td><td className="celda-numerica">{grupo.enPlazo}</td><td className="celda-numerica">{formatearNumero(grupo.porcentajeEnPlazo)}</td></tr>
                    ))}
                  </tbody>
                </table>
              }
              titulo="Cumplimiento del plan preventivo"
            />
          );
        }}
      </BloqueDeDatos>
      <BloqueDeDatos cargando="Cargando las pausas por motivo…" {...desempeno}>
        {(datos) => {
          const motivos = datos.flujo.pausas.porMotivo;
          return (
            <ContenedorGrafico
              ayuda="Suma las horas que las órdenes estuvieron en pausa, agrupadas por el motivo que se eligió al pausarlas. Las pausas sin motivo codificado figuran como «Sin motivo codificado»."
              descripcion={
                motivos.length === 0
                  ? "No hubo pausas en el período."
                  : "Las horas en pausa pesan más que la cantidad de pausas: indican qué demora cuesta más tiempo."
              }
              grafico={
                <GraficoBarras
                  datos={motivos.map((motivo) => ({
                    etiqueta: motivo.motivo,
                    valor: motivo.horas,
                    valorTexto: formatearNumero(motivo.horas) + " h",
                    detalle: motivo.cantidad + (motivo.cantidad === 1 ? " pausa" : " pausas"),
                  }))}
                  vacio="No hubo pausas en el período."
                />
              }
              tabla={
                <table className="tabla-grafico">
                  <caption className="sr-only">Pausas por motivo</caption>
                  <thead><tr><th>Motivo</th><th className="celda-numerica">Pausas</th><th className="celda-numerica">Horas</th><th className="celda-numerica">Promedio</th></tr></thead>
                  <tbody>
                    {motivos.map((motivo) => (
                      <tr key={motivo.codigo}><td>{motivo.motivo}</td><td className="celda-numerica">{motivo.cantidad}</td><td className="celda-numerica">{formatearNumero(motivo.horas)}</td><td className="celda-numerica">{formatearNumero(motivo.horasPromedio)}</td></tr>
                    ))}
                  </tbody>
                </table>
              }
              titulo="Horas en pausa por motivo"
            />
          );
        }}
      </BloqueDeDatos>
    </div>
  );
}
