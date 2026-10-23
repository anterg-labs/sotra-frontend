"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Combobox } from "@/componentes/combobox";
import { formatearFechaPrevista, listarTecnicosPaginados, obtenerEtiquetaEstadoOrdenTrabajo } from "@/servicios/servicio-ordenes-trabajo";
import type { EstadoOrdenTrabajo, OrdenTrabajo } from "@/tipos/orden-trabajo";

type FiltroEstado = "" | "asignada" | "en_ejecucion" | "pausada";

const chips: { valor: FiltroEstado; etiqueta: string }[] = [
  { valor: "", etiqueta: "Todas" },
  { valor: "asignada", etiqueta: "Por iniciar" },
  { valor: "en_ejecucion", etiqueta: "En curso" },
  { valor: "pausada", etiqueta: "Pausadas" },
];

type PropiedadesMiTrabajo = {
  tecnicoId: string;
  /** Administrador y jefe eligen el técnico; el técnico ve siempre sus propias órdenes. */
  puedeElegirTecnico: boolean;
  /** Opciones del selector de técnico (la primera página y el técnico elegido). */
  tecnicos: { valor: string; etiqueta: string }[];
  /** Órdenes del técnico ya ordenadas por urgencia; `null` si no hay técnico elegido o falló la carga. */
  ordenes: OrdenTrabajo[] | null;
  error: string;
};

/** «Mi trabajo»: el servidor trae las órdenes del técnico elegido en la URL; los chips y la búsqueda por número filtran en el navegador. */
export function MiTrabajo(props: PropiedadesMiTrabajo) {
  const { tecnicoId, tecnicos, ordenes, error } = props;
  const enrutador = useRouter();
  const [estaPendiente, iniciarTransicion] = useTransition();
  const [filtro, setFiltro] = useState<FiltroEstado>("");
  const [buscarNumero, setBuscarNumero] = useState("");

  function elegirTecnico(nuevoId: string) {
    iniciarTransicion(() => enrutador.replace(nuevoId === "" ? "/tecnico" : "/tecnico?tecnicoId=" + nuevoId));
  }

  const visibles = (ordenes ?? []).filter(
    (orden) => (filtro === "" || orden.estado === filtro) && (buscarNumero.trim() === "" || String(orden.id).includes(buscarNumero.trim())),
  );

  return (
    <section aria-busy={estaPendiente} aria-labelledby="titulo-mi-trabajo" className="grid gap-4">
      <h1 className="sr-only" id="titulo-mi-trabajo">Mi trabajo</h1>

      {props.puedeElegirTecnico ? (
        <div className="tecnico-tarjeta">
          <Combobox
            alCambiar={elegirTecnico}
            buscarOpciones={async (consulta) => {
              const lista = await listarTecnicosPaginados(consulta);
              return lista.map((tecnico) => ({ valor: String(tecnico.id), etiqueta: `${tecnico.nombre} ${tecnico.apellido}` }));
            }}
            etiqueta="Técnico"
            id="tecnicoMiTrabajo"
            opciones={tecnicos}
            textoVacio="Elegí un técnico"
            valor={tecnicoId}
          />
        </div>
      ) : null}

      {error ? <p className="form-error-banner" role="alert">{error}</p> : null}

      {tecnicoId === "" ? (
        <p className="empty-state">Elegí un técnico para ver sus órdenes.</p>
      ) : (
        <>
          <div aria-label="Filtro por estado" className="chips-filtro" role="group">
            {chips.map((chip) => (
              <button aria-pressed={filtro === chip.valor} className="chip-filtro" key={chip.valor} onClick={() => setFiltro(chip.valor)} type="button">
                {chip.etiqueta}
                {ordenes !== null ? (
                  <span className="chip-filtro-contador">
                    {chip.valor === "" ? ordenes.length : ordenes.filter((orden) => orden.estado === (chip.valor as EstadoOrdenTrabajo)).length}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          <div className="form-field">
            <label htmlFor="numeroOrden">Buscar por número de orden</label>
            <input id="numeroOrden" inputMode="numeric" onChange={(evento) => setBuscarNumero(evento.target.value)} type="search" value={buscarNumero} />
          </div>

          {estaPendiente ? <p className="empty-state">Cargando tus órdenes…</p> : null}
          {!estaPendiente && ordenes !== null && visibles.length === 0 ? <p className="empty-state">No tenés órdenes pendientes con este filtro.</p> : null}

          <ul className="tecnico-lista">
            {visibles.map((orden) => (
              <li key={orden.id}>
                <Link className={"tecnico-tarjeta tecnico-tarjeta-prioridad-" + orden.prioridad} href={"/tecnico/" + orden.id}>
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <strong>{"Orden #" + orden.id}</strong>
                    <span className={"status status-" + orden.estado}>{obtenerEtiquetaEstadoOrdenTrabajo(orden.estado)}</span>
                  </span>
                  <span>{orden.nombreActivo}</span>
                  <small>{orden.nombreCliente + " · prioridad " + orden.prioridad + " · prevista " + formatearFechaPrevista(orden.fechaPrevistaEjecucion)}</small>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
