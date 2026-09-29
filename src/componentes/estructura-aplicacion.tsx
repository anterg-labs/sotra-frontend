"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";

const enlacesNavegacion = [
  { ruta: "/ordenes-trabajo", etiqueta: "Órdenes de trabajo", simbolo: "OT" },
  { ruta: "/clientes", etiqueta: "Clientes", simbolo: "CL" },
  { ruta: "/activos", etiqueta: "Activos", simbolo: "AC" },
  { ruta: "/repuestos", etiqueta: "Repuestos", simbolo: "RE" },
  { ruta: "/documentacion-tecnica", etiqueta: "Documentación técnica", simbolo: "DT" },
  { ruta: "/usuarios", etiqueta: "Usuarios", simbolo: "US" },
];

type EstructuraAplicacionProps = {
  children: React.ReactNode;
};

export function EstructuraAplicacion(props: EstructuraAplicacionProps) {
  const children = props.children;
  const rutaActual = usePathname();
  const [estaMenuAbierto, setEstaMenuAbierto] = useState(false);

  function cerrarMenu() {
    setEstaMenuAbierto(false);
  }

  function abrirMenu() {
    setEstaMenuAbierto(true);
  }

  let claseBarraLateral =
    "fixed left-0 top-0 z-30 flex h-screen w-64 flex-col border-r border-gray-200 bg-white text-slate-800 transition-transform duration-200 md:translate-x-0";
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
          className="flex h-20 items-center gap-3 border-b border-gray-200 px-4"
          href="/usuarios"
          onClick={cerrarMenu}
        >
          <span className="flex h-12 w-12 items-center justify-center">
            <Image
              src="/images/logo-cvm.png"
              alt="Logo CVM"
              className="object-contain"
              height={40}
              width={40}
            />
          </span>
        </Link>

        <nav
          aria-label="Navegación principal"
          className="flex flex-1 flex-col gap-2 overflow-y-auto p-4"
        >
          {enlacesNavegacion.map((enlace) => {
            const estaActivo = rutaActual.startsWith(enlace.ruta);

            let claseEnlace =
              "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-gray-500 hover:bg-slate-50 hover:text-slate-800";
            if (estaActivo) {
              claseEnlace = claseEnlace + " bg-sky-50 text-sky-600";
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
                  className="flex h-6 w-6 items-center justify-center rounded-md border border-current text-xs font-bold"
                >
                  {enlace.simbolo}
                </span>
                <span>{enlace.etiqueta}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {fondoOscuro}

      <div className="min-h-screen md:ml-64">
        <header className="sticky top-0 z-10 flex h-16 items-center border-b border-gray-200 bg-white px-4 md:h-20 md:px-8">
          <button
            aria-label="Abrir menú"
            className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-slate-50 text-lg text-slate-800 md:hidden"
            onClick={abrirMenu}
            type="button"
          >
            ☰
          </button>
          <div className="flex-1" />
        </header>
        {children}
      </div>
    </div>
  );
}
