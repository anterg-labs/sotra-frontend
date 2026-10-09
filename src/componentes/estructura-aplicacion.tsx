"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cerrarSesion, obtenerUsuarioEnSesion } from "@/servicios/servicio-sesion";
import { obtenerVersionSistema } from "@/servicios/servicio-version";
import versionFrontend from "../../version.json";
import logoCvm from "../../public/images/logo-cvm.png";

const enlacesNavegacion = [
  { ruta: "/ordenes-trabajo", etiqueta: "Órdenes de trabajo", simbolo: "OT" },
  { ruta: "/clientes", etiqueta: "Clientes", simbolo: "CL" },
  { ruta: "/activos", etiqueta: "Activos", simbolo: "AC" },
  { ruta: "/repuestos", etiqueta: "Repuestos", simbolo: "RE" },
  { ruta: "/documentacion-tecnica", etiqueta: "Documentación técnica", simbolo: "DT" },
  { ruta: "/usuarios", etiqueta: "Usuarios", simbolo: "US" },
  { ruta: "/reportes", etiqueta: "Reportes", simbolo: "RP" },
];

type EstructuraAplicacionProps = {
  children: React.ReactNode;
};

export function EstructuraAplicacion(props: EstructuraAplicacionProps) {
  const children = props.children;
  const rutaActual = usePathname();
  const [estaMenuAbierto, setEstaMenuAbierto] = useState(false);
  const [versionBackend, setVersionBackend] = useState("Cargando...");
  const enrutador = useRouter();
  const usuarioEnSesion = obtenerUsuarioEnSesion();

  useEffect(() => {
    async function cargarVersionBackend() {
      try {
        const versionObtenida = await obtenerVersionSistema();
        setVersionBackend(versionObtenida);
      } catch {
        setVersionBackend("No disponible");
      }
    }

    cargarVersionBackend();
  }, []);

  async function salirDeLaSesion() {
    await cerrarSesion();
    enrutador.push("/");
  }

  const fechaActual = new Date().toLocaleDateString("es-UY", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  let textoUsuario = "Usuario no logueado";
  let haySesion = false;
  let tituloCerrarSesion = "No hay sesión iniciada";
  if (usuarioEnSesion !== null) {
    textoUsuario = usuarioEnSesion.nombre + " " + usuarioEnSesion.apellido;
    haySesion = true;
    tituloCerrarSesion = "Cerrar sesión";
  }

  const botonCerrarSesion = (
    <button
      className="secondary-button disabled:cursor-not-allowed disabled:opacity-50"
      disabled={!haySesion}
      onClick={salirDeLaSesion}
      title={tituloCerrarSesion}
      type="button"
    >
      Cerrar sesión
    </button>
  );

  function cerrarMenu() {
    setEstaMenuAbierto(false);
  }

  function abrirMenu() {
    setEstaMenuAbierto(true);
  }

  let claseBarraLateral =
    "group fixed left-0 top-0 z-30 flex h-screen w-64 flex-col overflow-hidden border-r border-[#3c3c3c] bg-[#252526] text-[#cccccc] transition-all duration-200 md:w-[72px] md:translate-x-0 md:hover:w-64 md:hover:shadow-xl md:has-[:focus-visible]:w-64 md:has-[:focus-visible]:shadow-xl";
  if (estaMenuAbierto) {
    claseBarraLateral = claseBarraLateral + " translate-x-0";
  } else {
    claseBarraLateral = claseBarraLateral + " -translate-x-full";
  }

  let fondoOscuro = null;
  if (estaMenuAbierto) {
    fondoOscuro = (
      <button
        aria-label="Cerrar menú"
        className="fixed inset-0 z-20 bg-black/50 md:hidden"
        onClick={cerrarMenu}
        type="button"
      />
    );
  }

  return (
    <div className="min-h-screen">
      <aside className={claseBarraLateral}>
        <Link
          className="flex h-20 items-center justify-center border-b border-[#3c3c3c] px-3"
          href="/usuarios"
          onClick={cerrarMenu}
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white">
            <Image
              src={logoCvm}
              alt="Logo CVM"
              className="h-auto w-10 object-contain"
            />
          </span>
        </Link>

        <nav
          aria-label="Navegación principal"
          className="flex flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden px-3 py-4"
        >
          {enlacesNavegacion.map((enlace) => {
            const estaActivo = rutaActual.startsWith(enlace.ruta);

            let claseEnlace =
              "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-[#cccccc] hover:bg-[#2a2d2e] hover:text-white";
            if (estaActivo) {
              claseEnlace = "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold bg-[#37373d] text-white";
            }

            return (
              <Link
                className={claseEnlace}
                href={enlace.ruta}
                key={enlace.ruta}
                onClick={cerrarMenu}
                title={enlace.etiqueta}
              >
                <span
                  aria-hidden="true"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-current text-xs font-bold"
                >
                  {enlace.simbolo}
                </span>
                <span className="whitespace-nowrap transition-opacity duration-200 md:opacity-0 md:group-hover:opacity-100 md:group-has-[:focus-visible]:opacity-100">
                  {enlace.etiqueta}
                </span>
              </Link>
            );
          })}
        </nav>

      </aside>

      {fondoOscuro}

      <div className="flex min-h-screen flex-col md:ml-[72px]">
        <header className="sticky top-0 z-10 flex h-16 items-center border-b border-gray-200 bg-white px-4 md:h-20 md:px-8">
          <button
            aria-label="Abrir menú"
            className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-slate-50 text-lg text-slate-800 md:hidden"
            onClick={abrirMenu}
            type="button"
          >
            ☰
          </button>
          <div className="flex-1 text-sm font-semibold text-gray-500 first-letter:uppercase" suppressHydrationWarning>
            {fechaActual}
          </div>
          {botonCerrarSesion}
        </header>
        <div className="flex-1 pb-24 md:pb-16">{children}</div>
        <footer className="fixed bottom-0 left-0 right-0 z-20 flex min-h-16 flex-col items-center justify-center gap-1 bg-black px-4 py-2 text-center text-xs font-bold text-gray-300 md:left-[72px] md:min-h-14 md:flex-row md:justify-between md:px-8 md:text-sm">
          <span>{textoUsuario}</span>
          <div className="md:text-right">
            <p>Copyright © 2026 | AnterG Labs | Sotra App</p>
            <p>{"Frontend: " + versionFrontend.version + " | Backend: " + versionBackend}</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
