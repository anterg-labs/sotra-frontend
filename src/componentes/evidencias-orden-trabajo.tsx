"use client";

import { useEffect, useRef, useState } from "react";
import {
  crearEvidencia,
  listarEvidencias,
  obtenerEtiquetaTipoEvidencia,
  obtenerErroresEvidencia,
  obtenerFechaDeHoy,
  obtenerUrlArchivoEvidencia,
} from "@/servicios/servicio-evidencias";
import type { Evidencia } from "@/tipos/evidencia";
import { AvisoEnLinea } from "@/componentes/aviso-en-linea";

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
  const [errores, setErrores] = useState<ReturnType<typeof obtenerErroresEvidencia>>({});
  const referenciaErrorFormulario = useRef<HTMLDivElement>(null);
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
    setErrores({});
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

    let archivoParaEnviar = archivo;
    if (tipo === "observacion") {
      archivoParaEnviar = null;
    }

    const datos = { tipo, observacion, fechaRegistro, archivo: archivoParaEnviar };
    const erroresDetectados = obtenerErroresEvidencia(datos);
    setErrores(erroresDetectados);
    const primerCampo = Object.keys(erroresDetectados)[0];
    if (primerCampo) {
      const idCampo = { tipo: "tipoEvidencia", fechaRegistro: "fechaRegistroEvidencia", archivo: "archivoEvidencia", observacion: "observacionEvidencia" }[primerCampo];
      if (idCampo) document.getElementById(idCampo)?.focus();
      return;
    }
    setEstaEnviando(true);

    try {
      const evidenciaCreada = await crearEvidencia(props.ordenTrabajoId, datos);

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
      window.requestAnimationFrame(() => referenciaErrorFormulario.current?.focus());
    } finally {
      setEstaEnviando(false);
    }
  }

  let mensajeError = null;
  if (errorCarga) {
    mensajeError = <p className="form-error-banner" role="alert">{errorCarga}</p>;
  }

  let avisoExito = null;
  if (mensajeExito) {
    avisoExito = <p className="mb-4 rounded-lg u-fondo-exito p-3 text-sm">{mensajeExito}</p>;
  }

  let listaEvidencias: React.ReactNode = <p className="empty-state">Cargando evidencias…</p>;
  if (errorCarga) {
    listaEvidencias = null;
  }
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
            <li className="min-w-0 rounded-lg border u-borde p-4 text-sm" key={evidencia.id}>
              <strong>{obtenerEtiquetaTipoEvidencia(evidencia.tipo)}</strong>
              <span className="ml-2 text-xs texto-tenue">{fechaVisible}</span>
              <p className="mt-1 break-words whitespace-pre-wrap">{evidencia.observacion}</p>
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
      mensajeErrorFormulario = <AvisoEnLinea ref={referenciaErrorFormulario}>{errorFormulario}</AvisoEnLinea>;
    }

    let campoArchivo = null;
    if (tipo !== "observacion") {
      let tiposAceptados = "image/jpeg,image/png,application/pdf";
      if (tipo === "foto") {
        tiposAceptados = "image/jpeg,image/png";
      }

      campoArchivo = (
        <div className="form-field campo-archivo-evidencia">
          <span id="etiquetaArchivoEvidencia">Archivo adjunto</span>
          <input
            accept={tiposAceptados}
            aria-labelledby="etiquetaArchivoEvidencia"
            aria-describedby={errores.archivo ? "archivoEvidencia-error" : undefined}
            aria-invalid={errores.archivo ? true : undefined}
            capture={tipo === "foto" ? "environment" : undefined}
            className="entrada-archivo-evidencia"
            id="archivoEvidencia"
            onChange={cambiarArchivo}
            type="file"
          />
          <label className="secondary-button selector-archivo-evidencia" htmlFor="archivoEvidencia">Elegir archivo o tomar foto</label>
          <span className="nombre-archivo-evidencia" aria-live="polite">
            {archivo?.name ?? "Ningún archivo seleccionado"}
          </span>
          <span className="break-words text-xs texto-tenue">JPG o PNG para fotos; PDF, JPG o PNG para documentos. Hasta 10 MB.</span>
          {errores.archivo ? <p className="field-error" id="archivoEvidencia-error" role="alert">{errores.archivo}</p> : null}
        </div>
      );
    }

    let textoBoton = "Confirmar evidencia";
    if (estaEnviando) {
      textoBoton = "Guardando…";
    }

    formulario = (
      <form className="formulario-evidencia mb-6 min-w-0 max-w-full rounded-lg border u-borde p-4" noValidate onSubmit={registrarEvidencia}>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="tipoEvidencia">Tipo de evidencia</label>
            <select aria-describedby={errores.tipo ? "tipoEvidencia-error" : undefined} aria-invalid={errores.tipo ? true : undefined} id="tipoEvidencia" onChange={cambiarTipo} value={tipo}>
              <option value="foto">Foto</option>
              <option value="documento">Documento</option>
              <option value="observacion">Observación</option>
            </select>
            {errores.tipo ? <p className="field-error" id="tipoEvidencia-error" role="alert">{errores.tipo}</p> : null}
          </div>
          <div className="form-field">
            <label htmlFor="fechaRegistroEvidencia">Fecha de registro</label>
            <input
              aria-describedby={errores.fechaRegistro ? "fechaRegistroEvidencia-error" : undefined}
              aria-invalid={errores.fechaRegistro ? true : undefined}
              id="fechaRegistroEvidencia"
              max={obtenerFechaDeHoy()}
              onChange={cambiarFechaRegistro}
              required
              type="date"
              value={fechaRegistro}
            />
            {errores.fechaRegistro ? <p className="field-error" id="fechaRegistroEvidencia-error" role="alert">{errores.fechaRegistro}</p> : null}
          </div>
          {campoArchivo}
        </div>
        <div className="form-field form-field-full">
          <label htmlFor="observacionEvidencia">Observación o descripción</label>
          <textarea aria-describedby={errores.observacion ? "observacionEvidencia-error" : undefined} aria-invalid={errores.observacion ? true : undefined} id="observacionEvidencia" onChange={cambiarObservacion} rows={3} value={observacion} />
          {errores.observacion ? <p className="field-error" id="observacionEvidencia-error" role="alert">{errores.observacion}</p> : null}
        </div>
        {mensajeErrorFormulario}
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
    <section className="panel detail-panel min-w-0">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
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
