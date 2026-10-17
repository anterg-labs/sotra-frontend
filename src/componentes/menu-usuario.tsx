"use client";

import { useEffect, useId, useRef, useState } from "react";
import { IconoSalir, IconoUsuario } from "@/componentes/iconos";
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
  const iniciales = usuario
    ? `${usuario.nombre.trim().charAt(0)}${usuario.apellido.trim().charAt(0)}`.toLocaleUpperCase("es")
    : null;

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
    <div
      className="relative ml-auto min-w-0"
      onBlur={(evento) => {
        if (!evento.currentTarget.contains(evento.relatedTarget)) setEstaAbierto(false);
      }}
      ref={referencia}
    >
      <button
        aria-controls={idPanel}
        aria-expanded={estaAbierto}
        aria-label={`Menú de usuario: ${nombre}`}
        className="flex min-h-11 max-w-70 items-center gap-2.5 rounded-full border border-gray-200 bg-white py-1 pl-1 pr-3 text-slate-800 hover:border-slate-400 hover:bg-slate-50 aria-expanded:border-slate-400 aria-expanded:bg-slate-50"
        onClick={() => setEstaAbierto((actual) => !actual)}
        ref={referenciaBoton}
        type="button"
      >
        <span
          aria-hidden="true"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700"
        >
          {iniciales || <IconoUsuario />}
        </span>
        <span className="hidden truncate text-sm font-semibold sm:block">{usuario ? nombre : "Mi cuenta"}</span>
        <svg
          aria-hidden="true"
          className={"shrink-0 " + (estaAbierto ? "rotate-180" : "")}
          fill="none"
          height="16"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
          width="16"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <div
        className="absolute right-0 top-[calc(100%+10px)] z-40 w-70 max-w-[calc(100vw-32px)] rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl"
        hidden={!estaAbierto}
        id={idPanel}
      >
        <div className="grid gap-1.5 border-b border-gray-200 p-3 wrap-anywhere">
          <span className="text-[11px] text-slate-500">Cuenta de usuario</span>
          <strong className="text-sm font-semibold text-slate-800">{nombre}</strong>
        </div>
        <button
          className="mt-1.5 flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={estaCerrando}
          onClick={salir}
          type="button"
        >
          <IconoSalir />
          {estaCerrando ? "Cerrando sesión…" : "Cerrar sesión"}
        </button>
        {hayError ? (
          <p className="mx-3 my-1.5 text-xs text-red-700" role="alert">
            No se pudo cerrar la sesión. Intenta nuevamente.
          </p>
        ) : null}
      </div>
    </div>
  );
}
