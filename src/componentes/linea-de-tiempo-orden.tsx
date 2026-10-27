"use client";

import { useId } from "react";
import { etiquetaLegible, useEstadosOrden } from "@/componentes/estados-orden";
import type { FaseEstadoOrden, HistorialEstadoOrdenTrabajo, OpcionEstadoOrden } from "@/tipos/orden-trabajo";
import { formatearFechaCorta, formatearFechaHora } from "@/utilidades/fechas";

const FASES_DEL_FLUJO: FaseEstadoOrden[] = ["pendiente", "en_curso", "por_validar", "cerrada"];

export type EtapaDeLaOrden = {
  fase: FaseEstadoOrden;
  etiqueta: string;
  alcanzada: boolean;
  actual: boolean;
  /** Fecha y hora en que la orden llegó por primera vez a esta etapa. */
  desde: string | null;
  /** Horas que la orden pasó en la etapa (todas las veces que estuvo); `null` si no la alcanzó o si es la etapa final. */
  horas: number | null;
};

export type ResumenDeLaLineaDeTiempo = {
  eliminada: boolean;
  etapas: EtapaDeLaOrden[];
  pausas: { cantidad: number; horas: number; ultimoMotivo: string | null };
  devoluciones: { cantidad: number; ultimoMotivo: string | null };
};

function faseDe(catalogo: OpcionEstadoOrden[], valor: string | null) {
  return valor === null ? null : (catalogo.find((estado) => estado.valor === valor)?.fase ?? null);
}

function horasEntre(desde: string, hasta: Date) {
  return Math.max((hasta.getTime() - new Date(desde).getTime()) / 3_600_000, 0);
}

/**
 * Convierte el historial de estados en las etapas del ciclo de vida (pendiente, en curso, por validar y cerrada), con
 * cuándo se llegó a cada una y cuánto tiempo se pasó. Las pausas (cambios dentro de «en curso») y las devoluciones
 * (de revisión a pendiente) se cuentan aparte. Nunca incluye quién hizo cada cambio.
 */
export function armarLineaDeTiempo(
  historial: HistorialEstadoOrdenTrabajo[],
  catalogo: OpcionEstadoOrden[],
  ahora: Date = new Date(),
): ResumenDeLaLineaDeTiempo {
  const ordenado = [...historial].sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());
  const principalEnCurso = [...catalogo].filter((estado) => estado.fase === "en_curso").sort((a, b) => a.orden - b.orden)[0]?.valor;
  const ultimaFase = faseDe(catalogo, ordenado.at(-1)?.estado ?? null);
  const terminada = ultimaFase === "cerrada" || ultimaFase === "eliminada";

  const horasPorFase = new Map<FaseEstadoOrden, number>();
  const primeraLlegada = new Map<FaseEstadoOrden, string>();
  const pausas = { cantidad: 0, horas: 0, ultimoMotivo: null as string | null };
  const devoluciones = { cantidad: 0, ultimoMotivo: null as string | null };

  ordenado.forEach((cambio, indice) => {
    const fase = faseDe(catalogo, cambio.estado);
    if (fase === null) return;
    if (!primeraLlegada.has(fase)) primeraLlegada.set(fase, cambio.fechaHora);

    const siguiente = ordenado[indice + 1];
    const esElUltimo = siguiente === undefined;
    const horas = esElUltimo ? (terminada ? 0 : horasEntre(cambio.fechaHora, ahora)) : horasEntre(cambio.fechaHora, new Date(siguiente.fechaHora));
    horasPorFase.set(fase, (horasPorFase.get(fase) ?? 0) + horas);

    const faseAnterior = faseDe(catalogo, cambio.estadoAnterior);
    if (fase === "en_curso" && faseAnterior === "en_curso" && cambio.estado !== principalEnCurso) {
      pausas.cantidad += 1;
      pausas.horas += horas;
      pausas.ultimoMotivo = cambio.observacion;
    }
    if (faseAnterior === "por_validar" && fase === "pendiente") {
      devoluciones.cantidad += 1;
      devoluciones.ultimoMotivo = cambio.observacion;
    }
  });

  const etapas = FASES_DEL_FLUJO.map((fase): EtapaDeLaOrden => {
    const estadoDeLaFase = [...catalogo].filter((estado) => estado.fase === fase).sort((a, b) => a.orden - b.orden)[0];
    return {
      fase,
      etiqueta: estadoDeLaFase?.etiqueta ?? etiquetaLegible(fase),
      alcanzada: primeraLlegada.has(fase),
      actual: ultimaFase === fase,
      desde: primeraLlegada.get(fase) ?? null,
      horas: fase === "cerrada" || !primeraLlegada.has(fase) ? null : (horasPorFase.get(fase) ?? 0),
    };
  });

  return { eliminada: ultimaFase === "eliminada", etapas, pausas, devoluciones };
}

