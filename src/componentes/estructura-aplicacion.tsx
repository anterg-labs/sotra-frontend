"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { cerrarSesion, obtenerUsuarioEnSesion } from "@/servicios/servicio-sesion";
import { obtenerVersionSistema } from "@/servicios/servicio-version";
import {
  IconoActivos,
  IconoClientes,
  IconoDocumentacion,
  IconoHamburguesa,
  IconoOrdenesTrabajo,
  IconoReportes,
  IconoRepuestos,
  IconoSalir,
  IconoUsuarios,
} from "@/componentes/iconos";

type Submenu = {
  ruta: string;
  etiqueta: string;
  esActivo: (ruta: string, seccion: string | null) => boolean;
};

type ElementoMenu = {
  ruta: string;
  etiqueta: string;
  icono: React.ReactNode;
  submenus?: Submenu[];
};

const elementosMenu: ElementoMenu[] = [
  { ruta: "/ordenes-trabajo", etiqueta: "Órdenes de trabajo", icono: <IconoOrdenesTrabajo /> },
  { ruta: "/clientes", etiqueta: "Clientes", icono: <IconoClientes /> },
  {
    ruta: "/activos",
    etiqueta: "Activos",
    icono: <IconoActivos />,
    submenus: [
      {
        ruta: "/activos",
        etiqueta: "Activos",
        esActivo: (ruta, seccion) => ruta.startsWith("/activos") && seccion !== "modelos" && seccion !== "tipos",
      },
      {
        ruta: "/activos?seccion=modelos",
        etiqueta: "Modelos de máquina",
        esActivo: (ruta, seccion) => ruta.startsWith("/activos") && seccion === "modelos",
      },
      {
        ruta: "/activos?seccion=tipos",
        etiqueta: "Tipos de máquina",
        esActivo: (ruta, seccion) => ruta.startsWith("/activos") && seccion === "tipos",
      },
    ],
  },
  {
    ruta: "/repuestos",
    etiqueta: "Repuestos",
    icono: <IconoRepuestos />,
    submenus: [
      {
        ruta: "/repuestos",
        etiqueta: "Repuestos",
        esActivo: (ruta) => ruta.startsWith("/repuestos") && !ruta.startsWith("/repuestos/movimientos"),
      },
      {
        ruta: "/repuestos/movimientos",
        etiqueta: "Movimientos de stock",
        esActivo: (ruta) => ruta.startsWith("/repuestos/movimientos"),
      },
    ],
  },
  { ruta: "/documentacion-tecnica", etiqueta: "Documentación técnica", icono: <IconoDocumentacion /> },
  { ruta: "/usuarios", etiqueta: "Usuarios", icono: <IconoUsuarios /> },
  { ruta: "/reportes", etiqueta: "Reportes", icono: <IconoReportes /> },
];

type MenuLateralProps = {
  alElegirOpcion: () => void;
  alCerrarSesion: () => void;
  puedeCerrarSesion: boolean;
  tituloCerrarSesion: string;
};

