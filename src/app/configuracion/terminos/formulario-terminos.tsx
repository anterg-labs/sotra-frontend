"use client";

import { useState } from "react";
import { useAvisos } from "@/componentes/avisos";
import { ModalConfirmacion } from "@/componentes/modal-confirmacion";
import { DialogoTerminos } from "@/componentes/terminos/dialogo-terminos";
import { DocumentoTerminos } from "@/componentes/terminos/documento-terminos";
import { EditorMarkdown } from "@/componentes/terminos/editor-markdown";
import { EVENTO_TERMINOS_PUBLICADOS } from "@/componentes/terminos/modal-terminos";
import { useFormularioAccion } from "@/componentes/use-formulario-accion";
import type { TerminosCondiciones } from "@/tipos/terminos";
import { LARGO_MAXIMO_TEXTO, validarTerminos } from "@/validaciones/terminos";
import { publicarTerminosAccion } from "./acciones";
import { AvisoEnLinea } from "@/componentes/aviso-en-linea";

export function FormularioTerminos(props: { inicial: Pick<TerminosCondiciones, "texto"> | null }) {
  const { mostrarAviso } = useAvisos();
  const [texto, setTexto] = useState(props.inicial?.texto ?? "");
  const [estaConfirmando, setEstaConfirmando] = useState(false);
  const [estaVistaPreviaAbierta, setEstaVistaPreviaAbierta] = useState(false);
  const { errores, errorGeneral, estaEnviando, enviar, referenciaErrorGeneral } = useFormularioAccion({
    validar: validarTerminos,
    accion: publicarTerminosAccion,
    alExito: () => {
      mostrarAviso("exito", "Términos guardados.");
      window.dispatchEvent(new Event(EVENTO_TERMINOS_PUBLICADOS));
    },
    mensajeGeneral: "No se pudieron guardar los términos y condiciones.",
  });

  function guardar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (Object.keys(validarTerminos({ texto })).length > 0) enviar({ texto });
    else setEstaConfirmando(true);
  }

  return (
    <>
      <form aria-busy={estaEnviando} aria-label="Definir términos y condiciones" className="terminos-editor-panel" noValidate onSubmit={guardar}>
        <div className="terminos-seccion-cabecera">
          <h2>Editar contenido</h2>
          <button className="secondary-button" onClick={() => setEstaVistaPreviaAbierta(true)} type="button">Vista previa</button>
        </div>
        <div className="terminos-campos-editor">
          {errorGeneral ? <AvisoEnLinea ref={referenciaErrorGeneral}>{errorGeneral}</AvisoEnLinea> : null}
          <div className="form-field">
            <label htmlFor="texto">Texto</label>
            <EditorMarkdown alCambiar={setTexto} describedBy={["texto-contador", errores.texto ? "texto-error" : ""].filter(Boolean).join(" ")} id="texto" tieneError={Boolean(errores.texto)} valor={texto} />
            <p className="contador-texto" id="texto-contador">{texto.length + " / " + LARGO_MAXIMO_TEXTO + " caracteres"}</p>
            {errores.texto ? <p className="field-error" id="texto-error" role="alert">{errores.texto}</p> : null}
          </div>
        </div>
        <div className="terminos-publicar">
          <p>Si cambiás el texto, se pedirá aceptarlo nuevamente.</p>
          <button className="primary-button" disabled={estaEnviando} type="submit">{estaEnviando ? "Guardando…" : "Guardar cambios"}</button>
        </div>
      </form>
      <DialogoTerminos alCerrar={() => setEstaVistaPreviaAbierta(false)} estaAbierto={estaVistaPreviaAbierta}>
        <DocumentoTerminos documento={{ texto }} />
      </DialogoTerminos>
      {estaConfirmando ? <ModalConfirmacion
        descripcion="Se reemplazará el texto actual. Si cambia, todas las personas deberán volver a aceptarlo."
        etiquetaConfirmar="Guardar"
        onCancelar={() => setEstaConfirmando(false)}
        onConfirmar={() => { setEstaConfirmando(false); enviar({ texto }); }}
        titulo="Guardar términos y condiciones"
      /> : null}
    </>
  );
}
