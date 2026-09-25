"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Activo } from "@/tipos/activo";
import type { CrearDocumentoTecnicoInput, DocumentoTecnico } from "@/tipos/documento-tecnico";

type PropiedadesFormularioDocumentoTecnico = {
  activos: Activo[];
  alEnviar: (documento: CrearDocumentoTecnicoInput) => Promise<DocumentoTecnico>;
};

export function FormularioDocumentoTecnico(props: PropiedadesFormularioDocumentoTecnico) {
  const activos = props.activos;
  const alEnviar = props.alEnviar;

  const enrutador = useRouter();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [usaSugerenciasIA, setUsaSugerenciasIA] = useState(false);
  const [activoId, setActivoId] = useState("");
  const [estaEnviando, setEstaEnviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState("");

  function cambiarArchivo(evento: React.ChangeEvent<HTMLInputElement>) {
    const archivosSeleccionados = evento.target.files;

    if (archivosSeleccionados && archivosSeleccionados.length > 0) {
      setArchivo(archivosSeleccionados[0]);
    } else {
      setArchivo(null);
    }
  }

  function cambiarUsoSugerenciasIA(evento: React.ChangeEvent<HTMLInputElement>) {
    setUsaSugerenciasIA(evento.target.checked);
  }

  function cambiarActivo(evento: React.ChangeEvent<HTMLSelectElement>) {
    setActivoId(evento.target.value);
  }

  async function enviarFormulario(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEstaEnviando(true);
    setErrorGeneral("");

    let activoIdParaGuardar: number | null = null;
    if (activoId !== "") {
      activoIdParaGuardar = Number(activoId);
    }

    const documentoParaGuardar: CrearDocumentoTecnicoInput = {
      archivo,
      activoId: activoIdParaGuardar,
      usaSugerenciasIA,
    };

    try {
      await alEnviar(documentoParaGuardar);
      enrutador.push("/documentacion-tecnica");
    } catch (error) {
      if (error instanceof Error) {
        setErrorGeneral(error.message);
      } else {
        setErrorGeneral("No se pudo guardar el documento técnico.");
      }
    } finally {
      setEstaEnviando(false);
    }
  }

  let mensajeError = null;
  if (errorGeneral) {
    mensajeError = <p className="form-error-banner">{errorGeneral}</p>;
  }

  let mensajeProcesando = null;
  if (estaEnviando && usaSugerenciasIA) {
    mensajeProcesando = (
      <p className="empty-state">
        Procesando el documento para las sugerencias de IA. Puede tardar varios minutos; no cierres esta pantalla.
      </p>
    );
  }

  let textoBoton = "Guardar documento";
  if (estaEnviando) {
    textoBoton = "Guardando…";
  }

  return (
    <form onSubmit={enviarFormulario}>
      {mensajeError}

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="archivo">Archivo PDF</label>
          <input accept=".pdf,application/pdf" id="archivo" onChange={cambiarArchivo} required type="file" />
        </div>

        <div className="form-field">
          <label htmlFor="activoId">Activo asociado (opcional)</label>
          <select id="activoId" onChange={cambiarActivo} value={activoId}>
            <option value="">Sin activo asociado</option>
            {activos.map((activo) => (
              <option key={activo.id} value={activo.id}>{activo.nombre + " (" + activo.nombreCliente + ")"}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-field form-field-full">
        <div>
          <input
            checked={usaSugerenciasIA}
            id="usaSugerenciasIA"
            onChange={cambiarUsoSugerenciasIA}
            type="checkbox"
          />
          <label htmlFor="usaSugerenciasIA"> Usar este documento para las sugerencias de IA</label>
        </div>
      </div>

      {mensajeProcesando}

      <div className="form-actions">
        <Link className="secondary-button" href="/documentacion-tecnica">
          Cancelar
        </Link>
        <button className="primary-button" disabled={estaEnviando} type="submit">
          {textoBoton}
        </button>
      </div>
    </form>
  );
}