function MenuLateral(props: MenuLateralProps) {
  const rutaActual = usePathname();
  const seccion = useSearchParams().get("seccion");

  return (
    <>
      <nav aria-label="Navegación principal" className="app-menu">
        {elementosMenu.map((elemento) => {
          const estaActivo = rutaActual.startsWith(elemento.ruta);
          return (
            <div key={elemento.ruta}>
              <Link
                aria-current={estaActivo && !elemento.submenus ? "page" : undefined}
                className="app-menu-enlace"
                href={elemento.ruta}
                onClick={props.alElegirOpcion}
                title={elemento.etiqueta}
              >
                {elemento.icono}
                <span className="app-menu-texto">{elemento.etiqueta}</span>
              </Link>
              {elemento.submenus && estaActivo ? (
                <div className="app-submenu">
                  {elemento.submenus.map((submenu) => (
                    <Link
                      aria-current={submenu.esActivo(rutaActual, seccion) ? "page" : undefined}
                      className="app-menu-enlace"
                      href={submenu.ruta}
                      key={submenu.ruta}
                      onClick={props.alElegirOpcion}
                    >
                      <span className="app-menu-texto">{submenu.etiqueta}</span>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      <div className="app-lateral-pie">
        <button
          className="app-menu-enlace"
          disabled={!props.puedeCerrarSesion}
          onClick={props.alCerrarSesion}
          title={props.tituloCerrarSesion}
          type="button"
        >
          <IconoSalir />
          <span className="app-menu-texto">Cerrar sesión</span>
        </button>
      </div>
    </>
  );
}

type EstructuraAplicacionProps = {
  children: React.ReactNode;
};

export function EstructuraAplicacion(props: EstructuraAplicacionProps) {
  const children = props.children;
  const [estaMenuAbierto, setEstaMenuAbierto] = useState(false);
  const [versionBackend, setVersionBackend] = useState("…");
  const enrutador = useRouter();
  const usuarioEnSesion = obtenerUsuarioEnSesion();

  useEffect(() => {
    async function cargarVersionBackend() {
      try {
        setVersionBackend(await obtenerVersionSistema());
      } catch {
        setVersionBackend("no disponible");
      }
    }

    cargarVersionBackend();
  }, []);

  useEffect(() => {
    function cerrarConEscape(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        setEstaMenuAbierto(false);
      }
    }

    document.addEventListener("keydown", cerrarConEscape);
    return () => document.removeEventListener("keydown", cerrarConEscape);
  }, []);

  async function salirDeLaSesion() {
    setEstaMenuAbierto(false);
    await cerrarSesion();
    enrutador.push("/");
  }

  const fechaActual = new Date().toLocaleDateString("es-UY", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const haySesion = usuarioEnSesion !== null;
  const textoUsuario = haySesion ? usuarioEnSesion.nombre + " " + usuarioEnSesion.apellido : "Usuario no logueado";
  const tituloCerrarSesion = haySesion ? "Cerrar sesión" : "No hay sesión iniciada";

  return (
    <div className="min-h-screen">
      <aside
        className="app-lateral"
        data-abierto={estaMenuAbierto}
        data-compacto={!estaMenuAbierto}
        id="menu-lateral"
      >
        <Link className="app-lateral-logo" href="/usuarios" onClick={() => setEstaMenuAbierto(false)}>
          <span>
            <Image
              src="/images/logo-cvm.png"
              alt="Logo CVM"
              width={717}
              height={152}
              className="h-auto w-10 object-contain"
            />
          </span>
        </Link>

        <Suspense fallback={null}>
          <MenuLateral
            alCerrarSesion={salirDeLaSesion}
            alElegirOpcion={() => setEstaMenuAbierto(false)}
            puedeCerrarSesion={haySesion}
            tituloCerrarSesion={tituloCerrarSesion}
          />
        </Suspense>
      </aside>

      {estaMenuAbierto ? (
        <button
          aria-label="Cerrar menú"
          className="app-fondo-oscuro"
          onClick={() => setEstaMenuAbierto(false)}
          type="button"
        />
      ) : null}

      <div className="app-principal">
        <header className="app-cabecera">
          <button
            aria-controls="menu-lateral"
            aria-expanded={estaMenuAbierto}
            aria-label={estaMenuAbierto ? "Cerrar menú" : "Abrir menú"}
            className="app-boton-menu"
            onClick={() => setEstaMenuAbierto((abierto) => !abierto)}
            type="button"
          >
            <IconoHamburguesa />
          </button>
          <div className="app-cabecera-fecha" suppressHydrationWarning>
            {fechaActual}
          </div>
        </header>
        <div className="app-contenido">{children}</div>
        <footer className="app-pie">
          <span>{textoUsuario}</span>
          <div className="app-pie-derecha">
            <p>Copyright © 2026 | AnterG Labs | Sotra App</p>
            <p>{"Versión " + versionBackend}</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
