"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import { cerrarSesion, obtenerUsuarioEnSesion } from "@/servicios/servicio-sesion";
import { MenuUsuario } from "@/componentes/menu-usuario";
import { IndicadorNavegacion } from "@/componentes/indicador-navegacion";
import { BotonTerminos } from "@/componentes/terminos/modal-terminos";
import { EstructuraTecnico } from "@/componentes/estructura-tecnico";
import { useAlertasStock } from "@/hooks/use-alertas-stock";
import { obtenerVersionSistema } from "@/servicios/servicio-version";
import {
  IconoActivos,
  IconoClientes,
  IconoConfiguracion,
  IconoDocumentacion,
  IconoHamburguesa,
  IconoOrdenesTrabajo,
  IconoReportes,
  IconoRepuestos,
  IconoUsuarios,
} from "@/componentes/iconos";

type Submenu = {
  ruta: string;
  etiqueta: string;
  esActivo: (ruta: string) => boolean;
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
        esActivo: (ruta) => ruta === "/activos" || /^\/activos\/(?:\d|nuevo)/.test(ruta),
      },
      {
        ruta: "/activos/modelos",
        etiqueta: "Modelos de máquina",
        esActivo: (ruta) => ruta.startsWith("/activos/modelos"),
      },
      {
        ruta: "/activos/tipos",
        etiqueta: "Tipos de máquina",
        esActivo: (ruta) => ruta.startsWith("/activos/tipos"),
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
  {
    ruta: "/configuracion",
    etiqueta: "Configuración",
    icono: <IconoConfiguracion />,
    submenus: [
      {
        ruta: "/configuracion/terminos",
        etiqueta: "Términos y condiciones",
        esActivo: (ruta) => ruta.startsWith("/configuracion/terminos"),
      },
    ],
  },
];

type MenuLateralProps = {
  alElegirOpcion: () => void;
};

function MenuLateral(props: MenuLateralProps) {
  const rutaActual = usePathname();
  const alertasStock = useAlertasStock();

  return (
    <>
      <nav aria-label="Navegación principal" className="app-menu">
        {elementosMenu.map((elemento) => {
          const estaActivo = rutaActual.startsWith(elemento.ruta);
          return (
            <div key={elemento.ruta}>
              <Link
                aria-current={estaActivo && !elemento.submenus ? "page" : undefined}
                aria-expanded={elemento.submenus ? estaActivo : undefined}
                aria-controls={elemento.submenus && estaActivo ? `submenu-${elemento.ruta.slice(1)}` : undefined}
                className="app-menu-enlace"
                href={elemento.ruta}
                onClick={props.alElegirOpcion}
                title={elemento.etiqueta}
              >
                {elemento.icono}
                <span className="app-menu-texto">{elemento.etiqueta}</span>
                <IndicadorNavegacion destino={elemento.etiqueta} />
                {elemento.ruta === "/repuestos" && alertasStock && alertasStock.total > 0 ? (
                  <span className="insignia-menu" title={alertasStock.total + " repuestos con alerta de stock"}>
                    <span aria-hidden="true">{alertasStock.total > 99 ? "99+" : alertasStock.total}</span>
                    <span className="sr-only">{alertasStock.total + " repuestos con alerta de stock"}</span>
                  </span>
                ) : null}
              </Link>
              {elemento.submenus && estaActivo ? (
                <div className="app-submenu" id={`submenu-${elemento.ruta.slice(1)}`}>
                  {elemento.submenus.map((submenu) => (
                    <Link
                      aria-current={submenu.esActivo(rutaActual) ? "page" : undefined}
                      className="app-menu-enlace"
                      href={submenu.ruta}
                      key={submenu.ruta}
                      onClick={props.alElegirOpcion}
                    >
                      <span className="app-menu-texto">{submenu.etiqueta}</span>
                      <IndicadorNavegacion destino={submenu.etiqueta} />
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

    </>
  );
}

type EstructuraAplicacionProps = {
  children: React.ReactNode;
};

function EstructuraEscritorio(props: EstructuraAplicacionProps) {
  const children = props.children;
  const referenciaEstructura = useRef<HTMLDivElement>(null);
  const referenciaPie = useRef<HTMLElement>(null);
  const [estaMenuAbierto, setEstaMenuAbierto] = useState(false);
  const [estaMenuRetraido, setEstaMenuRetraido] = useState(false);
  const [versionBackend, setVersionBackend] = useState("…");
  const enrutador = useRouter();
  const usuarioEnSesion = obtenerUsuarioEnSesion();

  useLayoutEffect(() => {
    const estructura = referenciaEstructura.current;
    const pie = referenciaPie.current;
    if (!estructura || !pie) return;
    const ajustarAlturaDelPie = () => {
      const altura = pie.getBoundingClientRect().height;
      if (altura > 0) estructura.style.setProperty("--pie-alto", altura + "px");
    };
    ajustarAlturaDelPie();
    if (typeof ResizeObserver === "undefined") return;
    const observador = new ResizeObserver(ajustarAlturaDelPie);
    observador.observe(pie);
    return () => observador.disconnect();
  }, []);

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
        setEstaMenuRetraido(true);
      }
    }

    document.addEventListener("keydown", cerrarConEscape);
    return () => document.removeEventListener("keydown", cerrarConEscape);
  }, []);

  async function salirDeLaSesion() {
    setEstaMenuAbierto(false);
    await cerrarSesion();
    enrutador.push("/login");
  }

  function retraerMenu() {
    setEstaMenuAbierto(false);
    setEstaMenuRetraido(true);
  }

  const fechaActual = new Date().toLocaleDateString("es-UY", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });


  return (
    <div className="min-h-screen" ref={referenciaEstructura}>
      <aside
        className="app-lateral"
        data-abierto={estaMenuAbierto}
        data-compacto={!estaMenuAbierto}
        data-retraido={estaMenuRetraido}
        id="menu-lateral"
        onPointerEnter={() => setEstaMenuRetraido(false)}
        onFocusCapture={() => setEstaMenuRetraido(false)}
      >
        <Link className="app-lateral-logo" href="/usuarios" onClick={retraerMenu}>
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
            alElegirOpcion={retraerMenu}
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
          <MenuUsuario usuario={usuarioEnSesion} alCerrarSesion={salirDeLaSesion} />
        </header>
        <div className="app-contenido">{children}</div>
        <footer className="app-pie" ref={referenciaPie}>
          <div className="app-pie-enlaces"><BotonTerminos /></div>
          <div className="app-pie-derecha">
            <div className="app-pie-linea">
              <span>© 2026 AnterG Labs · Sotra App</span>
              <span className="app-pie-version">{"Versión " + versionBackend}</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

/** Elige la estructura según la zona: el técnico usa una pensada para el celular y el resto, la de escritorio. */
export function EstructuraAplicacion(props: EstructuraAplicacionProps) {
  const rutaActual = usePathname();
  if (rutaActual === "/login" || rutaActual.startsWith("/login/")) {
    return <>{props.children}</>;
  }
  if (rutaActual === "/tecnico" || rutaActual.startsWith("/tecnico/")) {
    return <EstructuraTecnico>{props.children}</EstructuraTecnico>;
  }

  return <EstructuraEscritorio>{props.children}</EstructuraEscritorio>;
}
