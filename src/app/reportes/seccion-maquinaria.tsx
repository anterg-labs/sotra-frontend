"use client";

import { BloqueDeDatos, useDatos } from "@/componentes/use-datos";
import { formatearNumero } from "@/componentes/formato-numero";
import { ContenedorGrafico, GraficoPareto } from "@/componentes/graficos-avanzados";
import { GraficoBarras } from "@/componentes/graficos";
import { apiObtenerDesempeno } from "@/servicios/api/api-reportes";
import type { FiltrosIndicadores, MaquinariaDesempeno } from "@/tipos/reporte";
import { PlanificacionEnHoras, PlanificacionPorTipo } from "./planificacion-en-horas";

function porcentajeDePreventivas(elemento: MaquinariaDesempeno) {
  return elemento.ordenes === 0 ? 0 : (elemento.preventivas * 100) / elemento.ordenes;
}

function Pareto({ activos }: { activos: MaquinariaDesempeno[] }) {
  const conParada = activos.filter((activo) => activo.horasParada > 0);
  const concentrado = conParada.find((activo) => (activo.porcentajeAcumulado ?? 0) >= 80);
  return (
    <ContenedorGrafico
      ayuda="Ordena los activos de mayor a menor horas de parada (de la creación al cierre de sus correctivas cerradas) y acumula el porcentaje sobre el total de la parada del período. La línea punteada marca el 80 %."
      descripcion={
        conParada.length === 0
          ? "Todavía no hay correctivas cerradas en el período."
          : concentrado
            ? "Los primeros " + (conParada.indexOf(concentrado) + 1) + " activos concentran el " + formatearNumero(concentrado.porcentajeAcumulado) + " % de la parada."
            : "Los " + conParada.length + " activos con más parada suman el " + formatearNumero(conParada.at(-1)?.porcentajeAcumulado) + " % del total."
      }
      grafico={
        <GraficoPareto
          datos={conParada.map((activo) => ({ etiqueta: activo.nombre, valor: activo.horasParada, acumulado: activo.porcentajeAcumulado }))}
          titulo="Pareto de horas de parada por activo"
          unidad="horas de parada"
        />
      }
      tabla={
        <table className="tabla-grafico">
          <caption className="sr-only">Horas de parada por activo</caption>
          <thead><tr><th>Activo</th><th>Cliente</th><th className="celda-numerica">Horas de parada</th><th className="celda-numerica">% del total</th><th className="celda-numerica">% acumulado</th></tr></thead>
          <tbody>
            {conParada.map((activo) => (
              <tr key={activo.id}>
                <td>{activo.nombre}</td><td>{activo.cliente ?? "—"}</td>
                <td className="celda-numerica">{formatearNumero(activo.horasParada)}</td>
                <td className="celda-numerica">{formatearNumero(activo.porcentajeDeLaParada)}</td>
                <td className="celda-numerica">{formatearNumero(activo.porcentajeAcumulado)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
      titulo="¿Qué máquinas concentran la parada?"
    />
  );
}

function TiempoDeReparacion({ elementos, titulo }: { elementos: MaquinariaDesempeno[]; titulo: string }) {
  const conDatos = elementos.filter((elemento) => elemento.tiempoMedioReparacionHoras !== null);
  return (
    <ContenedorGrafico
      ayuda="Promedio de horas desde que se crea una orden correctiva hasta que se cierra, por tipo de máquina o por modelo. Solo cuenta correctivas cerradas."
      descripcion={conDatos.length === 0 ? "Todavía no hay correctivas cerradas." : "De más a menos tiempo: las primeras son las que más tardan en volver a servicio."}
      grafico={
        <GraficoBarras
          datos={[...conDatos]
            .sort((a, b) => (b.tiempoMedioReparacionHoras ?? 0) - (a.tiempoMedioReparacionHoras ?? 0))
            .map((elemento) => ({
              etiqueta: elemento.nombre,
              valor: elemento.tiempoMedioReparacionHoras ?? 0,
              valorTexto: formatearNumero(elemento.tiempoMedioReparacionHoras) + " h",
              detalle: elemento.correctivasCerradas + " correctivas cerradas",
            }))}
          vacio="Todavía no hay correctivas cerradas."
        />
      }
      tabla={
        <table className="tabla-grafico">
          <caption className="sr-only">{titulo}</caption>
          <thead><tr><th>Nombre</th><th className="celda-numerica">Correctivas cerradas</th><th className="celda-numerica">Horas promedio</th><th className="celda-numerica">Horas de parada</th><th className="celda-numerica">Costo de la parada</th></tr></thead>
          <tbody>
            {elementos.map((elemento) => (
              <tr key={elemento.id}>
                <td>{elemento.nombre}</td>
                <td className="celda-numerica">{elemento.correctivasCerradas}</td>
                <td className="celda-numerica">{formatearNumero(elemento.tiempoMedioReparacionHoras)}</td>
                <td className="celda-numerica">{formatearNumero(elemento.horasParada)}</td>
                <td className="celda-numerica">{elemento.costoParada === null ? "Sin dato" : formatearNumero(elemento.costoParada)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
      titulo={titulo}
    />
  );
}

function PlanificadoFrenteAReactivo({ elementos }: { elementos: MaquinariaDesempeno[] }) {
  const conOrdenes = elementos.filter((elemento) => elemento.ordenes > 0);
  return (
    <ContenedorGrafico
      ayuda="Porcentaje de las órdenes del período que son preventivas, por tipo de máquina. Un porcentaje bajo indica que la mayor parte del trabajo es correctivo."
      descripcion={conOrdenes.length === 0 ? "No hay órdenes en el período." : "Cuanto más alto, más trabajo planificado y menos reparaciones por falla."}
      grafico={
        <GraficoBarras
          datos={conOrdenes.map((elemento) => ({
            etiqueta: elemento.nombre,
            valor: porcentajeDePreventivas(elemento),
            valorTexto: formatearNumero(porcentajeDePreventivas(elemento)) + " %",
            detalle: elemento.preventivas + " preventivas · " + elemento.correctivas + " correctivas",
          }))}
          vacio="No hay órdenes en el período."
        />
      }
      tabla={
        <table className="tabla-grafico">
          <caption className="sr-only">Preventivas y correctivas por tipo de máquina</caption>
          <thead><tr><th>Tipo de máquina</th><th className="celda-numerica">Preventivas</th><th className="celda-numerica">Correctivas</th><th className="celda-numerica">% preventivas</th></tr></thead>
          <tbody>
            {conOrdenes.map((elemento) => (
              <tr key={elemento.id}><td>{elemento.nombre}</td><td className="celda-numerica">{elemento.preventivas}</td><td className="celda-numerica">{elemento.correctivas}</td><td className="celda-numerica">{formatearNumero(porcentajeDePreventivas(elemento))}</td></tr>
            ))}
          </tbody>
        </table>
      }
      titulo="Trabajo planificado frente a reactivo"
    />
  );
}

/** Sección «Maquinaria»: qué máquinas y modelos concentran la parada, cuánto tardan en repararse y cuánto es preventivo. */
export function SeccionMaquinaria({ filtros }: { filtros: FiltrosIndicadores }) {
  const clave = JSON.stringify(filtros);
  const desempeno = useDatos(() => apiObtenerDesempeno(filtros), clave);
  return (
    <BloqueDeDatos cargando="Cargando la maquinaria…" {...desempeno}>
      {(datos) => (
        <div className="seccion-grilla">
          <Pareto activos={datos.maquinaria.activos} />
          <PlanificadoFrenteAReactivo elementos={datos.maquinaria.porTipo} />
          <PlanificacionEnHoras datos={datos.planificacion} filtros={filtros} />
          <PlanificacionPorTipo datos={datos.planificacion} />
          <TiempoDeReparacion elementos={datos.maquinaria.porTipo} titulo="Tiempo medio de reparación por tipo de máquina" />
          <TiempoDeReparacion elementos={datos.maquinaria.porModelo} titulo="Tiempo medio de reparación por modelo" />
        </div>
      )}
    </BloqueDeDatos>
  );
}
