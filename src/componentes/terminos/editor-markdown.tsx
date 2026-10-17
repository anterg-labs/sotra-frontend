"use client";

import { useState } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { validarDireccionEnlace } from "@/utilidades/markdown-editor";

type PropiedadesEditor = { id: string; valor: string; alCambiar: (valor: string) => void; describedBy?: string; tieneError?: boolean };

/** Edición visual; Markdown es únicamente el formato de persistencia, nunca la interfaz de escritura. */
export function EditorMarkdown(props: PropiedadesEditor) {
  const [estaEditandoEnlace, setEstaEditandoEnlace] = useState(false);
  const [direccion, setDireccion] = useState("");
  const [errorEnlace, setErrorEnlace] = useState("");
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        underline: false, strike: false, code: false, codeBlock: false,
        link: { openOnClick: false, autolink: false, protocols: ["http", "https", "mailto"] },
      }),
      Markdown,
    ],
    content: props.valor,
    contentType: "markdown",
    editorProps: { attributes: {
      id: props.id, role: "textbox", "aria-label": "Texto", "aria-multiline": "true",
      "aria-describedby": props.describedBy ?? "", "aria-invalid": props.tieneError ? "true" : "false",
      class: "editor-visual-contenido texto-terminos",
    } },
    onUpdate: ({ editor: actual }) => props.alCambiar(actual.getMarkdown()),
  });

  const estado = useEditorState({ editor, selector: ({ editor: actual }) => ({
    negrita: actual?.isActive("bold") ?? false,
    cursiva: actual?.isActive("italic") ?? false,
    titulo: actual?.isActive("heading", { level: 2 }) ?? false,
    subtitulo: actual?.isActive("heading", { level: 3 }) ?? false,
    vinietas: actual?.isActive("bulletList") ?? false,
    numerada: actual?.isActive("orderedList") ?? false,
    cita: actual?.isActive("blockquote") ?? false,
    enlace: actual?.isActive("link") ?? false,
  }) });

  function guardarEnlace() {
    const error = validarDireccionEnlace(direccion);
    if (error) { setErrorEnlace(error); return; }
    editor?.chain().focus().extendMarkRange("link").setLink({ href: direccion.trim() }).run();
    setEstaEditandoEnlace(false);
  }

  const herramientas = [
    { nombre: "Negrita", texto: "B", activo: estado?.negrita, ejecutar: () => editor?.chain().focus().toggleBold().run() },
    { nombre: "Cursiva", texto: "I", activo: estado?.cursiva, ejecutar: () => editor?.chain().focus().toggleItalic().run() },
    { nombre: "Título", texto: "Título", activo: estado?.titulo, ejecutar: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
    { nombre: "Subtítulo", texto: "Subtítulo", activo: estado?.subtitulo, ejecutar: () => editor?.chain().focus().toggleHeading({ level: 3 }).run() },
    { nombre: "Lista con viñetas", texto: "• Lista", activo: estado?.vinietas, ejecutar: () => editor?.chain().focus().toggleBulletList().run() },
    { nombre: "Lista numerada", texto: "1. Lista", activo: estado?.numerada, ejecutar: () => editor?.chain().focus().toggleOrderedList().run() },
    { nombre: "Cita", texto: "“ Cita", activo: estado?.cita, ejecutar: () => editor?.chain().focus().toggleBlockquote().run() },
    { nombre: "Enlace", texto: "Enlace", activo: estado?.enlace, ejecutar: () => {
      const enlace: unknown = editor?.getAttributes("link").href;
      setDireccion(typeof enlace === "string" ? enlace : "");
      setErrorEnlace("");
      setEstaEditandoEnlace(true);
    } },
    { nombre: "Separador", texto: "—", ejecutar: () => editor?.chain().focus().setHorizontalRule().run() },
    { nombre: "Deshacer", texto: "↶", ejecutar: () => editor?.chain().focus().undo().run() },
    { nombre: "Rehacer", texto: "↷", ejecutar: () => editor?.chain().focus().redo().run() },
  ];

  return <div className="editor-markdown editor-visual">
    <div aria-label="Herramientas de formato" aria-controls={props.id} className="editor-markdown-barra" role="toolbar">
      {herramientas.map(herramienta => <button
        aria-label={herramienta.nombre} aria-pressed={herramienta.activo} disabled={!editor} key={herramienta.nombre}
        onMouseDown={evento => evento.preventDefault()} onClick={herramienta.ejecutar} title={herramienta.nombre} type="button"
      >{herramienta.texto}</button>)}
    </div>
    {estaEditandoEnlace ? <div className="editor-markdown-enlace">
      <label htmlFor={props.id + "-enlace"}>Dirección del enlace</label>
      <input id={props.id + "-enlace"} onChange={evento => setDireccion(evento.target.value)} onKeyDown={evento => {
        if (evento.key === "Enter") { evento.preventDefault(); guardarEnlace(); }
        if (evento.key === "Escape") { evento.preventDefault(); setEstaEditandoEnlace(false); editor?.commands.focus(); }
      }} type="url" value={direccion} />
      {errorEnlace ? <p className="field-error" role="alert">{errorEnlace}</p> : null}
      <div className="form-actions">
        <button className="secondary-button" onClick={() => { setEstaEditandoEnlace(false); editor?.commands.focus(); }} type="button">Cancelar</button>
        <button className="primary-button" onClick={guardarEnlace} type="button">Insertar enlace</button>
        <button className="secondary-button" onClick={() => { editor?.chain().focus().unsetLink().run(); setEstaEditandoEnlace(false); }} type="button">Quitar enlace</button>
      </div>
    </div> : null}
    <EditorContent editor={editor} />
  </div>;
}
