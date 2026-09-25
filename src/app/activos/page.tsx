"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ModalConfirmacion } from "@/componentes/modal-confirmacion";
import { desactivarActivo, listarActivos } from "@/servicios/servicio-activos";
import type { Activo } from "@/tipos/activo";

function obtenerEtiquetaEstado(estado: Activo["estado"]) {
  if (estado === "activo") {
    return "Activo";
  }

  return "Inactivo";
}

export default function PaginaActivos() {
  const [activos, setActivos] = useState<Activo[] | null>(null);
  const [errorCarga, setErrorCarga] = useState("");
  const [activoDesactivandoId, setActivoDesactivandoId] = useState<number | null>(null);
  const [activoPendienteDesactivacion, setActivoPendienteDesactivacion] = useState<Activo | null>(null);

  useEffect(() => {
    async function cargarActivos() {
      setActivos(null);
      setErrorCarga("");

      try {
        const activosObtenidos = await listarActivos();
        setActivos(activosObtenidos);
      } catch {
        setErrorCarga("No se pudo obtener el listado de activos.");
      }
    }

    cargarActivos();
  }, []);

  function pedirBajaActivo(activo: Activo) {
    setActivoPendienteDesactivacion(activo);
  }

  function cancelarBaja() {
    setActivoPendienteDesactivacion(null);
  }

  async function confirmarDesactivacion() {
    if (!activoPendienteDesactivacion) {
      return;
    }

    const activoId = activoPendienteDesactivacion.id;
    setActivoDesactivandoId(activoId);

    try {
      await desactivarActivo(activoId);
      const activosActualizados = await listarActivos();
      setActivos(activosActualizados);
      setActivoPendienteDesactivacion(null);
    } catch {
      setErrorCarga("No se pudo dar de baja al activo seleccionado.");
    } finally {
      setActivoDesactivandoId(null);
    }
  }

  let mensajeError = null;
  if (errorCarga) {
    mensajeError = <p className="form-error-banner">{errorCarga}</p>;
  }

  let mensajeCargando = null;
  if (activos === null && !errorCarga) {
    mensajeCargando = <p className="empty-state">Cargando activos…</p>;
  }

  let mensajeSinResultados = null;
  if (activos !== null && activos.length === 0) {
    mensajeSinResultados = <p className="empty-state">No hay activos registrados.</p>;
  }

  let tablaActivos = null;
  if (activos !== null && activos.length > 0) {
    tablaActivos = (
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre del activo</th>
              <th>Número de serie</th>
              <th>Cliente</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {activos.map((activo) => {
              let claseEstado = "status status-inactivo";
              if (activo.estado === "activo") {
                claseEstado = "status status-activo";
              }

              let botonBaja = null;
              if (activo.estado === "activo") {
                botonBaja = (
                  <button
                    aria-label="Dar de baja"
                    className="table-action-link table-action-link-danger"
                    disabled={activoDesactivandoId === activo.id}
                    onClick={() => pedirBajaActivo(activo)}
                    title="Dar de baja"
                    type="button"
                  >
                    Dar de baja
                  </button>
                );
              }

              return (
                <tr key={activo.id}>
                  <td><strong>{activo.nombre}</strong></td>
                  <td>{activo.numeroSerie}</td>
                  <td>{activo.nombreCliente}</td>
                  <td>
                    <span className={claseEstado}>{obtenerEtiquetaEstado(activo.estado)}</span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <Link
                        aria-label="Modificar activo"
                        className="table-action-link"
                        href={"/activos/" + activo.id + "/editar"}
                        title="Modificar activo"
                      >
                        Modificar
                      </Link>
                      {botonBaja}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  let modalBaja = null;
  if (activoPendienteDesactivacion) {
    modalBaja = (
      <ModalConfirmacion
        descripcion={
          "¿Confirmás la baja de " +
          activoPendienteDesactivacion.nombre +
          "? El activo quedará inactivo, pero sus datos seguirán disponibles."
        }
        estaConfirmando={activoDesactivandoId === activoPendienteDesactivacion.id}
        etiquetaConfirmar="Dar de baja"
        onCancelar={cancelarBaja}
        onConfirmar={confirmarDesactivacion}
        titulo="Dar de baja activo"
      />
    );
  }

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <h1>Gestión de activos</h1>
        </div>
        <Link className="primary-button" href="/activos/nuevo">
          Registrar nuevo activo
        </Link>
      </header>

      <section className="panel">
        {mensajeError}
        {mensajeCargando}
        {mensajeSinResultados}
        {tablaActivos}
      </section>

      {modalBaja}
    </main>
  );
}
