"use client";

import { useEffect, useState } from "react";
import {
  crearEvidencia,
  listarEvidencias,
  obtenerEtiquetaTipoEvidencia,
  obtenerFechaDeHoy,
  obtenerUrlArchivoEvidencia,
} from "@/servicios/servicio-evidencias";
import type { Evidencia } from "@/tipos/evidencia";

type PropiedadesEvidenciasOrdenTrabajo = {
  ordenTrabajoId: number;
  permiteRegistrar: boolean;
};

export function EvidenciasOrdenTrabajo(props: PropiedadesEvidenciasOrdenTrabajo) {
  const [evidencias, setEvidencias] = useState<Evidencia[] | null>(null);
  const [errorCarga, setErrorCarga] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [tipo, setTipo] = useState("foto");
  const [observacion, setObservacion] = useState("");
  const [fechaRegistro, setFechaRegistro] = useState(obtenerFechaDeHoy());
  const [archivo, setArchivo] = useState<File | null>(null);
  const [estaEnviando, setEstaEnviando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");

  useEffect(() => {
    async function cargarEvidencias() {
      try {
        const evidenciasObtenidas = await listarEvidencias(props.ordenTrabajoId);
        setEvidencias(evidenciasObtenidas);
      } catch {
        setErrorCarga("No se pudo obtener el listado de evidencias.");
      }
    }

    cargarEvidencias();
  }, [props.ordenTrabajoId]);

  function abrirFormulario() {
    setMostrarFormulario(true);
    setMensajeExito("");
  }

  function cerrarFormulario() {
    setMostrarFormulario(false);
    setErrorFormulario("");
  }

  function cambiarTipo(evento: React.ChangeEvent<HTMLSelectElement>) {
    setTipo(evento.target.value);
  }

  function cambiarObservacion(evento: React.ChangeEvent<HTMLTextAreaElement>) {
    setObservacion(evento.target.value);
  }

  function cambiarFechaRegistro(evento: React.ChangeEvent<HTMLInputElement>) {
    setFechaRegistro(evento.target.value);
  }

  function cambiarArchivo(evento: React.ChangeEvent<HTMLInputElement>) {
    let archivoElegido: File | null = null;
    if (evento.target.files !== null && evento.target.files.length > 0) {
      archivoElegido = evento.target.files[0];
    }
    setArchivo(archivoElegido);
  }

  async function registrarEvidencia(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrorFormulario("");
    setEstaEnviando(true);

    let archivoParaEnviar = archivo;
    if (tipo === "observacion") {
      archivoParaEnviar = null;
    }

    try {
      const evidenciaCreada = await crearEvidencia(props.ordenTrabajoId, {
        tipo: tipo,
        observacion: observacion,
        fechaRegistro: fechaRegistro,
        archivo: archivoParaEnviar,
      });

      const evidenciasActualizadas: Evidencia[] = [];
      if (evidencias !== null) {
        for (const evidenciaExistente of evidencias) {
          evidenciasActualizadas.push(evidenciaExistente);
        }
      }
      evidenciasActualizadas.push(evidenciaCreada);
      setEvidencias(evidenciasActualizadas);

      setTipo("foto");
      setObservacion("");
      setFechaRegistro(obtenerFechaDeHoy());
      setArchivo(null);
      setMostrarFormulario(false);
      setMensajeExito("Evidencia registrada correctamente.");
    } catch (error) {
      let mensaje = "No se pudo registrar la evidencia.";
      if (error instanceof Error) {
        mensaje = error.message;
      }
      setErrorFormulario(mensaje);
    } finally {
      setEstaEnviando(false);
    }
  }

  let mensajeError = null;
  if (errorCarga) {
    mensajeError = <p className="form-error-banner">{errorCarga}</p>;
  }

  let avisoExito = null;
  if (mensajeExito) {
    avisoExito = <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{mensajeExito}</p>;
  }

  let listaEvidencias = <p className="empty-state">Cargando evidencias…</p>;
  if (evidencias !== null && evidencias.length === 0) {
    listaEvidencias = <p className="empty-state">Esta orden todavía no tiene evidencias registradas.</p>;
  }
  if (evidencias !== null && evidencias.length > 0) {
    listaEvidencias = (
      <ul className="grid gap-3">
        {evidencias.map((evidencia) => {
          let enlaceArchivo = null;
          if (evidencia.tieneArchivo) {
            enlaceArchivo = (
              <a
                className="text-link"
                href={obtenerUrlArchivoEvidencia(props.ordenTrabajoId, evidencia.id)}
                rel="noreferrer"
                target="_blank"
              >
                {"Ver archivo (" + evidencia.nombreArchivo + ")"}
              </a>
            );
          }

          const partesFecha = evidencia.fechaRegistro.split("-");
          const fechaVisible = partesFecha[2] + "/" + partesFecha[1] + "/" + partesFecha[0];

          return (
            <li className="rounded-lg border border-gray-200 p-4 text-sm" key={evidencia.id}>
              <strong>{obtenerEtiquetaTipoEvidencia(evidencia.tipo)}</strong>
              <span className="ml-2 text-xs text-gray-500">{fechaVisible}</span>
              <p className="mt-1 whitespace-pre-wrap">{evidencia.observacion}</p>
              {enlaceArchivo}
            </li>
          );
        })}
      </ul>
    );
  }

  let botonRegistrar = null;
  if (props.permiteRegistrar && !mostrarFormulario) {
    botonRegistrar = (
      <button className="primary-button" onClick={abrirFormulario} type="button">
        Registrar evidencia
      </button>
    );
  }

  let formulario = null;
  if (props.permiteRegistrar && mostrarFormulario) {
    let mensajeErrorFormulario = null;
    if (errorFormulario) {
      mensajeErrorFormulario = <p className="form-error-banner">{errorFormulario}</p>;
    }

    let campoArchivo = null;
    if (tipo !== "observacion") {
      let tiposAceptados = "image/jpeg,image/png,application/pdf";
      if (tipo === "foto") {
        tiposAceptados = "image/jpeg,image/png";
      }

      campoArchivo = (
        <div className="form-field">
          <label htmlFor="archivoEvidencia">Archivo adjunto</label>
          <input accept={tiposAceptados} id="archivoEvidencia" onChange={cambiarArchivo} type="file" />
          <span className="text-xs text-gray-500">JPG o PNG para fotos; PDF, JPG o PNG para documentos. Hasta 10 MB.</span>
        </div>
      );
    }

    let textoBoton = "Confirmar evidencia";
    if (estaEnviando) {
      textoBoton = "Guardando…";
    }

    formulario = (
      <form className="mb-6 rounded-lg border border-gray-200 p-4" onSubmit={registrarEvidencia}>
        {mensajeErrorFormulario}
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="tipoEvidencia">Tipo de evidencia</label>
            <select id="tipoEvidencia" onChange={cambiarTipo} value={tipo}>
              <option value="foto">Foto</option>
              <option value="documento">Documento</option>
              <option value="observacion">Observación</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="fechaRegistroEvidencia">Fecha de registro</label>
            <input
              id="fechaRegistroEvidencia"
              max={obtenerFechaDeHoy()}
              onChange={cambiarFechaRegistro}
              required
              type="date"
              value={fechaRegistro}
            />
          </div>
          {campoArchivo}
        </div>
        <div className="form-field form-field-full">
          <label htmlFor="observacionEvidencia">Observación o descripción</label>
          <textarea id="observacionEvidencia" onChange={cambiarObservacion} rows={3} value={observacion} />
        </div>
        <div className="form-actions">
          <button className="secondary-button" onClick={cerrarFormulario} type="button">
            Cancelar
          </button>
          <button className="primary-button" disabled={estaEnviando} type="submit">
            {textoBoton}
          </button>
        </div>
      </form>
    );
  }

  return (
    <section className="panel detail-panel">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2>Evidencias</h2>
        {botonRegistrar}
      </div>
      {avisoExito}
      {mensajeError}
      {formulario}
      {listaEvidencias}
    </section>
  );
}
