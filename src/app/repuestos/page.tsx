"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ModalConfirmacion } from "@/componentes/modal-confirmacion";
import { desactivarRepuesto, listarRepuestos } from "@/servicios/servicio-repuestos";
import type { Repuesto } from "@/tipos/repuesto";

export default function PaginaRepuestos() {
  const [repuestos, setRepuestos] = useState<Repuesto[] | null>(null);
  const [errorCarga, setErrorCarga] = useState("");
  const [repuestoDesactivandoId, setRepuestoDesactivandoId] = useState<number | null>(null);
  const [repuestoPendienteDesactivacion, setRepuestoPendienteDesactivacion] = useState<Repuesto | null>(null);

  useEffect(() => {
    async function cargarRepuestos() {
      setRepuestos(null);
      setErrorCarga("");

      try {
        const repuestosObtenidos = await listarRepuestos();
        setRepuestos(repuestosObtenidos);
      } catch {
        setErrorCarga("No se pudo obtener el listado de repuestos.");
      }
    }

    cargarRepuestos();
  }, []);

  function pedirBajaRepuesto(repuesto: Repuesto) {
    setRepuestoPendienteDesactivacion(repuesto);
  }

  function cancelarBaja() {
    setRepuestoPendienteDesactivacion(null);
  }

  async function confirmarDesactivacion() {
    if (!repuestoPendienteDesactivacion) {
      return;
    }

    const repuestoId = repuestoPendienteDesactivacion.id;
    setRepuestoDesactivandoId(repuestoId);

    try {
      await desactivarRepuesto(repuestoId);
      const repuestosActualizados = await listarRepuestos();
      setRepuestos(repuestosActualizados);
      setRepuestoPendienteDesactivacion(null);
    } catch {
      setErrorCarga("No se pudo dar de baja el repuesto seleccionado.");
    } finally {
      setRepuestoDesactivandoId(null);
    }
  }

  let mensajeError = null;
  if (errorCarga) {
    mensajeError = <p className="form-error-banner">{errorCarga}</p>;
  }

  let mensajeCargando = null;
  if (repuestos === null && !errorCarga) {
    mensajeCargando = <p className="empty-state">Cargando repuestos…</p>;
  }

  let mensajeSinResultados = null;
  if (repuestos !== null && repuestos.length === 0) {
    mensajeSinResultados = <p className="empty-state">No hay repuestos registrados.</p>;
  }

  let tablaRepuestos = null;
  if (repuestos !== null && repuestos.length > 0) {
    tablaRepuestos = (
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Marca</th>
              <th>Ubicación</th>
              <th>Cantidad</th>
              <th>Mínima</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {repuestos.map((repuesto) => {
              let claseEstado = "status status-inactivo";
              let textoEstado = "Inactivo";
              if (repuesto.estado === "activo") {
                claseEstado = "status status-activo";
                textoEstado = "Activo";
              }

              let botonBaja = null;
              if (repuesto.estado === "activo") {
                botonBaja = (
                  <button
                    aria-label="Dar de baja"
                    className="table-action-link table-action-link-danger"
                    disabled={repuestoDesactivandoId === repuesto.id}
                    onClick={() => pedirBajaRepuesto(repuesto)}
                    title="Dar de baja"
                    type="button"
                  >
                    Dar de baja
                  </button>
                );
              }

              return (
                <tr key={repuesto.id}>
                  <td><strong>{repuesto.codigo}</strong></td>
                  <td>{repuesto.nombre}</td>
                  <td>{repuesto.marca}</td>
                  <td>{repuesto.ubicacion}</td>
                  <td>{repuesto.cantidad}</td>
                  <td>{repuesto.cantidadMinima}</td>
                  <td>
                    <span className={claseEstado}>{textoEstado}</span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <Link
                        aria-label="Modificar repuesto"
                        className="table-action-link"
                        href={"/repuestos/" + repuesto.id + "/editar"}
                        title="Modificar repuesto"
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
  if (repuestoPendienteDesactivacion) {
    modalBaja = (
      <ModalConfirmacion
        descripcion={
          "¿Confirmás la baja de " +
          repuestoPendienteDesactivacion.nombre +
          "? El repuesto no se elimina, pero ya no se podrá asociar a nuevas órdenes de trabajo."
        }
        estaConfirmando={repuestoDesactivandoId === repuestoPendienteDesactivacion.id}
        etiquetaConfirmar="Dar de baja"
        onCancelar={cancelarBaja}
        onConfirmar={confirmarDesactivacion}
        titulo="Dar de baja repuesto"
      />
    );
  }

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <h1>Repuestos</h1>
        </div>
        <Link className="primary-button" href="/repuestos/nuevo">
          Registrar repuesto
        </Link>
      </header>

      <section className="panel">
        {mensajeError}
        {mensajeCargando}
        {mensajeSinResultados}
        {tablaRepuestos}
      </section>

      {modalBaja}
    </main>
  );
}
