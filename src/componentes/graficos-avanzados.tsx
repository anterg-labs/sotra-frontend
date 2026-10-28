"use client";

import { useId, useState, type ReactNode } from "react";

import { formatearNumero } from "./formato-numero";

/** Tope «redondo» del eje para que las guías caigan en números fáciles de leer. */
function topeDelEje(maximo: number) {
  if (maximo <= 0) return 1;
  const magnitud = 10 ** Math.floor(Math.log10(maximo));
  const fraccion = maximo / magnitud;
  const tope = fraccion <= 1 ? 1 : fraccion <= 2 ? 2 : fraccion <= 5 ? 5 : 10;
  return tope * magnitud;
}

type PropiedadesContenedor = {
  titulo: string;
  /** Una línea que dice qué se ve o qué conclusión sacar. */
  descripcion?: string;
  /** Cómo se calcula, para quien quiera saberlo. */
  ayuda?: string;
  grafico: ReactNode;
  /** Los mismos datos como tabla: alternativa para lectores de pantalla y para quien prefiera leer las cifras. */
  tabla: ReactNode;
};

/** Contenedor común de las gráficas: título, descripción, ayuda y el cambio entre gráfica y tabla. */
export function ContenedorGrafico({ titulo, descripcion, ayuda, grafico, tabla }: PropiedadesContenedor) {
  const [verTabla, setVerTabla] = useState(false);
  const idTabla = useId();
  return (
    <section aria-label={titulo} className="grafico-contenedor">
      <header className="grafico-encabezado">
        <div>
          <h3>{titulo}</h3>
          {descripcion ? <p className="texto-tenue">{descripcion}</p> : null}
        </div>
        <button aria-controls={idTabla} aria-pressed={verTabla} className="boton-texto" onClick={() => setVerTabla((valor) => !valor)} type="button">
          {verTabla ? "Ver gráfica" : "Ver como tabla"}
        </button>
      </header>
      <div hidden={verTabla}>{grafico}</div>
      <div hidden={!verTabla} id={idTabla}>
        {tabla}
      </div>
      {ayuda ? (
        <details className="grafico-ayuda">
          <summary>Cómo se calcula</summary>
          <p>{ayuda}</p>
        </details>
      ) : null}
    </section>
  );
}

type PropiedadesSparkline = {
  valores: (number | null)[];
  titulo: string;
  /** Clase de color de la línea (`grafico-tono-bueno`, `grafico-tono-malo` o `grafico-tono-neutro`). */
  tono?: string;
};

/** Mini línea de tendencia de una tarjeta: sin ejes, con el último punto marcado. Los meses sin datos cortan la línea. */
export function Sparkline({ valores, titulo, tono = "grafico-tono-neutro" }: PropiedadesSparkline) {
  const ancho = 120;
  const alto = 32;
  const margen = 3;
  const presentes = valores.filter((valor): valor is number => valor !== null);
  if (presentes.length < 2) {
    return <span className="sparkline-vacia">Sin tendencia</span>;
  }

  const minimo = Math.min(...presentes);
  const maximo = Math.max(...presentes);
  const rango = maximo - minimo || 1;
  const paso = (ancho - margen * 2) / Math.max(valores.length - 1, 1);
  const puntos = valores.map((valor, indice) =>
    valor === null ? null : { x: margen + paso * indice, y: margen + (alto - margen * 2) * (1 - (valor - minimo) / rango) },
  );

  const tramos: string[] = [];
  let actual: string[] = [];
  for (const punto of puntos) {
    if (punto === null) {
      if (actual.length > 0) tramos.push(actual.join(" "));
      actual = [];
    } else {
      actual.push(punto.x.toFixed(1) + "," + punto.y.toFixed(1));
    }
  }
  if (actual.length > 0) tramos.push(actual.join(" "));
  const ultimo = [...puntos].reverse().find((punto) => punto !== null);

  return (
    <svg aria-label={titulo} className={"sparkline " + tono} role="img" viewBox={`0 0 ${ancho} ${alto}`}>
      <title>{titulo}</title>
      {tramos.map((tramo) => (
        <polyline fill="none" key={tramo} points={tramo} />
      ))}
      {ultimo ? <circle cx={ultimo.x} cy={ultimo.y} r="2.6" /> : null}
    </svg>
  );
}

type SerieDeLineas = { nombre: string; clase: string; valores: number[] };

type PropiedadesLineas = {
  etiquetas: string[];
  series: SerieDeLineas[];
  titulo: string;
};

const ANCHO = 640;
const ALTO = 220;
const MARGEN = { arriba: 14, derecha: 12, abajo: 28, izquierda: 36 };

