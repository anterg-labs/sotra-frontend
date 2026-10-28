"use client";

import { useEffect, useRef, useState } from "react";
import { generarCodigoQr } from "@/utilidades/codigo-qr";
import { obtenerDireccionParaApp } from "@/servicios/direccion-app";

const MARGEN_MODULOS = 4;
const LADO_IMAGEN_PX = 1024;

/** Imagen PNG del QR con fondo blanco y margen, para guardarla o enviarla. */
async function crearImagenQr(codigo: { lado: number; trazado: string }): Promise<Blob> {
  const total = codigo.lado + MARGEN_MODULOS * 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${LADO_IMAGEN_PX}" height="${LADO_IMAGEN_PX}" shape-rendering="crispEdges">`
    + `<rect width="${total}" height="${total}" fill="#fff"/><path transform="translate(${MARGEN_MODULOS} ${MARGEN_MODULOS})" d="${codigo.trazado}" fill="#000"/></svg>`;
  const direccion = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const imagen = new Image();
    imagen.src = direccion;
    await imagen.decode();
    const lienzo = document.createElement("canvas");
    lienzo.width = lienzo.height = LADO_IMAGEN_PX;
    lienzo.getContext("2d")?.drawImage(imagen, 0, 0, LADO_IMAGEN_PX, LADO_IMAGEN_PX);
    return await new Promise<Blob>((resolver, rechazar) => lienzo.toBlob((blob) => (blob ? resolver(blob) : rechazar(new Error("Sin imagen"))), "image/png"));
  } finally {
    URL.revokeObjectURL(direccion);
  }
}

export function BotonDescargarApp() {
  const [codigo, setCodigo] = useState<Awaited<ReturnType<typeof generarCodigoQr>> | null>(null);
  const [enlace, setEnlace] = useState("");
  const [aviso, setAviso] = useState("");
  const [estaGenerando, setEstaGenerando] = useState(false);
  const [error, setError] = useState("");
  const dialogo = useRef<HTMLDialogElement>(null);
  const boton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (codigo && dialogo.current && !dialogo.current.open) dialogo.current.showModal();
  }, [codigo]);

  async function abrir() {
    setEstaGenerando(true); setError("");
    // Se lee al pulsar, para usar el entorno, la ruta y los parámetros actuales, sin dominios configurados.
    const url = window.location.href;
    try {
      const direccion = await obtenerDireccionParaApp(url);
      setEnlace(direccion);
      setCodigo(await generarCodigoQr(direccion));
    }
    catch { setError("No se pudo generar el código QR. Volvé a intentarlo."); }
    finally { setEstaGenerando(false); }
  }

  async function compartir() {
    setAviso("");
    try {
      if (typeof navigator.share === "function") await navigator.share({ title: "SOTRA", url: enlace });
      else { await navigator.clipboard.writeText(enlace); setAviso("Enlace copiado."); }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setAviso("No se pudo compartir el enlace.");
    }
  }

  async function descargarImagen() {
    if (!codigo) return;
    setAviso("");
    try {
      const direccion = URL.createObjectURL(await crearImagenQr(codigo));
      const ancla = document.createElement("a");
      ancla.href = direccion;
      ancla.download = "sotra-qr.png";
      ancla.click();
      window.setTimeout(() => URL.revokeObjectURL(direccion), 1000);
    } catch { setAviso("No se pudo crear la imagen del QR."); }
  }

  return <>
    <button className="secondary-button" disabled={estaGenerando} onClick={abrir} ref={boton} type="button">{estaGenerando ? "Generando QR…" : "Descargar App"}</button>
    {error ? <p className="field-error" role="alert">{error}</p> : null}
    <dialog aria-label="Código QR de la aplicación" className="modal-qr" ref={dialogo}
      onClick={evento => { if (evento.target === dialogo.current) dialogo.current?.close(); }}
      onClose={() => { setCodigo(null); setAviso(""); boton.current?.focus(); }}>
      <button aria-label="Cerrar QR" className="boton-icono qr-cerrar" onClick={() => dialogo.current?.close()} type="button">
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18" /></svg>
      </button>
      <h2 className="qr-titulo">Escaneá el código con tu cámara</h2>
      <p className="qr-subtitulo">Abrí el enlace en tu celular y agregá SOTRA a tu pantalla de inicio.</p>
      <div className="qr-marco">
      <span aria-hidden="true" className="qr-esquina qr-esquina-superior-izquierda" />
      <span aria-hidden="true" className="qr-esquina qr-esquina-superior-derecha" />
      <span aria-hidden="true" className="qr-esquina qr-esquina-inferior-izquierda" />
      <span aria-hidden="true" className="qr-esquina qr-esquina-inferior-derecha" />
      {codigo ? <svg aria-label="QR con la URL actual de la aplicación" className="codigo-qr-app" role="img" viewBox={`0 0 ${codigo.lado} ${codigo.lado}`} shapeRendering="crispEdges">
        <rect className="codigo-qr-fondo" width={codigo.lado} height={codigo.lado} />
        <path className="codigo-qr-modulos" d={codigo.trazado} />
      </svg> : null}
      </div>
      <div className="qr-acciones">
        <button className="secondary-button" onClick={() => void compartir()} type="button">Compartir enlace</button>
        <button className="secondary-button" onClick={() => void descargarImagen()} type="button">Descargar imagen</button>
      </div>
      {aviso ? <p className="qr-aviso" role="status">{aviso}</p> : null}
      <div className="qr-instrucciones">
        <p><strong>Android · Chrome</strong><span>Menú ⋮ → Instalar y crear acceso directo → Instalar.</span></p>
        <p><strong>iPhone · Safari</strong><span>Compartir → Añadir a pantalla de inicio → Añadir.</span></p>
      </div>
    </dialog>
  </>;
}
