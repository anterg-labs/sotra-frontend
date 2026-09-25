"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { UsuarioListado } from "@/tipos/usuario";
import { ModalConfirmacion } from "@/componentes/modal-confirmacion";
import { desactivarUsuario, listarUsuarios } from "@/servicios/servicio-usuarios";

function obtenerEtiquetaEstado(estado: UsuarioListado["estado"]) {
  if (estado === "activo") {
    return "Activo";
  }

  return "Inactivo";
}

export default function PaginaUsuarios() {
  const [usuarios, setUsuarios] = useState<UsuarioListado[] | null>(null);
  const [errorCarga, setErrorCarga] = useState("");
  const [usuarioDesactivandoId, setUsuarioDesactivandoId] = useState<number | null>(null);
  const [usuarioPendienteDesactivacion, setUsuarioPendienteDesactivacion] = useState<UsuarioListado | null>(null);

  useEffect(() => {
    async function cargarUsuarios() {
      setUsuarios(null);
      setErrorCarga("");

      try {
        const usuariosObtenidos = await listarUsuarios();
        setUsuarios(usuariosObtenidos);
      } catch {
        setErrorCarga("No se pudo obtener el listado de usuarios.");
      }
    }

    cargarUsuarios();
  }, []);

  function pedirBajaUsuario(usuario: UsuarioListado) {
    setUsuarioPendienteDesactivacion(usuario);
  }

  function cancelarBaja() {
    setUsuarioPendienteDesactivacion(null);
  }

  async function confirmarDesactivacion() {
    if (!usuarioPendienteDesactivacion) {
      return;
    }

    const usuarioId = usuarioPendienteDesactivacion.id;
    setUsuarioDesactivandoId(usuarioId);

    try {
      await desactivarUsuario(usuarioId);
      const usuariosActualizados = await listarUsuarios();
      setUsuarios(usuariosActualizados);
      setUsuarioPendienteDesactivacion(null);
    } catch {
      setErrorCarga("No se pudo desactivar el usuario seleccionado.");
    } finally {
      setUsuarioDesactivandoId(null);
    }
  }

  let mensajeError = null;
  if (errorCarga) {
    mensajeError = <p className="form-error-banner">{errorCarga}</p>;
  }

  let mensajeCargando = null;
  if (usuarios === null && !errorCarga) {
    mensajeCargando = <p className="empty-state">Cargando usuarios…</p>;
  }

  let mensajeSinResultados = null;
  if (usuarios !== null && usuarios.length === 0) {
    mensajeSinResultados = <p className="empty-state">No hay usuarios registrados.</p>;
  }

  let tablaUsuarios = null;
  if (usuarios !== null && usuarios.length > 0) {
    tablaUsuarios = (
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre y apellido</th>
              <th>Correo electrónico</th>
              <th>Roles asignados</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => {
              let claseEstado = "status status-inactivo";
              if (usuario.estado === "activo") {
                claseEstado = "status status-activo";
              }

              let botonBaja = null;
              if (usuario.estado === "activo") {
                botonBaja = (
                  <button
                    aria-label="Dar de baja"
                    className="table-action-link table-action-link-danger"
                    disabled={usuarioDesactivandoId === usuario.id}
                    onClick={() => pedirBajaUsuario(usuario)}
                    title="Dar de baja"
                    type="button"
                  >
                    Dar de baja
                  </button>
                );
              }

              let celdaRoles = <span>Sin roles</span>;
              if (usuario.roles.length === 1) {
                celdaRoles = <span>{usuario.roles[0].nombre}</span>;
              }
              if (usuario.roles.length > 1) {
                celdaRoles = (
                  <details>
                    <summary className="cursor-pointer">{usuario.roles.length} roles</summary>
                    <ul>
                      {usuario.roles.map((rol) => (
                        <li key={rol.id}>{rol.nombre}</li>
                      ))}
                    </ul>
                  </details>
                );
              }

              return (
                <tr key={usuario.id}>
                  <td>
                    <strong>{usuario.nombre} {usuario.apellido}</strong>
                  </td>
                  <td>{usuario.correo}</td>
                  <td>{celdaRoles}</td>
                  <td>
                    <span className={claseEstado}>{obtenerEtiquetaEstado(usuario.estado)}</span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <Link
                        aria-label="Modificar usuario"
                        className="table-action-link"
                        href={"/usuarios/" + usuario.id + "/editar"}
                        title="Modificar usuario"
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
  if (usuarioPendienteDesactivacion) {
    modalBaja = (
      <ModalConfirmacion
        etiquetaConfirmar="Dar de baja"
        descripcion={
          "¿Confirmás la desactivación de " +
          usuarioPendienteDesactivacion.nombre +
          " " +
          usuarioPendienteDesactivacion.apellido +
          "? Ya no podrá iniciar sesión mientras permanezca inactivo."
        }
        estaConfirmando={usuarioDesactivandoId === usuarioPendienteDesactivacion.id}
        onCancelar={cancelarBaja}
        onConfirmar={confirmarDesactivacion}
        titulo="Desactivar usuario"
      />
    );
  }

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <h1>Gestión de usuarios</h1>
        </div>
        <Link className="primary-button" href="/usuarios/nuevo">
          Crear nuevo usuario
        </Link>
      </header>

      <section className="panel">
        {mensajeError}
        {mensajeCargando}
        {mensajeSinResultados}
        {tablaUsuarios}
      </section>

      {modalBaja}
    </main>
  );
}
