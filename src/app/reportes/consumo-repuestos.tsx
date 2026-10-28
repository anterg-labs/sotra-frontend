"use client";

import { ContenedorGrafico } from "@/componentes/graficos-avanzados";
import { GraficoBarras } from "@/componentes/graficos";
import { BloqueDeDatos, useDatos } from "@/componentes/use-datos";
import { formatearNumero } from "@/componentes/formato-numero";
import { apiObtenerConsumoDeRepuestos } from "@/servicios/api/api-consumo-repuestos";
import type { FiltrosIndicadores } from "@/tipos/reporte";

export function ConsumoRepuestos({ filtros }: { filtros: FiltrosIndicadores }) {
  const consulta = useDatos(() => apiObtenerConsumoDeRepuestos(filtros), JSON.stringify(filtros));
  return <BloqueDeDatos cargando="Cargando consumo de repuestos…" {...consulta}>{datos =>
    <ContenedorGrafico titulo="Consumo de repuestos en unidades"
      descripcion={datos.repuestos.length === 0
        ? "No hubo unidades descontadas por órdenes en el período seleccionado."
        : `${formatearNumero(datos.totalUnidades)} unidades descontadas en ${datos.repuestos.length} repuestos.`}
      ayuda="Suma la cantidad de cada repuesto descontada del stock al cerrar órdenes preventivas o correctivas. El período se filtra por la fecha UTC del egreso, no por la creación de la orden. No cuentan reservas, entregas sin descuento, vínculos liberados ni egresos manuales. Los filtros de cliente y activo corresponden a la orden. Sin fechas se consulta todo el historial. La gráfica muestra hasta doce repuestos; la tabla incluye todos."
      grafico={<GraficoBarras datos={datos.repuestos.slice(0, 12).map(repuesto => ({
        etiqueta: repuesto.repuesto, valor: repuesto.unidades,
        valorTexto: `${formatearNumero(repuesto.unidades)} unidades`,
        detalle: `${formatearNumero(repuesto.ordenes)} órdenes`,
      }))} vacio="No hay consumo registrado." />}
      tabla={<table className="tabla-grafico">
        <caption className="sr-only">Unidades consumidas por repuesto; total {formatearNumero(datos.totalUnidades)}</caption>
        <thead><tr><th scope="col">Repuesto</th><th scope="col">Código</th>
          <th className="celda-numerica" scope="col">Unidades</th>
          <th className="celda-numerica" scope="col">Órdenes</th></tr></thead>
        <tbody>{datos.repuestos.map(repuesto => <tr key={repuesto.repuestoId}>
          <th scope="row">{repuesto.repuesto}</th><td>{repuesto.codigo}</td>
          <td className="celda-numerica">{formatearNumero(repuesto.unidades)}</td>
          <td className="celda-numerica">{formatearNumero(repuesto.ordenes)}</td>
        </tr>)}</tbody>
        <tfoot><tr><th scope="row" colSpan={2}>Total</th><td className="celda-numerica">{formatearNumero(datos.totalUnidades)}</td><td /></tr></tfoot>
      </table>} />}</BloqueDeDatos>;
}
