"use client";

import { ContenedorGrafico } from "@/componentes/graficos-avanzados";
import { BloqueDeDatos, useDatos } from "@/componentes/use-datos";
import { apiObtenerEstacionalidad } from "@/servicios/api/api-estacionalidad";
import type { Estacionalidad as DatosEstacionalidad } from "@/tipos/estacionalidad";
import type { FiltrosIndicadores } from "@/tipos/reporte";

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const NOMBRES_MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function TablaEstacionalidad({ datos, esMapa = false }: { datos: DatosEstacionalidad; esMapa?: boolean }) {
  const maximo = datos.tipos.reduce((mayor, tipo) => Math.max(mayor, ...tipo.meses.map(mes => mes.correctivas)), 1);
  return (
    <div aria-label={esMapa ? "Mapa de calor mensual, desplazable horizontalmente" : "Tabla de correctivas por mes"} className="estacionalidad-desplazable" role="region" tabIndex={0}>
      <table className={`tabla-grafico estacionalidad-tabla${esMapa ? " estacionalidad-mapa" : ""}`}>
        <caption className="sr-only">Correctivas por tipo de máquina y mes del año</caption>
        <thead><tr><th scope="col">Tipo de máquina</th>{MESES.map((mes, indice) => <th key={mes} scope="col"><abbr title={NOMBRES_MESES[indice]}>{mes}</abbr></th>)}<th scope="col">Total</th></tr></thead>
        <tbody>{datos.tipos.map(tipo => <tr key={tipo.tipoMaquinaId}>
          <th scope="row">{tipo.tipoMaquina}</th>
          {tipo.meses.map(mes => <td className={esMapa ? `estacionalidad-nivel-${mes.correctivas === 0 ? 0 : Math.ceil(mes.correctivas / maximo * 4)}` : undefined} key={mes.mes}
            title={`${tipo.tipoMaquina} · ${NOMBRES_MESES[mes.mes - 1]}: ${mes.correctivas} correctivas`}>{mes.correctivas}</td>)}
          <td>{tipo.total}</td>
        </tr>)}</tbody>
        <tfoot><tr><th scope="row">Total mensual</th>{datos.meses.map(mes => <td key={mes.mes}>{mes.correctivas}</td>)}<td>{datos.total}</td></tr></tfoot>
      </table>
    </div>
  );
}

export function Estacionalidad({ filtros }: { filtros: FiltrosIndicadores }) {
  const consulta = useDatos(() => apiObtenerEstacionalidad(filtros), JSON.stringify(filtros));
  return <div className="estacionalidad-panel">
    <BloqueDeDatos cargando="Cargando la estacionalidad…" {...consulta}>{datos => datos.total === 0
      ? <section className="grafico-contenedor"><h3>Estacionalidad de las correctivas</h3><p className="empty-state">No hay correctivas en el período seleccionado.</p></section>
      : <ContenedorGrafico titulo="Estacionalidad de las correctivas"
        descripcion={`${datos.total} correctivas por mes del año y tipo de máquina. Mayor intensidad indica más órdenes; las cifras permiten comparar sin depender del color.`}
        ayuda="Cuenta las órdenes correctivas por su mes UTC de creación, con los filtros de fecha, cliente y activo. Acumula el mismo mes de los distintos años seleccionados. Incluye órdenes abiertas, cerradas y eliminadas del historial, y tipos inactivos con órdenes. Los meses sin órdenes valen cero; solo aparecen tipos con correctivas en el período. Sin fechas usa todo el historial. No aplica el filtro de estado ni el de tipo de mantenimiento: siempre analiza correctivas. Son conteos, sin ajustar por cantidad de máquinas, uso o meses parciales: conviene comparar años completos antes de concluir que hay estacionalidad. No predice fallas ni demanda futura."
        grafico={<><TablaEstacionalidad datos={datos} esMapa /><p className="texto-tenue estacionalidad-leyenda">Menos <span aria-hidden="true" className="estacionalidad-nivel-0" /><span aria-hidden="true" className="estacionalidad-nivel-1" /><span aria-hidden="true" className="estacionalidad-nivel-2" /><span aria-hidden="true" className="estacionalidad-nivel-3" /><span aria-hidden="true" className="estacionalidad-nivel-4" /> Más correctivas · Deslizá para ver los doce meses.</p></>}
        tabla={<TablaEstacionalidad datos={datos} />} />}
    </BloqueDeDatos>
  </div>;
}
