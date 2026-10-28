"use client";

import { useState } from "react";
import { ContenedorGrafico } from "@/componentes/graficos-avanzados";
import { GraficoBarras } from "@/componentes/graficos";
import { BloqueDeDatos, useDatos } from "@/componentes/use-datos";
import { apiObtenerRepuestosPorModelo } from "@/servicios/api/api-repuestos-por-modelo";
import type { FiltrosIndicadores } from "@/tipos/reporte";

export function RepuestosPorModelo({ filtros }: { filtros: FiltrosIndicadores }) {
  const consulta = useDatos(() => apiObtenerRepuestosPorModelo(filtros), JSON.stringify(filtros));
  const [modeloElegido, elegirModelo] = useState<number | null>(null);
  return <div className="estacionalidad-panel">
    <BloqueDeDatos cargando="Cargando repuestos por modelo…" {...consulta}>{datos => {
      if (datos.modelos.length === 0) return <section className="grafico-contenedor">
        <h3>Repuestos por modelo</h3><p className="empty-state">No hay repuestos asociados a correctivas en el período seleccionado.</p>
      </section>;
      const modelo = datos.modelos.find(elemento => elemento.modeloId === modeloElegido) ?? datos.modelos[0];
      return <div>
        <label className="campo-filtro" htmlFor="modelo-repuestos">Modelo de máquina
          <select id="modelo-repuestos" onChange={evento => elegirModelo(Number(evento.target.value))} value={modelo.modeloId}>
            {datos.modelos.map(elemento => <option key={elemento.modeloId} value={elemento.modeloId}>
              {elemento.tipoMaquina} · {elemento.modelo}
            </option>)}
          </select>
        </label>
        <ContenedorGrafico titulo="Repuestos por modelo"
          descripcion={`En ${modelo.tipoMaquina} · ${modelo.modelo}, los repuestos se ordenan por la cantidad de correctivas a las que están asociados.`}
          ayuda="Cuenta órdenes correctivas distintas por repuesto vinculado y modelo de máquina, según la fecha UTC de creación y los filtros de cliente y activo. Incluye vínculos reservados, entregados y descontados; excluye los liberados. «Suministradas» cuenta órdenes cuyo vínculo está entregado o descontado. Una orden puede tener varios repuestos, por lo que no se suman las filas como total de órdenes. La asociación no mide unidades consumidas ni garantiza demanda futura. Incluye órdenes abiertas, cerradas y eliminadas del historial. Sin fechas consulta todo el historial."
          grafico={<GraficoBarras datos={modelo.repuestos.slice(0, 12).map(repuesto => ({
            etiqueta: repuesto.repuesto, valor: repuesto.ordenesAsociadas,
            valorTexto: `${repuesto.ordenesAsociadas} órdenes`,
            detalle: `${repuesto.ordenesSuministradas} con repuesto suministrado`,
          }))} vacio="No hay repuestos asociados." />}
          tabla={<table className="tabla-grafico">
            <caption className="sr-only">Repuestos asociados a correctivas de {modelo.modelo}</caption>
            <thead><tr><th scope="col">Repuesto</th><th scope="col">Código</th>
              <th className="celda-numerica" scope="col">Órdenes asociadas</th>
              <th className="celda-numerica" scope="col">Con suministro</th></tr></thead>
            <tbody>{modelo.repuestos.map(repuesto => <tr key={repuesto.repuestoId}>
              <th scope="row">{repuesto.repuesto}</th><td>{repuesto.codigo}</td>
              <td className="celda-numerica">{repuesto.ordenesAsociadas}</td>
              <td className="celda-numerica">{repuesto.ordenesSuministradas}</td>
            </tr>)}</tbody>
          </table>} />
        {modelo.repuestos.length > 12 && <p className="texto-tenue">La gráfica muestra los primeros 12; la tabla incluye todos.</p>}
      </div>;
    }}</BloqueDeDatos>
  </div>;
}
