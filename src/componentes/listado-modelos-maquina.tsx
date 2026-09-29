"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ModalConfirmacion } from "@/componentes/modal-confirmacion";
import { desactivarModeloMaquina, listarModelosMaquina } from "@/servicios/servicio-modelos-maquina";
import { listarTiposMaquina } from "@/servicios/servicio-tipos-maquina";
import type { ModeloMaquina } from "@/tipos/modelo-maquina";
import type { TipoMaquina } from "@/tipos/tipo-maquina";

export function ListadoModelosMaquina() {
  const [modelosMaquina, setModelosMaquina] = useState<ModeloMaquina[] | null>(null);
  const [tiposMaquina, setTiposMaquina] = useState<TipoMaquina[]>([]);
  const [errorCarga, setErrorCarga] = useState("");
  const [modeloDesactivandoId, setModeloDesactivandoId] = useState<number | null>(null);
  const [modeloPendienteDesactivacion, setModeloPendienteDesactivacion] = useState<ModeloMaquina | null>(null);

  useEffect(() => {
    async function cargarModelosMaquina() {
      setModelosMaquina(null);
      setErrorCarga("");

      try {
        const modelosObtenidos = await listarModelosMaquina();
        const tiposObtenidos = await listarTiposMaquina();
        setTiposMaquina(tiposObtenidos);
        setModelosMaquina(modelosObtenidos);
      } catch {
        setErrorCarga("No se pudo obtener el listado de modelos de máquina.");
      }
    }

    cargarModelosMaquina();
  }, []);

  function obtenerNombreTipo(tipoMaquinaId: number) {
    for (const tipoMaquina of tiposMaquina) {
      if (tipoMaquina.id === tipoMaquinaId) {
        return tipoMaquina.nombre;
      }
    }

    return "Sin tipo";
  }

  function pedirBajaModelo(modeloMaquina: ModeloMaquina) {
    setModeloPendienteDesactivacion(modeloMaquina);
  }

  function cancelarBaja() {
    setModeloPendienteDesactivacion(null);
  }

  async function confirmarDesactivacion() {
    if (!modeloPendienteDesactivacion) {
      return;
    }

    const modeloMaquinaId = modeloPendienteDesactivacion.id;
    setModeloDesactivandoId(modeloMaquinaId);

    try {
      await desactivarModeloMaquina(modeloMaquinaId);
      const modelosActualizados = await listarModelosMaquina();
      setModelosMaquina(modelosActualizados);
      setModeloPendienteDesactivacion(null);
    } catch {
      setErrorCarga("No se pudo dar de baja el modelo de máquina seleccionado.");
    } finally {
      setModeloDesactivandoId(null);
    }
  }

  let mensajeError = null;
  if (errorCarga) {
    mensajeError = <p className="form-error-banner">{errorCarga}</p>;
  }

  let mensajeCargando = null;
  if (modelosMaquina === null && !errorCarga) {
    mensajeCargando = <p className="empty-state">Cargando modelos de máquina…</p>;
  }

  let mensajeSinResultados = null;
  if (modelosMaquina !== null && modelosMaquina.length === 0) {
    mensajeSinResultados = <p className="empty-state">No hay modelos de máquina registrados.</p>;
  }

  let tablaModelos = null;
  if (modelosMaquina !== null && modelosMaquina.length > 0) {
    tablaModelos = (
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {modelosMaquina.map((modeloMaquina) => {
              let claseEstado = "status status-inactivo";
              let textoEstado = "Inactivo";
              if (modeloMaquina.estado === "activo") {
                claseEstado = "status status-activo";
                textoEstado = "Activo";
              }

              let botonBaja = null;
              if (modeloMaquina.estado === "activo") {
                botonBaja = (
                  <button
                    aria-label="Dar de baja"
                    className="table-action-link table-action-link-danger"
                    disabled={modeloDesactivandoId === modeloMaquina.id}
                    onClick={() => pedirBajaModelo(modeloMaquina)}
                    title="Dar de baja"
                    type="button"
                  >
                    Dar de baja
                  </button>
                );
              }

              return (
                <tr key={modeloMaquina.id}>
                  <td><strong>{modeloMaquina.nombre}</strong></td>
                  <td>{obtenerNombreTipo(modeloMaquina.tipoMaquinaId)}</td>
                  <td>{modeloMaquina.descripcion}</td>
                  <td>
                    <span className={claseEstado}>{textoEstado}</span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <Link
                        aria-label="Modificar modelo de máquina"
                        className="table-action-link"
                        href={"/activos/modelos/" + modeloMaquina.id + "/editar"}
                        title="Modificar modelo de máquina"
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
  if (modeloPendienteDesactivacion) {
    modalBaja = (
      <ModalConfirmacion
        descripcion={
          "¿Confirmás la baja de " +
          modeloPendienteDesactivacion.nombre +
          "? El modelo no se elimina, pero ya no se podrá usar en activos nuevos."
        }
        estaConfirmando={modeloDesactivandoId === modeloPendienteDesactivacion.id}
        etiquetaConfirmar="Dar de baja"
        onCancelar={cancelarBaja}
        onConfirmar={confirmarDesactivacion}
        titulo="Dar de baja modelo de máquina"
      />
    );
  }

  return (
    <div className="mb-8">
      <header className="page-heading">
        <div>
          <h2>Modelos de máquina</h2>
        </div>
        <Link className="primary-button" href="/activos/modelos/nuevo">
          Registrar modelo
        </Link>
      </header>

      <section className="panel">
        {mensajeError}
        {mensajeCargando}
        {mensajeSinResultados}
        {tablaModelos}
      </section>

      {modalBaja}
    </div>
  );
}
