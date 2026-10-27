"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Combobox } from "@/componentes/combobox";
import { listarActivosPaginados } from "@/servicios/servicio-activos";
import { listarModelosMaquinaPaginados } from "@/servicios/servicio-modelos-maquina";
import { crearDocumentoTecnico, obtenerErrorArchivoPdf } from "@/servicios/servicio-documentos-tecnicos";
import type { Activo } from "@/tipos/activo";
import {
  LARGO_MAXIMO_DESCRIPCION_DOCUMENTO,
  LARGO_MAXIMO_TITULO_DOCUMENTO,
  obtenerEtiquetaTipoDocumento,
  TIPO_DOCUMENTO_POR_DEFECTO,
  TIPOS_DOCUMENTO,
  esTipoDocumento,
  type CrearDocumentoTecnicoInput,
  type TipoDocumento,
} from "@/tipos/documento-tecnico";
import { AvisoEnLinea } from "@/componentes/aviso-en-linea";

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
  const [modeloMaquinaId, setModeloMaquinaId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<TipoDocumento>(TIPO_DOCUMENTO_POR_DEFECTO);
  const [descripcion, setDescripcion] = useState("");
  const [errores, setErrores] = useState<{ titulo?: string; descripcion?: string }>({});
  const [estaEnviando, setEstaEnviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState("");
  const [errorArchivo, setErrorArchivo] = useState("");
  const referenciaErrorGeneral = useRef<HTMLDivElement>(null);

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

    const erroresDetectados: { titulo?: string; descripcion?: string } = {};
    if (titulo.trim().length > LARGO_MAXIMO_TITULO_DOCUMENTO) {
      erroresDetectados.titulo = `El título no puede superar ${LARGO_MAXIMO_TITULO_DOCUMENTO} caracteres.`;
    }
    if (descripcion.trim().length > LARGO_MAXIMO_DESCRIPCION_DOCUMENTO) {
      erroresDetectados.descripcion = `La descripción no puede superar ${LARGO_MAXIMO_DESCRIPCION_DOCUMENTO} caracteres.`;
    }
    setErrores(erroresDetectados);
    const campoConError = erroresDetectados.titulo ? "titulo" : erroresDetectados.descripcion ? "descripcion" : null;
    if (campoConError) {
      document.getElementById(campoConError)?.focus();
      return;
    }
    setEstaEnviando(true);

    let activoIdParaGuardar: number | null = null;
    if (activoId !== "") {
      activoIdParaGuardar = Number(activoId);
    }

    const documentoParaGuardar: CrearDocumentoTecnicoInput = {
      archivo,
      titulo,
      tipo,
      descripcion,
      activoId: activoIdParaGuardar,
      modeloMaquinaId: modeloMaquinaId === "" ? null : Number(modeloMaquinaId),
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
    mensajeError = <AvisoEnLinea ref={referenciaErrorGeneral}>{errorGeneral}</AvisoEnLinea>;
  }

  let mensajeProcesando = null;
  if (estaEnviando && usaSugerenciasIA) {
    mensajeProcesando = (
      <p className="empty-state">
        Subiendo el documento. Al terminar, se procesa para las sugerencias de IA en segundo plano: podés seguir usando el sistema.
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

        <div className="form-field">
          <label htmlFor="titulo">Título (opcional)</label>
          <input
            aria-describedby={errores.titulo ? "titulo-error" : undefined}
            aria-invalid={errores.titulo ? true : undefined}
            id="titulo"
            onChange={(evento) => setTitulo(evento.target.value)}
            placeholder="Si lo dejás vacío se usa el nombre del archivo"
            type="text"
            value={titulo}
          />
          {errores.titulo ? <p className="field-error" id="titulo-error" role="alert">{errores.titulo}</p> : null}
        </div>

        <div className="form-field">
          <label htmlFor="tipoDocumento">Tipo de documento</label>
          <select
            id="tipoDocumento"
            onChange={(evento) => { if (esTipoDocumento(evento.target.value)) setTipo(evento.target.value); }}
            value={tipo}
          >
            {TIPOS_DOCUMENTO.map((tipoDisponible) => (
              <option key={tipoDisponible} value={tipoDisponible}>{obtenerEtiquetaTipoDocumento(tipoDisponible)}</option>
            ))}
          </select>
        </div>

        <div className="form-field form-field-full">
          <label htmlFor="descripcion">Descripción (opcional)</label>
          <textarea
            aria-describedby={errores.descripcion ? "descripcion-error" : undefined}
            aria-invalid={errores.descripcion ? true : undefined}
            id="descripcion"
            onChange={(evento) => setDescripcion(evento.target.value)}
            rows={3}
            value={descripcion}
          />
          {errores.descripcion ? <p className="field-error" id="descripcion-error" role="alert">{errores.descripcion}</p> : null}
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

        <Combobox
          alCambiar={setModeloMaquinaId}
          buscarOpciones={async (consulta) => {
            const pagina = await listarModelosMaquinaPaginados({ buscar: consulta, tipoMaquinaId: "", estado: "activo", pagina: 1 });
            return pagina.elementos.map((modelo) => ({ valor: String(modelo.id), etiqueta: modelo.nombre }));
          }}
          etiqueta="Modelo de máquina (opcional)"
          id="modeloMaquinaId"
          opciones={[]}
          textoVacio="Sin modelo asociado"
          valor={modeloMaquinaId}
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
