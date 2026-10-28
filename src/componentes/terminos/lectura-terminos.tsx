"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import type { TerminosCondiciones } from "@/tipos/terminos";
import { DocumentoTerminos } from "./documento-terminos";

export function LecturaTerminos(props: { terminos: TerminosCondiciones; requiereAceptacion: boolean; alAceptar: () => Promise<void> }) {
  const referenciaTexto = useRef<HTMLDivElement>(null);
  const centinelaFinal = useRef<HTMLSpanElement>(null);
  const [llegoAlFinal, setLlegoAlFinal] = useState(false);
  const [acepta, setAcepta] = useState(false);
  const [estaGuardando, setEstaGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const texto = referenciaTexto.current;
    if (!texto) return;
    const comprobarFinal = () => {
      if (typeof IntersectionObserver !== "undefined" && getComputedStyle(texto).overflowY === "visible") return;
      if (texto.clientHeight > 0 && texto.scrollHeight - texto.scrollTop <= texto.clientHeight + 2) setLlegoAlFinal(true);
    };
    const cuadro = window.requestAnimationFrame(comprobarFinal);
    texto.addEventListener("scroll", comprobarFinal);
    const observador = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(comprobarFinal);
    observador?.observe(texto);
    // El centinela detecta el final aunque se desplace el modal completo y no el recuadro del texto (pantallas chicas).
    const final = centinelaFinal.current;
    const visibilidad = final && typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver((entradas) => { if (entradas.some((entrada) => entrada.isIntersecting)) setLlegoAlFinal(true); })
      : null;
    if (final) visibilidad?.observe(final);
    return () => { window.cancelAnimationFrame(cuadro); texto.removeEventListener("scroll", comprobarFinal); observador?.disconnect(); visibilidad?.disconnect(); };
  }, []);

  async function aceptar() {
    if (!acepta || !llegoAlFinal || estaGuardando) return;
    setEstaGuardando(true);
    setError("");
    try { await props.alAceptar(); }
    catch { setError("No se pudo guardar la aceptación. Verificá la conexión y que el navegador permita guardar datos, y reintentá."); }
    finally { setEstaGuardando(false); }
  }

  return <div className="grid gap-4">
    <DocumentoTerminos centinelaFinal={centinelaFinal} documento={props.terminos} ref={referenciaTexto} />
    {props.requiereAceptacion ? <>
      <p id="ayuda-lectura-terminos">Recorré el texto hasta el final para habilitar la casilla de aceptación.</p>
      <label className="flex items-center gap-2">
        <input aria-describedby="ayuda-lectura-terminos" className="m-0 h-4 w-4 shrink-0" checked={acepta} disabled={!llegoAlFinal || estaGuardando} onChange={(evento) => setAcepta(evento.target.checked)} type="checkbox" />
        Leí y acepto los términos y condiciones
      </label>
      {error ? <p className="form-error-banner" role="alert">{error}</p> : null}
      <div className="form-actions"><button className="primary-button" disabled={!acepta || !llegoAlFinal || estaGuardando} onClick={() => startTransition(aceptar)} type="button">{estaGuardando ? "Guardando…" : "Aceptar"}</button></div>
    </> : null}
  </div>;
}

