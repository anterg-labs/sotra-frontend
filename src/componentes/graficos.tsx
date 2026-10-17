import type { PuntoTendencia } from "@/tipos/reporte";

export type DatoBarra = {
  etiqueta: string;
  valor: number;
  /** Texto del valor; si falta se muestra el número. */
  valorTexto?: string;
  detalle?: string;
};

type PropiedadesGraficoBarras = {
  datos: DatoBarra[];
  vacio?: string;
};

/**
 * Ranking en barras horizontales. Cada fila trae su valor como texto, así que se lee igual con un lector de
 * pantalla y no depende del color ni del tamaño de la barra.
 */
export function GraficoBarras({ datos, vacio = "No hay datos para mostrar." }: PropiedadesGraficoBarras) {
  if (datos.length === 0) {
    return <p className="empty-state">{vacio}</p>;
  }

  const maximo = Math.max(...datos.map((dato) => dato.valor), 1);
  return (
    <ol className="grafico-barras">
      {datos.map((dato) => (
        <li key={dato.etiqueta}>
          <span className="grafico-barras-etiqueta">
            {dato.etiqueta}
            {dato.detalle ? <small>{dato.detalle}</small> : null}
          </span>
          <span aria-hidden="true" className="grafico-barras-pista">
            <span style={{ width: Math.max((dato.valor / maximo) * 100, dato.valor > 0 ? 2 : 0) + "%" }} />
          </span>
          <strong className="grafico-barras-valor">{dato.valorTexto ?? dato.valor}</strong>
        </li>
      ))}
    </ol>
  );
}

type PropiedadesGraficoTendencia = {
  puntos: PuntoTendencia[];
  titulo: string;
  formatearPeriodo?: (periodo: string) => string;
};

const ANCHO = 640;
const ALTO = 220;
const MARGEN = { arriba: 12, derecha: 8, abajo: 28, izquierda: 32 };

function formatearPeriodoPorDefecto(periodo: string) {
  const [, mes, dia] = periodo.split("-");
  return dia + "/" + mes;
}

/** Columnas apiladas (preventivas y correctivas) por período, con una tabla equivalente para lectores de pantalla. */
export function GraficoTendencia({ puntos, titulo, formatearPeriodo = formatearPeriodoPorDefecto }: PropiedadesGraficoTendencia) {
  if (puntos.length === 0) {
    return <p className="empty-state">No hay órdenes en el período.</p>;
  }

  const maximo = Math.max(...puntos.map((punto) => punto.total), 1);
  const areaAncho = ANCHO - MARGEN.izquierda - MARGEN.derecha;
  const areaAlto = ALTO - MARGEN.arriba - MARGEN.abajo;
  const paso = areaAncho / puntos.length;
  const anchoColumna = Math.min(paso * 0.64, 36);
  const altura = (valor: number) => (valor / maximo) * areaAlto;
  const cadaCuantas = Math.ceil(puntos.length / 10);

  return (
    <figure className="grafico-tendencia">
      <svg aria-label={titulo} role="img" viewBox={`0 0 ${ANCHO} ${ALTO}`}>
        <title>{titulo}</title>
        {[0, 0.5, 1].map((fraccion) => {
          const y = MARGEN.arriba + areaAlto - areaAlto * fraccion;
          return (
            <g key={fraccion}>
              <line className="grafico-linea-guia" x1={MARGEN.izquierda} x2={ANCHO - MARGEN.derecha} y1={y} y2={y} />
              <text className="grafico-texto" textAnchor="end" x={MARGEN.izquierda - 6} y={y + 4}>
                {Math.round(maximo * fraccion)}
              </text>
            </g>
          );
        })}
        {puntos.map((punto, indice) => {
          const x = MARGEN.izquierda + paso * indice + (paso - anchoColumna) / 2;
          const altoCorrectivas = altura(punto.correctivas);
          const altoPreventivas = altura(punto.preventivas);
          const base = MARGEN.arriba + areaAlto;
          return (
            <g key={punto.periodo}>
              <rect className="grafico-serie-correctivas" height={altoCorrectivas} width={anchoColumna} x={x} y={base - altoCorrectivas} />
              <rect
                className="grafico-serie-preventivas"
                height={altoPreventivas}
                width={anchoColumna}
                x={x}
                y={base - altoCorrectivas - altoPreventivas}
              />
              {indice % cadaCuantas === 0 ? (
                <text className="grafico-texto" textAnchor="middle" x={x + anchoColumna / 2} y={ALTO - 8}>
                  {formatearPeriodo(punto.periodo)}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      <figcaption className="grafico-leyenda">
        <span><i className="grafico-muestra grafico-serie-correctivas" aria-hidden="true" /> Correctivas</span>
        <span><i className="grafico-muestra grafico-serie-preventivas" aria-hidden="true" /> Preventivas</span>
      </figcaption>
      <table className="sr-only">
        <caption>{titulo}</caption>
        <thead>
          <tr><th>Período</th><th>Preventivas</th><th>Correctivas</th><th>Total</th></tr>
        </thead>
        <tbody>
          {puntos.map((punto) => (
            <tr key={punto.periodo}>
              <td>{punto.periodo}</td><td>{punto.preventivas}</td><td>{punto.correctivas}</td><td>{punto.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