/** «menos de 1 h», «5 h» o «2 d 3 h». */
export function formatearDuracion(horas: number) {
  if (horas < 1) return "menos de 1 h";
  const redondeadas = Math.round(horas);
  if (redondeadas < 48) return redondeadas + " h";
  return Math.floor(redondeadas / 24) + " d " + (redondeadas % 24) + " h";
}

/** Barra de etapas de la orden: qué recorrió, dónde está, cuánto tiempo pasó en cada etapa y si hubo pausas o devoluciones. */
export function LineaDeTiempoOrden({ historial }: { historial: HistorialEstadoOrdenTrabajo[] }) {
  const catalogo = useEstadosOrden();
  const resumen = armarLineaDeTiempo(historial, catalogo);
  const total = resumen.etapas.length;
  const actual = resumen.etapas.findIndex((etapa) => etapa.actual);

  return (
    <section aria-label="Etapas de la orden" className="linea-tiempo panel">
      <ol className="linea-tiempo-pasos">
        {resumen.etapas.map((etapa, indice) => (
          <li
            aria-current={etapa.actual ? "step" : undefined}
            className={"linea-tiempo-paso" + (etapa.alcanzada ? " linea-tiempo-paso-alcanzado" : "") + (etapa.actual ? " linea-tiempo-paso-actual" : "")}
            key={etapa.fase}
          >
            <span aria-hidden="true" className="linea-tiempo-marca">{etapa.alcanzada && !etapa.actual ? "✓" : indice + 1}</span>
            <strong>{etapa.etiqueta}</strong>
            <small>
              {etapa.desde ? formatearFechaCorta(etapa.desde) : "Pendiente de llegar"}
              {etapa.horas !== null ? " · " + formatearDuracion(etapa.horas) : ""}
            </small>
            <span className="sr-only">
              {etapa.actual ? ". Etapa actual, paso " + (indice + 1) + " de " + total : etapa.alcanzada ? ". Etapa completada" : ". Etapa todavía no alcanzada"}
            </span>
          </li>
        ))}
      </ol>
      {resumen.eliminada ? (
        <p className="linea-tiempo-aviso" role="status">La orden fue eliminada: el recorrido muestra las etapas que alcanzó antes.</p>
      ) : null}
      {resumen.pausas.cantidad > 0 ? (
        <p className="linea-tiempo-aviso">
          {"En curso con " + resumen.pausas.cantidad + (resumen.pausas.cantidad === 1 ? " pausa" : " pausas") + " (" + formatearDuracion(resumen.pausas.horas) + " en total)"}
          {resumen.pausas.ultimoMotivo ? ". Último motivo: " + resumen.pausas.ultimoMotivo : ""}
        </p>
      ) : null}
      {resumen.devoluciones.cantidad > 0 ? (
        <p className="linea-tiempo-aviso">
          {"Devuelta de revisión a pendiente " + resumen.devoluciones.cantidad + (resumen.devoluciones.cantidad === 1 ? " vez" : " veces")}
          {resumen.devoluciones.ultimoMotivo ? ". Último motivo: " + resumen.devoluciones.ultimoMotivo : ""}
        </p>
      ) : null}
      {actual === -1 && !resumen.eliminada ? <p className="texto-tenue">Todavía no hay historial de estados.</p> : null}
    </section>
  );
}

const SEPARACION = 120;
const ALTO_CARRIL = 46;
const ANCHO_ETIQUETAS = 124;

/**
 * Recorrido completo de la orden como un gráfico de ramas (estilo de las aplicaciones de Git): un carril por estado,
 * un nodo por cada cambio y una flecha entre cambios sucesivos; las vueltas hacia atrás se dibujan en otro color.
 * No muestra quién hizo cada cambio.
 */
