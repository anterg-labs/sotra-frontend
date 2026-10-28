"use client";

import { useEffect, useRef, useState } from "react";
import { generarCodigoQr } from "@/utilidades/codigo-qr";
import { obtenerDireccionParaApp } from "@/servicios/direccion-app";

export function BotonDescargarApp() {
  const [codigo, setCodigo] = useState<Awaited<ReturnType<typeof generarCodigoQr>> | null>(null);
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
    try { setCodigo(await generarCodigoQr(await obtenerDireccionParaApp(url))); }
    catch { setError("No se pudo generar el código QR. Volvé a intentarlo."); }
    finally { setEstaGenerando(false); }
  }

  return <>
    <button className="secondary-button" disabled={estaGenerando} onClick={abrir} ref={boton} type="button">{estaGenerando ? "Generando QR…" : "Descargar App"}</button>
    {error ? <p className="field-error" role="alert">{error}</p> : null}
    <dialog aria-label="Código QR de la aplicación" className="modal-qr" ref={dialogo}
      onClick={evento => { if (evento.target === dialogo.current) dialogo.current?.close(); }}
      onClose={() => { setCodigo(null); boton.current?.focus(); }}>
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
      <div className="qr-instrucciones">
        <p><strong>Android · Chrome</strong><span>Menú ⋮ → Instalar y crear acceso directo → Instalar.</span></p>
        <p><strong>iPhone · Safari</strong><span>Compartir → Añadir a pantalla de inicio → Añadir.</span></p>
      </div>
    </dialog>
  </>;
}
