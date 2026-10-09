"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FiltrosUsuarios, Rol, UsuarioListado } from "@/tipos/usuario";
import { ModalConfirmacion } from "@/componentes/modal-confirmacion";
import { desactivarUsuario, listarRoles, listarUsuariosPaginados } from "@/servicios/servicio-usuarios";
import { IconoLapiz, IconoOjo, IconoPapelera } from "@/componentes/iconos";

const filtrosVacios: FiltrosUsuarios = {
  buscar: "",
  rolId: "",
  estado: "",
  pagina: 1,
};

function obtenerEtiquetaEstado(estado: UsuarioListado["estado"]) {
  if (estado === "activo") {
    return "Activo";
  }

  return "Inactivo";
}

export default function PaginaUsuarios() {
  const [usuarios, setUsuarios] = useState<UsuarioListado[] | null>(null);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [errorCarga, setErrorCarga] = useState("");
  const [usuarioDesactivandoId, setUsuarioDesactivandoId] = useState<number | null>(null);
  const [usuarioPendienteDesactivacion, setUsuarioPendienteDesactivacion] = useState<UsuarioListado | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalElementos, setTotalElementos] = useState(0);
  const [filtrosAplicados, setFiltrosAplicados] = useState<FiltrosUsuarios>(filtrosVacios);
  const [buscar, setBuscar] = useState("");
  const [rolIdFiltro, setRolIdFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");

  useEffect(() => {
    async function cargarUsuarios() {
      try {
        const paginaObtenida = await listarUsuariosPaginados(filtrosVacios);
        setUsuarios(paginaObtenida.elementos);
        setPaginaActual(paginaObtenida.pagina);
        setTotalPaginas(paginaObtenida.totalPaginas);
        setTotalElementos(paginaObtenida.totalElementos);
      } catch {
        setErrorCarga("No se pudo obtener el listado de usuarios.");
      }

      try {
        const rolesObtenidos = await listarRoles();
        setRoles(rolesObtenidos);
      } catch {
        setErrorCarga("No se pudo obtener el listado de roles.");
      }
    }

    cargarUsuarios();
  }, []);

  async function cargarPagina(filtros: FiltrosUsuarios) {
    setUsuarios(null);
    setErrorCarga("");
    setFiltrosAplicados(filtros);

    try {
      const paginaObtenida = await listarUsuariosPaginados(filtros);
      setUsuarios(paginaObtenida.elementos);
      setPaginaActual(paginaObtenida.pagina);
      setTotalPaginas(paginaObtenida.totalPaginas);
      setTotalElementos(paginaObtenida.totalElementos);
    } catch {
      setErrorCarga("No se pudo obtener el listado de usuarios.");
    }
  }

  function aplicarFiltros(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const filtros: FiltrosUsuarios = {
      buscar: buscar,
      rolId: rolIdFiltro,
      estado: estadoFiltro,
      pagina: 1,
    };
    cargarPagina(filtros);
  }

  function limpiarFiltros() {
    setBuscar("");
    setRolIdFiltro("");
    setEstadoFiltro("");
    cargarPagina(filtrosVacios);
  }

  function irAPagina(numeroPagina: number) {
    const filtros: FiltrosUsuarios = {
      buscar: filtrosAplicados.buscar,
      rolId: filtrosAplicados.rolId,
      estado: filtrosAplicados.estado,
      pagina: numeroPagina,
    };
    cargarPagina(filtros);
  }

  function irAPaginaAnterior() {
    irAPagina(paginaActual - 1);
  }

  function irAPaginaSiguiente() {
    irAPagina(paginaActual + 1);
  }

  function cambiarBuscar(evento: React.ChangeEvent<HTMLInputElement>) {
    setBuscar(evento.target.value);
  }

  function cambiarRolFiltro(evento: React.ChangeEvent<HTMLSelectElement>) {
    setRolIdFiltro(evento.target.value);
  }

  function cambiarEstadoFiltro(evento: React.ChangeEvent<HTMLSelectElement>) {
    setEstadoFiltro(evento.target.value);
  }

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
      setUsuarioPendienteDesactivacion(null);
      await cargarPagina(filtrosAplicados);
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
    mensajeSinResultados = <p className="empty-state">No se encontraron usuarios con los filtros aplicados.</p>;
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
                    className="boton-icono boton-icono-peligro"
                    disabled={usuarioDesactivandoId === usuario.id}
                    onClick={() => pedirBajaUsuario(usuario)}
                    title="Dar de baja"
                    type="button"
                  >
                    <IconoPapelera />
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
                        aria-label="Ver detalle"
                        className="boton-icono"
                        href={"/usuarios/" + usuario.id}
                        title="Ver detalle"
                      >
                        <IconoOjo />
                      </Link>
                      <Link
                        aria-label="Modificar usuario"
                        className="boton-icono"
                        href={"/usuarios/" + usuario.id + "/editar"}
                        title="Modificar usuario"
                      >
                        <IconoLapiz />
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

  let paginacion = null;
  if (totalPaginas > 1) {
    paginacion = (
      <div className="pagination">
        <button disabled={paginaActual <= 1} onClick={irAPaginaAnterior} type="button">
          Anterior
        </button>
        <span>{"Página " + paginaActual + " de " + totalPaginas + " (" + totalElementos + " usuarios)"}</span>
        <button disabled={paginaActual >= totalPaginas} onClick={irAPaginaSiguiente} type="button">
          Siguiente
        </button>
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

      <form aria-label="Búsqueda y filtros" className="barra-filtros" onSubmit={aplicarFiltros}>
        <div className="form-field campo-busqueda">
          <label htmlFor="buscarUsuario">Buscar</label>
          <input
            id="buscarUsuario"
            onChange={cambiarBuscar}
            placeholder="Nombre, apellido o correo electrónico"
            type="text"
            value={buscar}
          />
        </div>
        <div className="form-field">
          <label htmlFor="rolUsuarioFiltro">Rol</label>
          <select id="rolUsuarioFiltro" onChange={cambiarRolFiltro} value={rolIdFiltro}>
            <option value="">Todos los roles</option>
            {roles.map((rol) => (
              <option key={rol.id} value={rol.id}>{rol.nombre}</option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="estadoUsuarioFiltro">Estado</label>
          <select id="estadoUsuarioFiltro" onChange={cambiarEstadoFiltro} value={estadoFiltro}>
            <option value="">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </div>
        <div className="barra-filtros-acciones">
          <button className="secondary-button" onClick={limpiarFiltros} type="button">
            Limpiar filtros
          </button>
          <button className="primary-button" type="submit">
            Aplicar filtros
          </button>
        </div>
      </form>

      <section className="panel">
        {mensajeError}
        {mensajeCargando}
        {mensajeSinResultados}
        {tablaUsuarios}
        {paginacion}
      </section>

      {modalBaja}
    </main>
  );
}
