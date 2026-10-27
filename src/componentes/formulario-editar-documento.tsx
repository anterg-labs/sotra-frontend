"use client";

import { BotonCancelarFormulario, useSalidaDeFormulario } from "@/componentes/modal-de-ruta";
import { useState } from "react";
import { Combobox } from "@/componentes/combobox";
import { listarActivosPaginados } from "@/servicios/servicio-activos";
import { listarModelosMaquinaPaginados } from "@/servicios/servicio-modelos-maquina";
import {
  LARGO_MAXIMO_DESCRIPCION_DOCUMENTO,
  LARGO_MAXIMO_TITULO_DOCUMENTO,
  esTipoDocumento,
  obtenerEtiquetaTipoDocumento,
  TIPOS_DOCUMENTO,
  type ActualizarDocumentoTecnicoInput,
  type DocumentoTecnico,
  type TipoDocumento,
} from "@/tipos/documento-tecnico";
import type { ResultadoGuardar } from "@/tipos/resultado-accion";
import { AvisoEnLinea } from "@/componentes/aviso-en-linea";

type PropiedadesFormularioEditarDocumento = {
  documento: DocumentoTecnico;
  accion: (datos: ActualizarDocumentoTecnicoInput) => Promise<ResultadoGuardar<DocumentoTecnico>>;
};

/** Modifica los datos generales de un documento; el archivo no se cambia (hay que eliminarlo y cargarlo de nuevo). */
export function FormularioEditarDocumento(props: PropiedadesFormularioEditarDocumento) {
  const { documento, accion } = props;
  const { terminar } = useSalidaDeFormulario();
  const [titulo, setTitulo] = useState(documento.titulo === documento.nombreArchivo ? "" : documento.titulo);
  const [tipo, setTipo] = useState<TipoDocumento>(documento.tipo);
  const [descripcion, setDescripcion] = useState(documento.descripcion ?? "");
  const [activoId, setActivoId] = useState(documento.activoId === null ? "" : String(documento.activoId));
  const [modeloMaquinaId, setModeloMaquinaId] = useState(documento.modeloMaquinaId === null ? "" : String(documento.modeloMaquinaId));
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [estaGuardando, setEstaGuardando] = useState(false);

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrorGeneral("");
    const erroresLocales: Record<string, string> = {};
    if (titulo.trim().length > LARGO_MAXIMO_TITULO_DOCUMENTO) erroresLocales.titulo = `El título no puede superar ${LARGO_MAXIMO_TITULO_DOCUMENTO} caracteres.`;
    if (descripcion.trim().length > LARGO_MAXIMO_DESCRIPCION_DOCUMENTO) erroresLocales.descripcion = `La descripción no puede superar ${LARGO_MAXIMO_DESCRIPCION_DOCUMENTO} caracteres.`;
    setErrores(erroresLocales);
    const primero = Object.keys(erroresLocales)[0];
    if (primero) {
      document.getElementById(primero)?.focus();
      return;
    }

    setEstaGuardando(true);
    try {
      const resultado = await accion({
        titulo: titulo.trim() || null,
        tipo,
        descripcion: descripcion.trim() || null,
        activoId: activoId === "" ? null : Number(activoId),
        modeloMaquinaId: modeloMaquinaId === "" ? null : Number(modeloMaquinaId),
      });
      if (resultado.exito) {
        terminar("/documentacion-tecnica/" + documento.id);
        return;
      }
      setErrores(resultado.errores);
      setErrorGeneral(resultado.mensaje);
    } finally {
      setEstaGuardando(false);
    }
  }

  return (
    <form noValidate onSubmit={enviar}>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="titulo">Título</label>
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
          <select id="tipoDocumento" onChange={(evento) => { if (esTipoDocumento(evento.target.value)) setTipo(evento.target.value); }} value={tipo}>
            {TIPOS_DOCUMENTO.map((tipoDisponible) => (
              <option key={tipoDisponible} value={tipoDisponible}>{obtenerEtiquetaTipoDocumento(tipoDisponible)}</option>
            ))}
          </select>
        </div>

        <div className="form-field form-field-full">
          <label htmlFor="descripcion">Descripción</label>
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
            return pagina.elementos.map((activo) => ({ valor: String(activo.id), etiqueta: activo.nombre || activo.numSerie }));
          }}
          etiqueta="Activo asociado"
          id="activoId"
          opciones={documento.activoId === null ? [] : [{ valor: String(documento.activoId), etiqueta: documento.nombreActivo ?? "Activo " + documento.activoId }]}
          textoVacio="Sin activo asociado"
          valor={activoId}
        />

        <Combobox
          alCambiar={setModeloMaquinaId}
          buscarOpciones={async (consulta) => {
            const pagina = await listarModelosMaquinaPaginados({ buscar: consulta, tipoMaquinaId: "", estado: "activo", pagina: 1 });
            return pagina.elementos.map((modelo) => ({ valor: String(modelo.id), etiqueta: modelo.nombre }));
          }}
          etiqueta="Modelo de máquina"
          id="modeloMaquinaId"
          opciones={documento.modeloMaquinaId === null ? [] : [{ valor: String(documento.modeloMaquinaId), etiqueta: documento.nombreModelo ?? "Modelo " + documento.modeloMaquinaId }]}
          textoVacio="Sin modelo asociado"
          valor={modeloMaquinaId}
        />
      </div>

      {errorGeneral ? <AvisoEnLinea>{errorGeneral}</AvisoEnLinea> : null}

      <div className="form-actions">
        <BotonCancelarFormulario href={"/documentacion-tecnica/" + documento.id} />
        <button className="primary-button" disabled={estaGuardando} type="submit">
          {estaGuardando ? "Guardando…" : "Confirmar modificación"}
        </button>
      </div>
    </form>
  );
}
