"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  formatearFechaPrevista,
  listarOrdenesTrabajo,
} from "@/servicios/servicio-ordenes-trabajo";
import { EtiquetaEstadoOrden, etiquetaLegible } from "@/componentes/estados-orden";
import type { FiltrosOrdenesTrabajo, OrdenTrabajo } from "@/tipos/orden-trabajo";
import { IconoOjo } from "@/componentes/iconos";
import { ContenedorTabla } from "@/componentes/contenedor-tabla";
import { EncabezadoOrdenLocal, siguienteOrdenLocal, type OrdenLocal } from "@/componentes/listado/orden-local";

type PropiedadesOrdenesAsociadas = {
  titulo: string;
  clienteId: string;
  activoId: string;
  tecnicoId: string;
};

/** Columnas que el servidor sabe ordenar (`GET /ordenes-trabajo?ordenarPor=`). */
type ColumnaOrdenes = "id" | "nombreCliente" | "nombreActivo" | "nombreTecnico" | "prioridad" | "estado" | "fechaPrevistaEjecucion";

const MENSAJE_ERROR = "No se pudieron obtener las órdenes de trabajo asociadas.";

/**
 * Órdenes de un cliente, un activo o un técnico, con paginación y orden en el servidor. Al cambiar de página o de orden,
 * la tabla anterior queda a la vista (atenuada si tarda) hasta que llega la nueva, sin pasar por un «Cargando…» que parpadee.
 */
