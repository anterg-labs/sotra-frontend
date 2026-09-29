"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ModalConfirmacion } from "@/componentes/modal-confirmacion";
import { desactivarTipoMaquina, listarTiposMaquina } from "@/servicios/servicio-tipos-maquina";
import type { TipoMaquina } from "@/tipos/tipo-maquina";

export function ListadoTiposMaquina() {
  const [tiposMaquina, setTiposMaquina] = useState<TipoMaquina[] | null>(null);
  const [errorCarga, setErrorCarga] = useState("");
  const [tipoDesactivandoId, setTipoDesactivandoId] = useState<number | null>(null);
  const [tipoPendienteDesactivacion, setTipoPendienteDesactivacion] = useState<TipoMaquina | null>(null);

  useEffect(() => {
    async function cargarTiposMaquina() {
      setTiposMaquina(null);
      setErrorCarga("");

      try {
        const tiposObtenidos = await listarTiposMaquina();
        setTiposMaquina(tiposObtenidos);
      } catch {
        setErrorCarga("No se pudo obtener el listado de tipos de máquina.");
      }
    }

    cargarTiposMaquina();
  }, []);

  function pedirBajaTipo(tipoMaquina: TipoMaquina) {
    setTipoPendienteDesactivacion(tipoMaquina);
  }

  function cancelarBaja() {
    setTipoPendienteDesactivacion(null);
  }

  async function confirmarDesactivacion() {
    if (!tipoPendienteDesactivacion) {
      return;
    }

    const tipoMaquinaId = tipoPendienteDesactivacion.id;
    setTipoDesactivandoId(tipoMaquinaId);

    try {
      await desactivarTipoMaquina(tipoMaquinaId);
      const tiposActualizados = await listarTiposMaquina();
      setTiposMaquina(tiposActualizados);
      setTipoPendienteDesactivacion(null);
    } catch {
      setErrorCarga("No se pudo dar de baja el tipo de máquina seleccionado.");
    } finally {
      setTipoDesactivandoId(null);
    }
  }

  let mensajeError = null;
  if (errorCarga) {
    mensajeError = <p className="form-error-banner">{errorCarga}</p>;
  }

  let mensajeCargando = null;
  if (tiposMaquina === null && !errorCarga) {
    mensajeCargando = <p className="empty-state">Cargando tipos de máquina…</p>;
  }

  let mensajeSinResultados = null;
  if (tiposMaquina !== null && tiposMaquina.length === 0) {
    mensajeSinResultados = <p className="empty-state">No hay tipos de máquina registrados.</p>;
  }

  let tablaTipos = null;
  if (tiposMaquina !== null && tiposMaquina.length > 0) {
    tablaTipos = (
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tiposMaquina.map((tipoMaquina) => {
              let claseEstado = "status status-inactivo";
              let textoEstado = "Inactivo";
              if (tipoMaquina.estado === "activo") {
                claseEstado = "status status-activo";
                textoEstado = "Activo";
              }

              let botonBaja = null;
              if (tipoMaquina.estado === "activo") {
                botonBaja = (
                  <button
                    aria-label="Dar de baja"
                    className="table-action-link table-action-link-danger"
                    disabled={tipoDesactivandoId === tipoMaquina.id}
                    onClick={() => pedirBajaTipo(tipoMaquina)}
                    title="Dar de baja"
                    type="button"
                  >
                    Dar de baja
                  </button>
                );
              }

              return (
                <tr key={tipoMaquina.id}>
                  <td><strong>{tipoMaquina.nombre}</strong></td>
                  <td>
                    <span className={claseEstado}>{textoEstado}</span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <Link
                        aria-label="Modificar tipo de máquina"
                        className="table-action-link"
                        href={"/activos/tipos/" + tipoMaquina.id + "/editar"}
                        title="Modificar tipo de máquina"
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
  if (tipoPendienteDesactivacion) {
    modalBaja = (
      <ModalConfirmacion
        descripcion={
          "¿Confirmás la baja de " +
          tipoPendienteDesactivacion.nombre +
          "? El tipo no se elimina, pero ya no se podrá usar en modelos nuevos."
        }
        estaConfirmando={tipoDesactivandoId === tipoPendienteDesactivacion.id}
        etiquetaConfirmar="Dar de baja"
        onCancelar={cancelarBaja}
        onConfirmar={confirmarDesactivacion}
        titulo="Dar de baja tipo de máquina"
      />
    );
  }

  return (
    <div className="mb-8">
      <header className="page-heading">
        <div>
          <h2>Tipos de máquina</h2>
        </div>
        <Link className="primary-button" href="/activos/tipos/nuevo">
          Registrar tipo
        </Link>
      </header>

      <section className="panel">
        {mensajeError}
        {mensajeCargando}
        {mensajeSinResultados}
        {tablaTipos}
      </section>

      {modalBaja}
    </div>
  );
}
