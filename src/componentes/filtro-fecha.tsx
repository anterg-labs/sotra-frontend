"use client";

import { useEffect, useId, useRef, useState } from "react";
import { DIAS_DE_LA_SEMANA, mesDeHoy, nombreDelMes, semanasDelMes, sumarMeses } from "@/utilidades/calendario";

type PropiedadesFiltroFecha = {
  id: string;
  etiqueta: string;
  /** Se conserva por compatibilidad con quienes lo pasaban; el selector de rango ya no tiene un segundo campo. */
  etiquetaFin?: string;
  fechaDesde: string;
  fechaHasta: string;
  alCambiar: (fechaDesde: string, fechaHasta: string) => void;
};

export function rangoDeFechasInvalido(fechaDesde: string, fechaHasta: string) {
  return fechaDesde !== "" && fechaHasta !== "" && fechaHasta < fechaDesde;
}

function aIso(fecha: Date) {
  return fecha.getFullYear() + "-" + String(fecha.getMonth() + 1).padStart(2, "0") + "-" + String(fecha.getDate()).padStart(2, "0");
}

function sumarDias(iso: string, dias: number) {
  const [anio, mes, dia] = iso.split("-").map(Number);
  return aIso(new Date(anio, mes - 1, dia + dias));
}

/** «15/10/2026». */
export function formatearFechaCorta(iso: string) {
  const [anio, mes, dia] = iso.split("-");
  return dia + "/" + mes + "/" + anio;
}

function describir(desde: string, hasta: string) {
  if (desde === "") return "Cualquier fecha";
  if (hasta === "" || hasta === desde) return formatearFechaCorta(desde);
  return formatearFechaCorta(desde) + " – " + formatearFechaCorta(hasta);
}

