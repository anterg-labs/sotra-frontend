"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  formatearFechaPrevista,
  listarOrdenesTrabajo,
  obtenerEtiquetaEstadoOrdenTrabajo,
} from "@/servicios/servicio-ordenes-trabajo";
import type { FiltrosOrdenesTrabajo, OrdenTrabajo } from "@/tipos/orden-trabajo";

type PropiedadesOrdenesAsociadas = {
  titulo: string;
  clienteId: string;
  activoId: string;
  tecnicoId: string;
};

export function OrdenesAsociadas(props: PropiedadesOrdenesAsociadas) {
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[] | null>(null);
  const [errorCarga, setErrorCarga] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalElementos, setTotalElementos] = useState(0);

  function armarFiltros(numeroPagina: number) {
    const filtros: FiltrosOrdenesTrabajo = {
      buscar: "",
      clienteId: props.clienteId,
      activoId: props.activoId,
      tecnicoId: props.tecnicoId,
      estado: "",
      prioridad: "",
      tipo: "",
      fechaDesde: "",
      fechaHasta: "",
      conSugerencias: false,
      pagina: numeroPagina,
    };
    return filtros;
  }

  useEffect(() => {
    async function cargarPrimeraPagina() {
      const filtros: FiltrosOrdenesTrabajo = {
        buscar: "",
        clienteId: props.clienteId,
        activoId: props.activoId,
        tecnicoId: props.tecnicoId,
        estado: "",
        prioridad: "",
        tipo: "",
        fechaDesde: "",
        fechaHasta: "",
        conSugerencias: false,
        pagina: 1,
      };

      try {
        const paginaObtenida = await listarOrdenesTrabajo(filtros);
        setOrdenes(paginaObtenida.elementos);
        setPaginaActual(paginaObtenida.pagina);
        setTotalPaginas(paginaObtenida.totalPaginas);
        setTotalElementos(paginaObtenida.totalElementos);
      } catch {
        setErrorCarga("No se pudieron obtener las órdenes de trabajo asociadas.");
      }
    }

    cargarPrimeraPagina();
  }, [props.clienteId, props.activoId, props.tecnicoId]);

  async function irAPagina(numeroPagina: number) {
    setOrdenes(null);
    setErrorCarga("");

    try {
      const paginaObtenida = await listarOrdenesTrabajo(armarFiltros(numeroPagina));
      setOrdenes(paginaObtenida.elementos);
      setPaginaActual(paginaObtenida.pagina);
      setTotalPaginas(paginaObtenida.totalPaginas);
      setTotalElementos(paginaObtenida.totalElementos);
    } catch {
      setErrorCarga("No se pudieron obtener las órdenes de trabajo asociadas.");
    }
  }

  function irAPaginaAnterior() {
    irAPagina(paginaActual - 1);
  }

  function irAPaginaSiguiente() {
    irAPagina(paginaActual + 1);
  }

  let contenido = <p className="empty-state">Cargando órdenes de trabajo…</p>;
  if (errorCarga) {
    contenido = <p className="form-error-banner">{errorCarga}</p>;
  }
  if (ordenes !== null && ordenes.length === 0) {
    contenido = <p className="empty-state">No hay órdenes de trabajo asociadas.</p>;
  }
  if (ordenes !== null && ordenes.length > 0) {
    contenido = (
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>N°</th>
              <th>Cliente</th>
              <th>Activo</th>
              <th>Técnico</th>
              <th>Prioridad</th>
              <th>Estado</th>
              <th>Fecha prevista</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ordenes.map((orden) => {
              let nombreTecnico = "Sin asignar";
              if (orden.nombreTecnico !== null) {
                nombreTecnico = orden.nombreTecnico;
              }

              return (
                <tr key={orden.id}>
                  <td><strong>{orden.id}</strong></td>
                  <td>{orden.nombreCliente}</td>
                  <td>{orden.nombreActivo}</td>
                  <td>{nombreTecnico}</td>
                  <td>
                    <span className={"status prioridad-" + orden.prioridad}>{orden.prioridad}</span>
                  </td>
                  <td>
                    <span className={"status status-" + orden.estado}>{obtenerEtiquetaEstadoOrdenTrabajo(orden.estado)}</span>
                  </td>
                  <td>{formatearFechaPrevista(orden.fechaPrevistaEjecucion)}</td>
                  <td>
                    <Link className="table-action-link" href={"/ordenes-trabajo/" + orden.id}>
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  let paginacion = null;
  if (totalPaginas > 1) {
    paginacion = (
      <div className="pagination">
        <button disabled={paginaActual <= 1} onClick={irAPaginaAnterior} type="button">
          Anterior
        </button>
        <span>{"Página " + paginaActual + " de " + totalPaginas + " (" + totalElementos + " órdenes)"}</span>
        <button disabled={paginaActual >= totalPaginas} onClick={irAPaginaSiguiente} type="button">
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
