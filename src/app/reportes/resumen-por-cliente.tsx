"use client";

import { useState } from "react";
import { ContenedorGrafico } from "@/componentes/graficos-avanzados";
import { GraficoBarras } from "@/componentes/graficos";
import { formatearNumero } from "@/componentes/formato-numero";
import { BloqueDeDatos, useDatos } from "@/componentes/use-datos";
import { apiObtenerResumenPorCliente } from "@/servicios/api/api-resumen-por-cliente";
import type { FiltrosIndicadores } from "@/tipos/reporte";
import type { ClienteDeReportes } from "@/tipos/resumen-por-cliente";

const METRICAS = [
  { clave: "ordenes", etiqueta: "Órdenes" },
  { clave: "correctivas", etiqueta: "Correctivas" },
  { clave: "horasParada", etiqueta: "Horas de parada" },
  { clave: "reincidencias", etiqueta: "Reincidencias" },
] as const;
type Metrica = typeof METRICAS[number]["clave"];

export function ResumenPorCliente({ filtros }: { filtros: FiltrosIndicadores }) {
  const consulta = useDatos(() => apiObtenerResumenPorCliente(filtros), JSON.stringify(filtros));
  const [metrica, elegirMetrica] = useState<Metrica>("correctivas");
  return <div className="estacionalidad-panel">
    <BloqueDeDatos cargando="Cargando resumen por cliente…" {...consulta}>{datos => {
      if (datos.clientes.length === 0) return <section className="grafico-contenedor">
        <h3>Resumen por cliente</h3><p className="empty-state">No hay órdenes en el período seleccionado.</p>
      </section>;
      const ordenados = [...datos.clientes].sort((primero, segundo) =>
        segundo[metrica] - primero[metrica] || primero.cliente.localeCompare(segundo.cliente));
      const etiqueta = METRICAS.find(elemento => elemento.clave === metrica)?.etiqueta ?? "Correctivas";
      return <div>
        <label className="campo-filtro" htmlFor="metrica-clientes">Comparar por
          <select id="metrica-clientes" onChange={evento => elegirMetrica(evento.target.value as Metrica)} value={metrica}>
            {METRICAS.map(elemento => <option key={elemento.clave} value={elemento.clave}>{elemento.etiqueta}</option>)}
          </select>
        </label>
        <ContenedorGrafico titulo="Resumen por cliente"
          descripcion={`Empresas ordenadas por ${etiqueta.toLowerCase()}. La gráfica muestra las primeras doce; la tabla incluye todas.`}
          ayuda={`Agrupa las órdenes por empresa cliente según la fecha UTC de creación, con filtros de fecha, cliente y activo. Correctivas es un subconjunto de órdenes. Las horas de parada suman el tiempo de creación a cierre de las correctivas cerradas, incluidas pausas; no son horas efectivas de trabajo ni indisponibilidad total. Una reincidencia es una nueva correctiva del mismo activo creada dentro de ${datos.diasReincidencia} días desde el cierre de la anterior (o desde su creación si sigue abierta), comparando solo las correctivas del período filtrado, como en el reporte de reincidencias. Incluye órdenes de cualquier estado histórico, incluso eliminadas. Sin fechas usa todo el historial. Los clientes sin órdenes no aparecen. No evalúa personas.`}
          grafico={<GraficoBarras datos={ordenados.slice(0, 12).map(cliente => ({
            etiqueta: cliente.cliente, valor: cliente[metrica],
            valorTexto: metrica === "horasParada" ? `${formatearNumero(cliente[metrica])} h` : `${cliente[metrica]}`,
            detalle: `${cliente.correctivas} correctivas · ${cliente.reincidencias} reincidencias`,
          }))} vacio="No hay órdenes en el período." />}
          tabla={<table className="tabla-grafico">
            <caption className="sr-only">Demanda de mantenimiento por empresa cliente</caption>
            <thead><tr><th scope="col">Cliente</th><th className="celda-numerica" scope="col">Órdenes</th>
              <th className="celda-numerica" scope="col">Correctivas</th>
              <th className="celda-numerica" scope="col">Correctivas cerradas</th>
              <th className="celda-numerica" scope="col">Horas de parada</th>
              <th className="celda-numerica" scope="col">Reincidencias</th></tr></thead>
            <tbody>{ordenados.map((cliente: ClienteDeReportes) => <tr key={cliente.clienteId}>
              <th scope="row">{cliente.cliente}</th><td className="celda-numerica">{cliente.ordenes}</td>
              <td className="celda-numerica">{cliente.correctivas}</td>
              <td className="celda-numerica">{cliente.correctivasCerradas}</td>
              <td className="celda-numerica">{formatearNumero(cliente.horasParada)}</td>
              <td className="celda-numerica">{cliente.reincidencias}</td>
            </tr>)}</tbody>
          </table>} />
      </div>;
    }}</BloqueDeDatos>
  </div>;
}
