"use client";

import Link from "next/link";
import { useState } from "react";
import { ContenedorGrafico } from "@/componentes/graficos-avanzados";
import { formatearNumero } from "@/componentes/formato-numero";
import { BloqueDeDatos, useDatos } from "@/componentes/use-datos";
import { apiObtenerDemorasEtapas } from "@/servicios/api/api-demoras-etapas";
import { esEtapa } from "@/servicios/api/contrato-demoras-etapas";
import { NOMBRES_ETAPA, type EstadisticaEtapa, type EtapaDemora } from "@/tipos/demoras-etapas";
import type { FiltrosIndicadores } from "@/tipos/reporte";

const horas = (valor: number | null) => valor === null ? "Sin dato" : formatearNumero(valor) + " h";
const AYUDA = "Suma los tramos del historial de cada orden en esta etapa, incluidas las visitas repetidas. Pendiente, progreso, revisión y pausa se cuentan por separado: la pausa no se suma a progreso. El promedio (media) suma los tiempos y divide por las órdenes; la mediana es su valor central. La referencia es el umbral del administrador o el promedio histórico de todas las órdenes que ya terminaron esta etapa, sin los filtros del período. Una etapa todavía en curso cuenta hasta la hora de consulta y no forma parte de esa referencia histórica. Se marca demora solo si supera la referencia; mostrar la mediana no cambia ese criterio. Si no hay umbral ni historia, no se clasifica la demora.";

function GraficaDeEtapa({ datos }: { datos: EstadisticaEtapa }) {
  const maximo = Math.max(1, datos.promedioHoras ?? 0, datos.medianaHoras ?? 0, datos.umbralHoras ?? 0);
  return datos.cantidadOrdenes === 0 ? <p>No hay tiempos registrados en esta etapa con los filtros elegidos.</p> : (
    <svg aria-label={datos.nombre + ": media " + horas(datos.promedioHoras) + ", mediana " + horas(datos.medianaHoras) + ", referencia " + horas(datos.umbralHoras)} className="demoras-etapa-grafica" role="img" viewBox="0 0 500 110">
      <text x="0" y="24">Media</text><text x="0" y="74">Mediana</text>
      <rect className="demoras-media" x="100" y="8" height="24" width={(datos.promedioHoras ?? 0) / maximo * 380} />
      <rect className="demoras-mediana" x="100" y="58" height="24" width={(datos.medianaHoras ?? 0) / maximo * 380} />
      {datos.umbralHoras !== null ? <line className="demoras-referencia" x1={100 + datos.umbralHoras / maximo * 380} x2={100 + datos.umbralHoras / maximo * 380} y1="0" y2="100" /> : null}
    </svg>
  );
}

export function ResumenDeEtapa({ datos }: { datos: EstadisticaEtapa }) {
  return (
    <ContenedorGrafico titulo={datos.nombre} ayuda={AYUDA}
      descripcion={datos.cantidadOrdenes + " órdenes · " + datos.demoradas + " demoradas"}
      grafico={<><p>Media: <strong>{horas(datos.promedioHoras)}</strong> · Mediana: <strong>{horas(datos.medianaHoras)}</strong></p>
        <GraficaDeEtapa datos={datos} />
        <p>Referencia (línea): <strong>{horas(datos.umbralHoras)}</strong> · {datos.origenUmbral === "configurado" ? "Configurada por el administrador" : datos.origenUmbral === "historico" ? "Promedio histórico" : "Sin referencia disponible"}</p>
        <p className="texto-tenue">{datos.muestraHistorica} órdenes con esta etapa terminada en el historial. P90 del período: {horas(datos.percentil90Horas)}.</p></>}
      tabla={<table className="tabla-grafico"><caption className="sr-only">Tiempos de {datos.nombre}</caption>
        <thead><tr><th>Medida</th><th>Horas</th></tr></thead><tbody>
          <tr><td>Media (promedio)</td><td>{horas(datos.promedioHoras)}</td></tr>
          <tr><td>Mediana</td><td>{horas(datos.medianaHoras)}</td></tr>
          <tr><td>P90</td><td>{horas(datos.percentil90Horas)}</td></tr>
          <tr><td>Referencia</td><td>{horas(datos.umbralHoras)}</td></tr>
        </tbody></table>} />
  );
}

export function DemorasPorEtapa({ filtros }: { filtros: FiltrosIndicadores }) {
  const [pagina, setPagina] = useState(1);
  const [etapa, setEtapa] = useState<EtapaDemora | "">("");
  const consulta = useDatos(() => apiObtenerDemorasEtapas(filtros, pagina, etapa), JSON.stringify([filtros, pagina, etapa]));
  return (
    <section aria-label="Demoras por etapa" className="demoras-etapas">
      <h3>Demoras por etapa</h3>
      <p className="texto-tenue">Tiempo acumulado en cada etapa, con media y mediana. Los tiempos abiertos siguen corriendo; las pausas se cuentan aparte.</p>
      <BloqueDeDatos cargando="Cargando las demoras por etapa…" {...consulta}>
        {(datos) => <>
          <div className="seccion-grilla">{datos.etapas.map(item => <ResumenDeEtapa datos={item} key={item.etapa} />)}</div>
          <div className="form-field"><label htmlFor="etapa-demoradas">Etapa de las órdenes demoradas</label>
            <select id="etapa-demoradas" value={etapa} onChange={evento => { const valor = evento.target.value; if (valor === "" || esEtapa(valor)) { setEtapa(valor); setPagina(1); } }}>
              <option value="">Todas las etapas</option>{Object.entries(NOMBRES_ETAPA).map(([codigo, nombre]) => <option key={codigo} value={codigo}>{nombre}</option>)}
            </select></div>
          <p>{datos.demoradas.totalElementos} demoras por orden y etapa. Una orden puede aparecer en más de una etapa.</p>
          {datos.demoradas.elementos.length === 0 ? <p>No hay órdenes demoradas en esta página con la referencia disponible.</p> : <div className="table-container"><table className="tabla-grafico">
            <caption className="sr-only">Órdenes demoradas por etapa</caption>
            <thead><tr><th>Orden</th><th>Activo</th><th>Etapa</th><th>Tiempo</th><th>Referencia</th><th>Exceso</th><th>Situación</th></tr></thead>
            <tbody>{datos.demoradas.elementos.map(item => <tr key={item.ordenId + "-" + item.etapa}>
              <td><Link className="text-link" href={"/ordenes-trabajo/" + item.ordenId}>Orden {item.ordenId}</Link></td>
              <td>{item.nombreActivo}</td><td>{NOMBRES_ETAPA[item.etapa]}</td><td>{horas(item.horas)}</td><td>{horas(item.umbralHoras)}</td><td>{horas(item.excesoHoras)}</td><td>{item.enCurso ? "En curso" : "Terminada"}</td>
            </tr>)}</tbody>
          </table></div>}
          <nav aria-label="Páginas de órdenes demoradas" className="form-actions">
            <button className="secondary-button" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)} type="button">Página anterior</button>
            <span>Página {pagina} de {Math.max(1, datos.demoradas.totalPaginas)}</span>
            <button className="secondary-button" disabled={pagina >= datos.demoradas.totalPaginas} onClick={() => setPagina(pagina + 1)} type="button">Página siguiente</button>
          </nav>
        </>}
      </BloqueDeDatos>
    </section>
  );
}
