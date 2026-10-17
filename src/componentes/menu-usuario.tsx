"use client";

import { useEffect, useId, useRef, useState } from "react";
import { IconoSalir, IconoUsuarios } from "@/componentes/iconos";
import type { UsuarioEnSesion } from "@/tipos/sesion";

type MenuUsuarioProps = {
  usuario: UsuarioEnSesion | null;
  alCerrarSesion: () => Promise<void>;
};

export function MenuUsuario({ usuario, alCerrarSesion }: MenuUsuarioProps) {
  const [estaAbierto, setEstaAbierto] = useState(false);
  const [estaCerrando, setEstaCerrando] = useState(false);
  const [hayError, setHayError] = useState(false);
  const referencia = useRef<HTMLDivElement>(null);
  const referenciaBoton = useRef<HTMLButtonElement>(null);
  const idPanel = useId();
  const nombre = usuario ? `${usuario.nombre} ${usuario.apellido}`.trim() : "Usuario no logueado";
  const iniciales = usuario ? `${usuario.nombre.trim().charAt(0)}${usuario.apellido.trim().charAt(0)}`.toLocaleUpperCase("es") : null;

  useEffect(() => {
    if (!estaAbierto) return;
    function cerrarDesdeFuera(evento: PointerEvent) {
      if (evento.target instanceof Node && !referencia.current?.contains(evento.target)) setEstaAbierto(false);
    }
    function cerrarConEscape(evento: KeyboardEvent) {
      if (evento.key !== "Escape") return;
      setEstaAbierto(false);
      referenciaBoton.current?.focus();
    }
    document.addEventListener("pointerdown", cerrarDesdeFuera);
    document.addEventListener("keydown", cerrarConEscape);
    return () => {
      document.removeEventListener("pointerdown", cerrarDesdeFuera);
      document.removeEventListener("keydown", cerrarConEscape);
    };
  }, [estaAbierto]);

  async function salir() {
    if (estaCerrando) return;
    setEstaCerrando(true);
    setHayError(false);
    try {
      await alCerrarSesion();
      setEstaAbierto(false);
    } catch {
      setHayError(true);
    } finally {
      setEstaCerrando(false);
    }
  }

  return (
    <div className="usuario-menu" ref={referencia} onBlur={(evento) => {
      if (!evento.currentTarget.contains(evento.relatedTarget)) setEstaAbierto(false);
    }}>
      <button
        aria-controls={idPanel}
        aria-expanded={estaAbierto}
        aria-label={`Menú de usuario: ${nombre}`}
        className="usuario-menu-boton"
        onClick={() => setEstaAbierto((actual) => !actual)}
        ref={referenciaBoton}
        type="button"
      >
        <span aria-hidden="true" className="usuario-avatar">{iniciales || <IconoUsuarios />}</span>
        <span className="usuario-menu-nombre">{usuario ? nombre : "Mi cuenta"}</span>
        <svg aria-hidden="true" className="usuario-menu-flecha" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      <div className="usuario-menu-panel" hidden={!estaAbierto} id={idPanel}>
        <div className="usuario-menu-identidad"><span>Cuenta de usuario</span><strong>{nombre}</strong></div>
        <button className="usuario-menu-salir" disabled={estaCerrando} onClick={salir} type="button">
          <IconoSalir />{estaCerrando ? "Cerrando sesión…" : "Cerrar sesión"}
        </button>
        {hayError ? <p className="usuario-menu-error" role="alert">No se pudo cerrar la sesión. Intenta nuevamente.</p> : null}
      </div>
    </div>
  );
}
