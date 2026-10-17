"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Combobox } from "@/componentes/combobox";
import { listarActivosPaginados } from "@/servicios/servicio-activos";
import { crearDocumentoTecnico, obtenerErrorArchivoPdf } from "@/servicios/servicio-documentos-tecnicos";
import type { Activo } from "@/tipos/activo";
import type { CrearDocumentoTecnicoInput } from "@/tipos/documento-tecnico";

type PropiedadesFormularioDocumentoTecnico = {
  activos: Activo[];
  /** La subida del PDF va directo del navegador a la API (multipart); evita el límite de cuerpo de las Server Actions y el tiempo de procesamiento de la IA. */
  alEnviar?: (documento: CrearDocumentoTecnicoInput) => Promise<unknown>;
};

export function FormularioDocumentoTecnico(props: PropiedadesFormularioDocumentoTecnico) {
  const activos = props.activos;
  const alEnviar = props.alEnviar ?? crearDocumentoTecnico;

  const enrutador = useRouter();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [usaSugerenciasIA, setUsaSugerenciasIA] = useState(false);
  const [activoId, setActivoId] = useState("");
  const [estaEnviando, setEstaEnviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState("");
  const [errorArchivo, setErrorArchivo] = useState("");
  const referenciaErrorGeneral = useRef<HTMLParagraphElement>(null);

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

  async function enviarFormulario(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrorGeneral("");

    const errorArchivoDetectado = await obtenerErrorArchivoPdf(archivo);
    setErrorArchivo(errorArchivoDetectado ?? "");
    if (errorArchivoDetectado) {
      document.getElementById("archivo")?.focus();
      return;
    }
    setEstaEnviando(true);

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
      window.requestAnimationFrame(() => referenciaErrorGeneral.current?.focus());
    } finally {
      setEstaEnviando(false);
    }
  }

  let mensajeError = null;
  if (errorGeneral) {
    mensajeError = <p className="form-error-banner" ref={referenciaErrorGeneral} role="alert" tabIndex={-1}>{errorGeneral}</p>;
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
    <form noValidate onSubmit={enviarFormulario}>

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="archivo">Archivo PDF</label>
          <input accept=".pdf,application/pdf" aria-describedby={errorArchivo ? "archivo-error" : undefined} aria-invalid={errorArchivo ? true : undefined} id="archivo" onChange={cambiarArchivo} required type="file" />
          {errorArchivo ? <p className="field-error" id="archivo-error" role="alert">{errorArchivo}</p> : null}
        </div>

        <Combobox
          alCambiar={setActivoId}
          buscarOpciones={async (consulta) => {
            const pagina = await listarActivosPaginados({ buscar: consulta, clienteId: "", modeloMaquinaId: "", estado: "activo", pagina: 1 });
            return pagina.elementos.map((activo) => ({
              valor: String(activo.id),
              etiqueta: `${activo.nombre || activo.numSerie} (cliente ${activo.clienteId})`,
            }));
          }}
          etiqueta="Activo asociado (opcional)"
          id="activoId"
          opciones={activos.map((activo) => ({
            valor: String(activo.id),
            etiqueta: `${activo.nombre || activo.numSerie} (cliente ${activo.clienteId})`,
          }))}
          textoVacio="Sin activo asociado"
          valor={activoId}
        />
      </div>

      <div className="form-field form-field-full">
        <div>
          <input
            checked={usaSugerenciasIA}
            id="usaSugerenciasIA"
            onChange={cambiarUsoSugerenciasIA}
            role="switch"
            type="checkbox"
          />
          <label htmlFor="usaSugerenciasIA"> Usar este documento para las sugerencias de IA</label>
        </div>
      </div>

      {mensajeProcesando}

      {mensajeError}

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