export function RecorridoDeLaOrden({ historial }: { historial: HistorialEstadoOrdenTrabajo[] }) {
  const catalogo = useEstadosOrden();
  const idMarcador = useId();
  const ordenado = [...historial].sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());
  if (ordenado.length === 0) {
    return <p className="empty-state">Todavía no hay historial de estados.</p>;
  }

  const visitados = [...new Set(ordenado.map((cambio) => cambio.estado))];
  const carriles = [...visitados].sort((a, b) => (catalogo.find((e) => e.valor === a)?.orden ?? 99) - (catalogo.find((e) => e.valor === b)?.orden ?? 99));
  const etiqueta = (valor: string) => catalogo.find((estado) => estado.valor === valor)?.etiqueta ?? etiquetaLegible(valor);
  const tono = (valor: string) => catalogo.find((estado) => estado.valor === valor)?.tono ?? "neutro";
  const ancho = ANCHO_ETIQUETAS + SEPARACION * ordenado.length;
  const alto = ALTO_CARRIL * carriles.length + 16;
  const x = (indice: number) => ANCHO_ETIQUETAS + SEPARACION * indice;
  const y = (estado: string) => 8 + ALTO_CARRIL * carriles.indexOf(estado) + ALTO_CARRIL / 2;
  const orden = (estado: string) => catalogo.find((e) => e.valor === estado)?.orden ?? 0;

  return (
    <figure className="recorrido">
      <div className="recorrido-desplazable">
        <svg aria-label="Recorrido de la orden por sus estados" height={alto} role="img" viewBox={`0 0 ${ancho} ${alto}`} width={ancho}>
          <title>Recorrido de la orden por sus estados</title>
          <defs>
            <marker id={idMarcador} markerHeight="8" markerUnits="userSpaceOnUse" markerWidth="8" orient="auto" refX="7" refY="4">
              <path d="M0,0 L8,4 L0,8 z" fill="context-stroke" />
            </marker>
          </defs>
          {carriles.map((estado) => (
            <g key={estado}>
              <line className="grafico-linea-guia" x1={ANCHO_ETIQUETAS - 20} x2={ancho - 10} y1={y(estado)} y2={y(estado)} />
              <text className="grafico-texto" textAnchor="end" x={ANCHO_ETIQUETAS - 30} y={y(estado) + 4}>{etiqueta(estado)}</text>
            </g>
          ))}
          {ordenado.slice(1).map((cambio, indice) => {
            const anterior = ordenado[indice];
            const x1 = x(indice);
            const x2 = x(indice + 1);
            const y1 = y(anterior.estado);
            const y2 = y(cambio.estado);
            const vuelta = orden(cambio.estado) < orden(anterior.estado);
            return (
              <path
                className={"recorrido-flecha" + (vuelta ? " recorrido-flecha-vuelta" : "")}
                d={`M${x1 + 9},${y1} C${x1 + SEPARACION / 2},${y1} ${x2 - SEPARACION / 2},${y2} ${x2 - 9},${y2}`}
                fill="none"
                key={indice}
                markerEnd={`url(#${idMarcador})`}
              />
            );
          })}
          {ordenado.map((cambio, indice) => {
            const anterior = ordenado[indice - 1];
            const transcurrido = anterior ? horasEntre(anterior.fechaHora, new Date(cambio.fechaHora)) : null;
            return (
              <circle
                className={"recorrido-nodo recorrido-tono-" + tono(cambio.estado)}
                cx={x(indice)}
                cy={y(cambio.estado)}
                key={indice}
                r="8"
              >
                <title>
                  {etiqueta(cambio.estado) + " · " + formatearFechaHora(cambio.fechaHora) +
                    (transcurrido === null ? "" : " · " + formatearDuracion(transcurrido) + " desde el cambio anterior") +
                    (cambio.observacion ? " · " + cambio.observacion : "")}
                </title>
              </circle>
            );
          })}
        </svg>
      </div>
      <ol className="sr-only">
        {ordenado.map((cambio, indice) => (
          <li key={indice}>
            {etiqueta(cambio.estado) + ", " + formatearFechaHora(cambio.fechaHora) + (cambio.observacion ? ", " + cambio.observacion : "")}
          </li>
        ))}
      </ol>
      <figcaption className="grafico-leyenda">
        <span><i aria-hidden="true" className="grafico-muestra grafico-muestra-linea recorrido-flecha" /> Avance</span>
        <span><i aria-hidden="true" className="grafico-muestra grafico-muestra-linea recorrido-flecha recorrido-flecha-vuelta" /> Vuelta atrás</span>
      </figcaption>
    </figure>
  );
}
