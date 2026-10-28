"use client";

import Link from "next/link";
import { BloqueDeDatos, useDatos } from "@/componentes/use-datos";
import { formatearNumero } from "@/componentes/formato-numero";
import { ContenedorGrafico } from "@/componentes/graficos-avanzados";
import { apiObtenerDesgasteEdadUso } from "@/servicios/api/api-desgaste-edad-uso";
import type { ActivoEdadUso, DesgasteEdadUso } from "@/tipos/desgaste-edad-uso";
import type { FiltrosIndicadores } from "@/tipos/reporte";

type Punto = { activo: ActivoEdadUso; x: number };

function GraficoDispersion({ puntos, titulo, unidad }: { puntos: Punto[]; titulo: string; unidad: string }) {
  if (puntos.length === 0) return <p className="empty-state">No hay activos con este dato en el período.</p>;
  const ancho = 640, alto = 260, izquierda = 48, derecha = 16, arriba = 16, abajo = 42;
  const maximoX = Math.max(1, ...puntos.map(punto => punto.x));
  const maximoY = Math.max(1, ...puntos.map(punto => punto.activo.correctivas));
  const x = (valor: number) => izquierda + (ancho - izquierda - derecha) * valor / maximoX;
  const y = (valor: number) => alto - abajo - (alto - arriba - abajo) * valor / maximoY;
  return <figure className="grafico-figura grafico-dispersion-edad-uso">
    <svg aria-label={titulo} role="img" viewBox={`0 0 ${ancho} ${alto}`}>
      <title>{titulo}</title>
      {[0, 0.5, 1].map(fraccion => <g key={fraccion}>
        <line className="grafico-linea-guia" x1={izquierda} x2={ancho - derecha} y1={y(maximoY * fraccion)} y2={y(maximoY * fraccion)} />
        <text className="grafico-texto" textAnchor="end" x={izquierda - 6} y={y(maximoY * fraccion) + 4}>{formatearNumero(maximoY * fraccion)}</text>
      </g>)}
      <line className="grafico-linea-guia" x1={izquierda} x2={izquierda} y1={arriba} y2={alto - abajo} />
      <line className="grafico-linea-guia" x1={izquierda} x2={ancho - derecha} y1={alto - abajo} y2={alto - abajo} />
      <text className="grafico-texto" textAnchor="middle" x={(izquierda + ancho - derecha) / 2} y={alto - 8}>{unidad}</text>
      <text className="grafico-texto" textAnchor="start" x={izquierda} y={alto - abajo + 18}>0</text>
      <text className="grafico-texto" textAnchor="end" x={ancho - derecha} y={alto - abajo + 18}>{formatearNumero(maximoX)}</text>
      {puntos.map(({ activo, x: valor }) => <circle className="grafico-punto-edad-uso" cx={x(valor)} cy={y(activo.correctivas)}
        key={activo.activoId} r={4.5}>
        <title>{activo.nombreActivo}: {formatearNumero(valor)} {unidad.toLowerCase()}, edad {formatearNumero(activo.edadAnios)} años, uso {formatearNumero(activo.lecturaUso)} {activo.unidadUso === "horas" ? "h" : "km"}, {activo.correctivas} correctivas</title>
      </circle>)}
    </svg>
    <figcaption className="texto-tenue">Cada punto representa un activo observado. Eje vertical: correctivas del período.</figcaption>
  </figure>;
}

function TablaActivos({ activos, medida }: { activos: ActivoEdadUso[]; medida: "edad" | "horas" | "kilometros" }) {
  const presentes = activos.filter(activo => medida === "edad" ? activo.edadAnios !== null :
    activo.unidadUso === medida && activo.lecturaUso !== null);
  return presentes.length === 0 ? <p className="empty-state">No hay activos con este dato en el período.</p> :
    <table className="tabla-grafico">
      <caption className="sr-only">Activos, edad o uso y correctivas</caption>
      <thead><tr><th>Activo</th><th>Modelo</th><th className="celda-numerica">Edad (años)</th>
        <th className="celda-numerica">Uso registrado</th><th>Fecha de lectura</th>
        <th className="celda-numerica">Correctivas</th><th className="celda-numerica">Órdenes observadas</th></tr></thead>
      <tbody>{presentes.map(activo => <tr key={activo.activoId}>
        <td><Link className="text-link" href={"/activos/" + activo.activoId}>{activo.nombreActivo}</Link></td>
        <td>{activo.modelo}</td>
        <td className="celda-numerica">{formatearNumero(activo.edadAnios)}</td>
        <td className="celda-numerica">{formatearNumero(activo.lecturaUso)} {activo.lecturaUso === null ? "" : activo.unidadUso === "horas" ? "h" : "km"}</td>
        <td>{activo.fechaLectura?.slice(0, 10) ?? "Sin dato"}</td>
        <td className="celda-numerica">{activo.correctivas}</td>
        <td className="celda-numerica">{activo.ordenesObservadas}</td>
      </tr>)}</tbody>
    </table>;
}

function Panel({ datos }: { datos: DesgasteEdadUso }) {
  const graficas: Array<{ medida: "edad" | "horas" | "kilometros"; titulo: string; unidad: string }> = [
    { medida: "edad", titulo: "Correctivas frente a edad de la máquina", unidad: "Años de edad" },
    { medida: "horas", titulo: "Correctivas frente a horas de uso", unidad: "Horas de uso" },
    { medida: "kilometros", titulo: "Correctivas frente a kilómetros de uso", unidad: "Kilómetros de uso" },
  ];
  return <div className="grid gap-4">
    <p className="texto-tenue">{datos.totalActivos} activos con órdenes en el período; {datos.conEdad} con edad y {datos.conUso} con lectura de uso. Los demás figuran sin dato.</p>
    {graficas.map(({ medida, titulo, unidad }) => {
      const puntos = datos.activos.flatMap(activo => {
        const valor = medida === "edad" ? activo.edadAnios :
          activo.unidadUso === medida ? activo.lecturaUso : null;
        return valor === null ? [] : [{ activo, x: valor }];
      });
      return <ContenedorGrafico key={medida} titulo={titulo}
        descripcion={medida === "edad" ? "Compara máquinas observadas según su año de fabricación." :
          "Compara correctivas con la última lectura conocida, sin mezclar unidades."}
        ayuda="Cada activo con al menos una orden en el período aporta un punto. Las correctivas se cuentan por fecha UTC de creación dentro de los filtros. La edad se calcula en años a la fecha de su última orden del período. El uso es la última lectura registrada hasta esa orden, incluso si se cargó antes del período. Una lectura faltante no se estima. Los conteos no son tasas: no se conoce la exposición completa de cada máquina, por lo que una relación visual no prueba que la edad o el uso causen fallas."
        grafico={<GraficoDispersion puntos={puntos} titulo={titulo} unidad={unidad} />}
        tabla={<TablaActivos activos={datos.activos} medida={medida} />} />;
    })}
  </div>;
}

export function DesgasteEdadUso({ filtros }: { filtros: FiltrosIndicadores }) {
  const clave = JSON.stringify(filtros);
  const consulta = useDatos(() => apiObtenerDesgasteEdadUso(filtros), clave);
  return <BloqueDeDatos cargando="Cargando desgaste por edad y uso…" {...consulta}>
    {datos => <Panel datos={datos} />}
  </BloqueDeDatos>;
}