export function OrdenesAsociadas(props: PropiedadesOrdenesAsociadas) {
  const { clienteId, activoId, tecnicoId } = props;
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[] | null>(null);
  const [errorCarga, setErrorCarga] = useState("");
  const [estaCargando, setEstaCargando] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalElementos, setTotalElementos] = useState(0);
  const clave = clienteId + "|" + activoId + "|" + tecnicoId;
  const [ordenElegido, setOrdenElegido] = useState<{ clave: string; orden: OrdenLocal<ColumnaOrdenes> }>({ clave, orden: null });
  const orden = ordenElegido.clave === clave ? ordenElegido.orden : null;
  const ultimaSolicitud = useRef(0);

  const armarFiltros = useCallback(
    (numeroPagina: number, ordenElegido: OrdenLocal<ColumnaOrdenes>): FiltrosOrdenesTrabajo => ({
      buscar: "",
      clienteId,
      activoId,
      tecnicoId,
      estado: "",
      prioridad: "",
      tipo: "",
      fechaDesde: "",
      fechaHasta: "",
      conSugerencias: false,
      pagina: numeroPagina,
      ordenarPor: ordenElegido?.columna ?? "",
      direccionOrden: ordenElegido?.direccion ?? "",
    }),
    [clienteId, activoId, tecnicoId],
  );

  function aplicarPagina(paginaObtenida: Awaited<ReturnType<typeof listarOrdenesTrabajo>>) {
    setOrdenes(paginaObtenida.elementos);
    setPaginaActual(paginaObtenida.pagina);
    setTotalPaginas(paginaObtenida.totalPaginas);
    setTotalElementos(paginaObtenida.totalElementos);
  }

  useEffect(() => {
    const solicitud = ++ultimaSolicitud.current;
    async function cargarPrimeraPagina() {
      try {
        const paginaObtenida = await listarOrdenesTrabajo(armarFiltros(1, null));
        if (solicitud !== ultimaSolicitud.current) return;
        aplicarPagina(paginaObtenida);
      } catch {
        if (solicitud === ultimaSolicitud.current) setErrorCarga(MENSAJE_ERROR);
      } finally {
        if (solicitud === ultimaSolicitud.current) setEstaCargando(false);
      }
    }

    void cargarPrimeraPagina();
  }, [armarFiltros]);

  /** Marca la carga como en curso (la tabla anterior queda a la vista, atenuada) y pide la página. */
  function irA(numeroPagina: number, ordenElegido: OrdenLocal<ColumnaOrdenes>) {
    const solicitud = ++ultimaSolicitud.current;
    setEstaCargando(true);
    setErrorCarga("");
    listarOrdenesTrabajo(armarFiltros(numeroPagina, ordenElegido))
      .then((paginaObtenida) => {
        if (solicitud === ultimaSolicitud.current) aplicarPagina(paginaObtenida);
      })
      .catch(() => {
        if (solicitud === ultimaSolicitud.current) setErrorCarga(MENSAJE_ERROR);
      })
      .finally(() => {
        if (solicitud === ultimaSolicitud.current) setEstaCargando(false);
      });
  }

  function alternarOrden(columna: ColumnaOrdenes) {
    const siguiente = siguienteOrdenLocal(orden, columna);
    setOrdenElegido({ clave, orden: siguiente });
    irA(1, siguiente);
  }

  let contenido = <p className="empty-state">Cargando órdenes de trabajo…</p>;
  if (errorCarga) {
    contenido = <p className="form-error-banner">{errorCarga}</p>;
  }
  if (ordenes !== null && ordenes.length === 0 && !errorCarga) {
    contenido = <p className="empty-state">No hay órdenes de trabajo asociadas.</p>;
  }
  if (ordenes !== null && ordenes.length > 0) {
    const encabezado = (columna: ColumnaOrdenes, etiqueta: string) => (
      <EncabezadoOrdenLocal alternar={alternarOrden} columna={columna} etiqueta={etiqueta} orden={orden} />
    );
    contenido = (
      <div aria-busy={estaCargando} className="zona-listado" data-cargando={estaCargando}>
        {errorCarga ? <p className="form-error-banner">{errorCarga}</p> : null}
        <ContenedorTabla etiqueta="Órdenes de trabajo asociadas">
          <table>
            <thead>
              <tr>
                {encabezado("id", "N°")}
                {encabezado("nombreCliente", "Cliente")}
                {encabezado("nombreActivo", "Activo")}
                {encabezado("nombreTecnico", "Técnico")}
                {encabezado("prioridad", "Prioridad")}
                {encabezado("estado", "Estado")}
                {encabezado("fechaPrevistaEjecucion", "Fecha prevista")}
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ordenes.map((orden) => (
                <tr key={orden.id}>
                  <td className="celda-numerica"><strong>{orden.id}</strong></td>
                  <td>{orden.nombreCliente}</td>
                  <td>{orden.nombreActivo}</td>
                  <td>{orden.nombreTecnico ?? "Sin asignar"}</td>
                  <td>
                    <span className={"status prioridad-" + orden.prioridad}>{etiquetaLegible(orden.prioridad)}</span>
                  </td>
                  <td>
                    <EtiquetaEstadoOrden estado={orden.estado} />
                  </td>
                  <td>{formatearFechaPrevista(orden.fechaPrevistaEjecucion)}</td>
                  <td>
                    <Link aria-label="Ver detalle" className="boton-icono" href={"/ordenes-trabajo/" + orden.id} title="Ver detalle">
                      <IconoOjo />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ContenedorTabla>
      </div>
    );
  }

  let paginacion = null;
  if (totalPaginas > 1) {
    paginacion = (
      <div aria-busy={estaCargando} className="pagination">
        <button disabled={paginaActual <= 1 || estaCargando} onClick={() => irA(paginaActual - 1, orden)} type="button">
          Anterior
        </button>
        <span>{"Página " + paginaActual + " de " + totalPaginas + " (" + totalElementos + " órdenes)"}</span>
        <button disabled={paginaActual >= totalPaginas || estaCargando} onClick={() => irA(paginaActual + 1, orden)} type="button">
          Siguiente
        </button>
      </div>
    );
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>{props.titulo}</h2>
      </div>
      {contenido}
      {paginacion}
    </section>
  );
}
