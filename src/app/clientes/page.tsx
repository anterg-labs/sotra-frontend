"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ModalConfirmacion } from "@/componentes/modal-confirmacion";
import { desactivarCliente, listarClientes, reactivarCliente } from "@/servicios/servicio-clientes";
import type { Cliente } from "@/tipos/cliente";

function obtenerEtiquetaEstado(estado: Cliente["estado"]) {
  if (estado === "activo") {
    return "Activo";
  }

  return "Inactivo";
}

export default function PaginaClientes() {
  const [clientes, setClientes] = useState<Cliente[] | null>(null);
  const [errorCarga, setErrorCarga] = useState("");
  const [clienteDesactivandoId, setClienteDesactivandoId] = useState<number | null>(null);
  const [clientePendienteDesactivacion, setClientePendienteDesactivacion] = useState<Cliente | null>(null);

  useEffect(() => {
    async function cargarClientes() {
      setClientes(null);
      setErrorCarga("");

      try {
        const respuesta = await listarClientes();
        setClientes(respuesta);
      } catch {
        setErrorCarga("No se pudo obtener el listado de clientes.");
      }
    }

    cargarClientes();
  }, []);

  function pedirBajaCliente(cliente: Cliente) {
    setClientePendienteDesactivacion(cliente);
  }

  function cancelarBaja() {
    setClientePendienteDesactivacion(null);
  }

  async function confirmarDesactivacion() {
    if (!clientePendienteDesactivacion) {
      return;
    }

    const clienteId = clientePendienteDesactivacion.id;
    setClienteDesactivandoId(clienteId);

    try {
      await desactivarCliente(clienteId);
      const respuesta = await listarClientes();

      setClientes(respuesta);
      setClientePendienteDesactivacion(null);
    } catch {
      setErrorCarga("No se pudo dar de baja al cliente seleccionado.");
    } finally {
      setClienteDesactivandoId(null);
    }
  }

  async function reactivarClienteSeleccionado(cliente: Cliente) {
    setClienteDesactivandoId(cliente.id);

    try {
      await reactivarCliente(cliente.id);
      const respuesta = await listarClientes();
      setClientes(respuesta);
    } catch {
      setErrorCarga("No se pudo reactivar al cliente seleccionado.");
    } finally {
      setClienteDesactivandoId(null);
    }
  }

  let mensajeError = null;
  if (errorCarga) {
    mensajeError = <p className="form-error-banner">{errorCarga}</p>;
  }

  let mensajeCargando = null;
  if (clientes === null && !errorCarga) {
    mensajeCargando = <p className="empty-state">Cargando clientes…</p>;
  }

  let mensajeSinResultados = null;
  if (clientes !== null && clientes.length === 0) {
    mensajeSinResultados = <p className="empty-state">No hay clientes registrados.</p>;
  }

  let tablaClientes = null;
  if (clientes !== null && clientes.length > 0) {
    tablaClientes = (
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Razón social</th>
              <th>Contacto</th>
              <th>Correo electrónico</th>
              <th>Teléfono</th>
              <th>Activos asociados</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente) => {
              let claseEstado = "status status-inactivo";
              if (cliente.estado === "activo") {
                claseEstado = "status status-activo";
              }

              let botonBaja = null;
              if (cliente.estado === "activo") {
                botonBaja = (
                  <button
                    aria-label="Dar de baja"
                    className="table-action-link table-action-link-danger"
                    disabled={clienteDesactivandoId === cliente.id}
                    onClick={() => pedirBajaCliente(cliente)}
                    title="Dar de baja"
                    type="button"
                  >
                    Dar de baja
                  </button>
                );
              }

              let botonPrincipal = (
                <Link
                  aria-label="Modificar cliente"
                  className="table-action-link"
                  href={"/clientes/" + cliente.id + "/editar"}
                  title="Modificar cliente"
                >
                  Modificar
                </Link>
              );
              if (cliente.estado === "inactivo") {
                botonPrincipal = (
                  <button
                    aria-label="Reactivar cliente"
                    className="table-action-link"
                    disabled={clienteDesactivandoId === cliente.id}
                    onClick={() => reactivarClienteSeleccionado(cliente)}
                    title="Reactivar cliente"
                    type="button"
                  >
                    Reactivar
                  </button>
                );
              }

              return (
                <tr key={cliente.id}>
                  <td><strong>{cliente.razonSocial}</strong></td>
                  <td>{cliente.nombreContacto}</td>
                  <td>{cliente.correo}</td>
                  <td>{cliente.telefono}</td>
                  <td>{cliente.cantidadActivosAsociados}</td>
                  <td>
                    <span className={claseEstado}>{obtenerEtiquetaEstado(cliente.estado)}</span>
                  </td>
                  <td>
                    <div className="table-actions">
                      {botonPrincipal}
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
  if (clientePendienteDesactivacion) {
    modalBaja = (
      <ModalConfirmacion
        descripcion={
          "¿Confirmás la baja de " +
          clientePendienteDesactivacion.razonSocial +
          "? El cliente quedará inactivo, pero sus datos seguirán disponibles."
        }
        estaConfirmando={clienteDesactivandoId === clientePendienteDesactivacion.id}
        etiquetaConfirmar="Dar de baja"
        onCancelar={cancelarBaja}
        onConfirmar={confirmarDesactivacion}
        titulo="Dar de baja cliente"
      />
    );
  }

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <h1>Gestión de clientes</h1>
        </div>
        <Link className="primary-button" href="/clientes/nuevo">
          Registrar nuevo cliente
        </Link>
      </header>

      <section className="panel">
        {mensajeError}
        {mensajeCargando}
        {mensajeSinResultados}
        {tablaClientes}
      </section>

      {modalBaja}
    </main>
  );
}
