"use client";

import { useState } from "react";

type PropiedadesFiltroFecha = {
  id: string;
  etiqueta: string;
  etiquetaFin?: string;
  fechaDesde: string;
  fechaHasta: string;
  alCambiar: (fechaDesde: string, fechaHasta: string) => void;
};

export function rangoDeFechasInvalido(fechaDesde: string, fechaHasta: string) {
  return fechaDesde !== "" && fechaHasta !== "" && fechaHasta < fechaDesde;
}

/**
 * Filtro de fecha con un solo selector para un día fijo. La casilla "Rango de fechas" muestra el segundo
 * selector. Un día fijo se envía como desde y hasta con la misma fecha, que la API toma ambas incluidas.
 */
export function FiltroFecha(props: PropiedadesFiltroFecha) {
  const { id, etiqueta, etiquetaFin = "hasta", fechaDesde, fechaHasta, alCambiar } = props;
  const [esRango, setEsRango] = useState(fechaHasta !== "" && fechaHasta !== fechaDesde);

  const hayRangoInvertido = esRango && rangoDeFechasInvalido(fechaDesde, fechaHasta);

  function cambiarDia(evento: React.ChangeEvent<HTMLInputElement>) {
    const dia = evento.target.value;
    alCambiar(dia, dia);
  }

  function cambiarInicio(evento: React.ChangeEvent<HTMLInputElement>) {
    alCambiar(evento.target.value, fechaHasta);
  }

  function cambiarFin(evento: React.ChangeEvent<HTMLInputElement>) {
    alCambiar(fechaDesde, evento.target.value);
  }

  function cambiarModoRango(evento: React.ChangeEvent<HTMLInputElement>) {
    const quiereRango = evento.target.checked;
    setEsRango(quiereRango);
    if (!quiereRango) {
      alCambiar(fechaDesde, fechaDesde);
    }
  }

  return (
    <>
      <div className="form-field">
        <label htmlFor={id + "-desde"}>{esRango ? etiqueta + " desde" : etiqueta}</label>
        <input
          aria-describedby={hayRangoInvertido ? id + "-error" : undefined}
          id={id + "-desde"}
          onChange={esRango ? cambiarInicio : cambiarDia}
          type="date"
          value={fechaDesde}
        />
      </div>

      {esRango ? (
        <div className="form-field">
          <label htmlFor={id + "-hasta"}>{etiqueta + " " + etiquetaFin}</label>
          <input
            aria-describedby={hayRangoInvertido ? id + "-error" : undefined}
            aria-invalid={hayRangoInvertido ? true : undefined}
            id={id + "-hasta"}
            min={fechaDesde || undefined}
            onChange={cambiarFin}
            type="date"
            value={fechaHasta}
          />
          {hayRangoInvertido ? (
            <p className="field-error" id={id + "-error"} role="alert">
              La fecha final no puede ser anterior a la inicial.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="form-field campo-casilla">
        <label className="flex items-center gap-2" htmlFor={id + "-rango"}>
          <input checked={esRango} id={id + "-rango"} onChange={cambiarModoRango} role="switch" type="checkbox" />
          Rango de fechas
        </label>
      </div>
    </>
  );
}