/** Líneas de varias series sobre las mismas etiquetas (por ejemplo órdenes creadas frente a cerradas). */
export function GraficoLineas({ etiquetas, series, titulo }: PropiedadesLineas) {
  if (etiquetas.length === 0) {
    return <p className="empty-state">No hay datos en el período.</p>;
  }

  const maximo = topeDelEje(Math.max(...series.flatMap((serie) => serie.valores), 1));
  const areaAncho = ANCHO - MARGEN.izquierda - MARGEN.derecha;
  const areaAlto = ALTO - MARGEN.arriba - MARGEN.abajo;
  const paso = etiquetas.length > 1 ? areaAncho / (etiquetas.length - 1) : 0;
  const x = (indice: number) => MARGEN.izquierda + (etiquetas.length > 1 ? paso * indice : areaAncho / 2);
  const y = (valor: number) => MARGEN.arriba + areaAlto * (1 - valor / maximo);
  const cadaCuantas = Math.ceil(etiquetas.length / 8);

  return (
    <figure className="grafico-figura">
      <svg aria-label={titulo} role="img" viewBox={`0 0 ${ANCHO} ${ALTO}`}>
        <title>{titulo}</title>
        {[0, 0.5, 1].map((fraccion) => (
          <g key={fraccion}>
            <line className="grafico-linea-guia" x1={MARGEN.izquierda} x2={ANCHO - MARGEN.derecha} y1={y(maximo * fraccion)} y2={y(maximo * fraccion)} />
            <text className="grafico-texto" textAnchor="end" x={MARGEN.izquierda - 6} y={y(maximo * fraccion) + 4}>
              {formatearNumero(maximo * fraccion)}
            </text>
          </g>
        ))}
        {series.map((serie) => (
          <g className={serie.clase} key={serie.nombre}>
            <polyline fill="none" points={serie.valores.map((valor, indice) => x(indice).toFixed(1) + "," + y(valor).toFixed(1)).join(" ")} />
            {serie.valores.map((valor, indice) => (
              <circle cx={x(indice)} cy={y(valor)} key={indice} r="3">
                <title>{serie.nombre + ": " + formatearNumero(valor) + " (" + etiquetas[indice] + ")"}</title>
              </circle>
            ))}
          </g>
        ))}
        {etiquetas.map((etiqueta, indice) =>
          indice % cadaCuantas === 0 ? (
            <text className="grafico-texto" key={etiqueta} textAnchor="middle" x={x(indice)} y={ALTO - 8}>
              {etiqueta}
            </text>
          ) : null,
        )}
      </svg>
      <figcaption className="grafico-leyenda">
        {series.map((serie) => (
          <span className={serie.clase} key={serie.nombre}>
            <i aria-hidden="true" className="grafico-muestra grafico-muestra-linea" /> {serie.nombre}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

export type DatoPareto = { etiqueta: string; valor: number; acumulado: number | null };

/** Pareto: barras ordenadas de mayor a menor y la línea del porcentaje acumulado con la referencia del 80 %. */
export function GraficoPareto({ datos, titulo, unidad }: { datos: DatoPareto[]; titulo: string; unidad: string }) {
  if (datos.length === 0) {
    return <p className="empty-state">No hay datos en el período.</p>;
  }

  const maximo = topeDelEje(Math.max(...datos.map((dato) => dato.valor), 1));
  const areaAncho = ANCHO - MARGEN.izquierda - 40;
  const areaAlto = ALTO - MARGEN.arriba - MARGEN.abajo;
  const paso = areaAncho / datos.length;
  const ancho = Math.min(paso * 0.62, 44);
  const yBarra = (valor: number) => MARGEN.arriba + areaAlto * (1 - valor / maximo);
  const yAcumulado = (porcentaje: number) => MARGEN.arriba + areaAlto * (1 - porcentaje / 100);
  const centro = (indice: number) => MARGEN.izquierda + paso * indice + paso / 2;
  const linea = datos
    .map((dato, indice) => (dato.acumulado === null ? null : centro(indice).toFixed(1) + "," + yAcumulado(dato.acumulado).toFixed(1)))
    .filter((punto): punto is string => punto !== null)
    .join(" ");

  return (
    <figure className="grafico-figura">
      <svg aria-label={titulo} role="img" viewBox={`0 0 ${ANCHO} ${ALTO}`}>
        <title>{titulo}</title>
        {[0, 0.5, 1].map((fraccion) => (
          <g key={fraccion}>
            <line className="grafico-linea-guia" x1={MARGEN.izquierda} x2={MARGEN.izquierda + areaAncho} y1={yBarra(maximo * fraccion)} y2={yBarra(maximo * fraccion)} />
            <text className="grafico-texto" textAnchor="end" x={MARGEN.izquierda - 6} y={yBarra(maximo * fraccion) + 4}>
              {formatearNumero(maximo * fraccion)}
            </text>
            <text className="grafico-texto" x={MARGEN.izquierda + areaAncho + 6} y={yAcumulado(100 * fraccion) + 4}>
              {Math.round(100 * fraccion)}%
            </text>
          </g>
        ))}
        <line className="grafico-referencia" x1={MARGEN.izquierda} x2={MARGEN.izquierda + areaAncho} y1={yAcumulado(80)} y2={yAcumulado(80)} />
        {datos.map((dato, indice) => (
          <rect className="grafico-barra-principal" height={Math.max(areaAlto * (dato.valor / maximo), dato.valor > 0 ? 1 : 0)} key={dato.etiqueta} rx="2"
            width={ancho} x={centro(indice) - ancho / 2} y={yBarra(dato.valor)}>
            <title>{dato.etiqueta + ": " + formatearNumero(dato.valor) + " " + unidad + (dato.acumulado === null ? "" : " (acumulado " + formatearNumero(dato.acumulado) + "%)")}</title>
          </rect>
        ))}
        {linea ? <polyline className="grafico-linea-acumulada" fill="none" points={linea} /> : null}
        {datos.map((dato, indice) => (
          <text className="grafico-texto" key={dato.etiqueta} textAnchor="middle" x={centro(indice)} y={ALTO - 8}>
            {dato.etiqueta.length > 9 ? dato.etiqueta.slice(0, 8) + "…" : dato.etiqueta}
          </text>
        ))}
      </svg>
      <figcaption className="grafico-leyenda">
        <span><i aria-hidden="true" className="grafico-muestra grafico-barra-principal" /> {unidad}</span>
        <span><i aria-hidden="true" className="grafico-muestra grafico-muestra-linea grafico-linea-acumulada" /> Porcentaje acumulado</span>
        <span><i aria-hidden="true" className="grafico-muestra grafico-muestra-referencia" /> 80 %</span>
      </figcaption>
    </figure>
  );
}

export type DatoColumna = { etiqueta: string; valor: number; severidad?: "normal" | "atencion" | "critico" };

/** Columnas con el valor escrito encima; la severidad pinta cada columna (de normal a crítico). */
export function GraficoColumnas({ datos, titulo, unidad }: { datos: DatoColumna[]; titulo: string; unidad: string }) {
  if (datos.length === 0 || datos.every((dato) => dato.valor === 0)) {
    return <p className="empty-state">No hay datos en el período.</p>;
  }

  const maximo = Math.max(...datos.map((dato) => dato.valor), 1);
  const areaAncho = ANCHO - MARGEN.izquierda - MARGEN.derecha;
  const areaAlto = ALTO - MARGEN.arriba - MARGEN.abajo - 12;
  const paso = areaAncho / datos.length;
  const ancho = Math.min(paso * 0.6, 72);
  const base = MARGEN.arriba + 12 + areaAlto;

  return (
    <figure className="grafico-figura">
      <svg aria-label={titulo} role="img" viewBox={`0 0 ${ANCHO} ${ALTO}`}>
        <title>{titulo}</title>
        <line className="grafico-linea-guia" x1={MARGEN.izquierda} x2={ANCHO - MARGEN.derecha} y1={base} y2={base} />
        {datos.map((dato, indice) => {
          const alto = Math.max(areaAlto * (dato.valor / maximo), dato.valor > 0 ? 2 : 0);
          const centro = MARGEN.izquierda + paso * indice + paso / 2;
          return (
            <g key={dato.etiqueta}>
              <rect className={"grafico-columna grafico-severidad-" + (dato.severidad ?? "normal")} height={alto} rx="3" width={ancho} x={centro - ancho / 2} y={base - alto}>
                <title>{dato.etiqueta + ": " + formatearNumero(dato.valor) + " " + unidad}</title>
              </rect>
              <text className="grafico-valor" textAnchor="middle" x={centro} y={base - alto - 5}>{formatearNumero(dato.valor)}</text>
              <text className="grafico-texto" textAnchor="middle" x={centro} y={ALTO - 8}>{dato.etiqueta}</text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

/** Serie corta de intervalos (por ejemplo días entre correctivas) como columnas pequeñas, sin ejes. */
export function MiniColumnas({ valores, titulo, tono = "grafico-tono-neutro" }: { valores: number[]; titulo: string; tono?: string }) {
  if (valores.length === 0) {
    return <span className="sparkline-vacia">Sin datos</span>;
  }

  const ancho = 120;
  const alto = 32;
  const maximo = Math.max(...valores, 1);
  const paso = ancho / valores.length;
  return (
    <svg aria-label={titulo} className={"sparkline " + tono} role="img" viewBox={`0 0 ${ancho} ${alto}`}>
      <title>{titulo}</title>
      {valores.map((valor, indice) => {
        const altura = Math.max((valor / maximo) * (alto - 4), 1);
        return <rect height={altura} key={indice} width={Math.max(paso - 2, 1)} x={paso * indice + 1} y={alto - altura} />;
      })}
    </svg>
  );
}