const FORMATO_DIA = new Intl.DateTimeFormat("es-UY", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

function nombreDelDia(iso: string) {
  return FORMATO_DIA.format(new Date(iso + "T00:00:00Z"));
}

function atajos(hoy: string) {
  const [anio, mes] = hoy.split("-").map(Number);
  const primeroDelMes = hoy.slice(0, 8) + "01";
  const ultimoMesPasado = sumarDias(primeroDelMes, -1);
  return [
    { etiqueta: "Hoy", desde: hoy, hasta: hoy },
    { etiqueta: "Ayer", desde: sumarDias(hoy, -1), hasta: sumarDias(hoy, -1) },
    { etiqueta: "Últimos 7 días", desde: sumarDias(hoy, -6), hasta: hoy },
    { etiqueta: "Últimos 30 días", desde: sumarDias(hoy, -29), hasta: hoy },
    { etiqueta: "Este mes", desde: primeroDelMes, hasta: hoy },
    { etiqueta: "Mes pasado", desde: ultimoMesPasado.slice(0, 8) + "01", hasta: ultimoMesPasado },
    { etiqueta: "Este año", desde: anio + "-01-01", hasta: hoy },
    { etiqueta: "Últimos 90 días", desde: sumarDias(hoy, -89), hasta: hoy },
  ].filter((atajo) => mes > 0 && atajo.desde <= atajo.hasta);
}

function Mes({ mes, desde, hasta, hoy, alElegir }: { mes: string; desde: string; hasta: string; hoy: string; alElegir: (dia: string) => void }) {
  return (
    <table className="rango-mes">
      <caption>{nombreDelMes(mes)}</caption>
      <thead>
        <tr>{DIAS_DE_LA_SEMANA.map((dia) => <th key={dia} scope="col">{dia}</th>)}</tr>
      </thead>
      <tbody>
        {semanasDelMes(mes).map((semana, indice) => (
          <tr key={indice}>
            {semana.map((dia, columna) => {
              if (dia === null) return <td key={columna} />;
              const esExtremo = dia === desde || dia === (hasta || desde);
              const estaEnRango = desde !== "" && dia >= desde && dia <= (hasta || desde);
              return (
                <td key={dia}>
                  <button
                    aria-label={nombreDelDia(dia)}
                    aria-pressed={estaEnRango}
                    className={"rango-dia" + (estaEnRango ? " rango-dia-en-rango" : "") + (esExtremo ? " rango-dia-extremo" : "") + (dia === hoy ? " rango-dia-hoy" : "")}
                    onClick={() => alElegir(dia)}
                    type="button"
                  >
                    {Number(dia.slice(8))}
                  </button>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Selector de fecha o de rango en un solo control: abre un panel con dos meses y atajos. Un clic elige un día fijo
 * (se envía como desde y hasta iguales, que la API toma ambos incluidos) y un segundo clic lo convierte en rango.
 */
export function FiltroFecha(props: PropiedadesFiltroFecha) {
  const { id, etiqueta, fechaDesde, fechaHasta, alCambiar } = props;
  const [abierto, setAbierto] = useState(false);
  const [mesVisible, setMesVisible] = useState(() => (fechaDesde !== "" ? fechaDesde.slice(0, 7) : mesDeHoy()));
  const [ancla, setAncla] = useState<string | null>(null);
  const contenedor = useRef<HTMLDivElement>(null);
  const idPanel = useId();
  const hoy = aIso(new Date());
  const descripcion = describir(fechaDesde, fechaHasta);

  useEffect(() => {
    if (!abierto) return;
    function alPresionar(evento: MouseEvent) {
      if (contenedor.current && !contenedor.current.contains(evento.target as Node)) setAbierto(false);
    }
    function alTeclear(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        setAbierto(false);
        document.getElementById(id)?.focus();
      }
    }
    document.addEventListener("mousedown", alPresionar);
    document.addEventListener("keydown", alTeclear);
    return () => {
      document.removeEventListener("mousedown", alPresionar);
      document.removeEventListener("keydown", alTeclear);
    };
  }, [abierto, id]);

  function abrirOCerrar() {
    if (!abierto) {
      setMesVisible(fechaDesde !== "" ? fechaDesde.slice(0, 7) : mesDeHoy());
      setAncla(null);
    }
    setAbierto(!abierto);
  }

  function elegirDia(dia: string) {
    if (ancla === null) {
      setAncla(dia);
      alCambiar(dia, dia);
      return;
    }
    const [primero, segundo] = dia < ancla ? [dia, ancla] : [ancla, dia];
    setAncla(null);
    alCambiar(primero, segundo);
    setAbierto(false);
  }

  function aplicar(desde: string, hasta: string) {
    setAncla(null);
    alCambiar(desde, hasta);
    setAbierto(false);
  }

  return (
    <div className="form-field filtro-fecha" ref={contenedor}>
      <label htmlFor={id}>{etiqueta}</label>
      <div className="filtro-fecha-control">
        <button
          aria-controls={idPanel}
          aria-describedby={id + "-valor"}
          aria-expanded={abierto}
          aria-haspopup="dialog"
          className={"filtro-fecha-boton" + (fechaDesde === "" ? " filtro-fecha-vacio" : "")}
          id={id}
          onClick={abrirOCerrar}
          type="button"
        >
          <svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" width="16">
            <rect height="16" rx="3" width="18" x="3" y="5" />
            <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
          </svg>
          <span id={id + "-valor"}>{descripcion}</span>
        </button>
        {fechaDesde !== "" ? (
          <button aria-label={"Quitar el filtro de " + etiqueta.toLowerCase()} className="filtro-fecha-quitar" onClick={() => aplicar("", "")} type="button">
            ×
          </button>
        ) : null}
      </div>

      {abierto ? (
        <div aria-label={"Elegir " + etiqueta.toLowerCase()} className="filtro-fecha-panel" id={idPanel} role="dialog">
          <ul aria-label="Atajos" className="filtro-fecha-atajos">
            {atajos(hoy).map((atajo) => (
              <li key={atajo.etiqueta}>
                <button className="boton-texto" onClick={() => aplicar(atajo.desde, atajo.hasta)} type="button">{atajo.etiqueta}</button>
              </li>
            ))}
            <li>
              <button className="boton-texto" onClick={() => aplicar("", "")} type="button">Cualquier fecha</button>
            </li>
          </ul>
          <div className="filtro-fecha-calendarios">
            <div className="filtro-fecha-navegacion">
              <button aria-label="Mes anterior" className="boton-icono" onClick={() => setMesVisible(sumarMeses(mesVisible, -1))} type="button">‹</button>
              <p className="texto-tenue">{ancla === null ? "Elegí un día; un segundo clic arma el rango." : "Elegí el último día del rango."}</p>
              <button aria-label="Mes siguiente" className="boton-icono" onClick={() => setMesVisible(sumarMeses(mesVisible, 1))} type="button">›</button>
            </div>
            <div className="filtro-fecha-meses">
              <Mes alElegir={elegirDia} desde={fechaDesde} hasta={fechaHasta} hoy={hoy} mes={mesVisible} />
              <Mes alElegir={elegirDia} desde={fechaDesde} hasta={fechaHasta} hoy={hoy} mes={sumarMeses(mesVisible, 1)} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
