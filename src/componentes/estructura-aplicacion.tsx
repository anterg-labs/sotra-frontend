"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import { cerrarSesion } from "@/servicios/servicio-sesion";
import { MenuUsuario } from "@/componentes/menu-usuario";
import { useUsuarioEnSesion } from "@/componentes/sesion/contexto-sesion";
import { esSoloTecnico, tienePermiso, type Permiso } from "@/seguridad/permisos";
import { urlCambioDeVista, type ModoVista } from "@/seguridad/vista";
import { IndicadorNavegacion } from "@/componentes/indicador-navegacion";
import { BotonTerminos } from "@/componentes/terminos/modal-terminos";
import { EstructuraTecnico } from "@/componentes/estructura-tecnico";
import { useAlertasStock } from "@/hooks/use-alertas-stock";
import { obtenerVersionSistema } from "@/servicios/servicio-version";
import versionDelFrontend from "../../version.json";
import {
  IconoActivos,
  IconoClientes,
  IconoConfiguracion,
  IconoDocumentacion,
  IconoFlechaIzquierda,
  IconoHamburguesa,
  IconoInicio,
  IconoOrdenesTrabajo,
  IconoReportes,
  IconoRepuestos,
  IconoUsuarios,
} from "@/componentes/iconos";

type Submenu = {
  ruta: string;
  etiqueta: string;
  permiso: Permiso;
  esActivo: (ruta: string) => boolean;
};

type ElementoMenu = {
  ruta: string;
  etiqueta: string;
  /** `null`: la ven todas las personas con sesión. */
  permiso: Permiso | null;
  icono: React.ReactNode;
  submenus?: Submenu[];
  submenuPermanente?: boolean;
};

/** Cada opción lleva el permiso que exige su página (la misma regla que aplica el proxy). */
const elementosMenu: ElementoMenu[] = [
  { ruta: "/inicio", etiqueta: "Inicio", permiso: "reporte.consultar", icono: <IconoInicio /> },
  { ruta: "/ordenes-trabajo", etiqueta: "Órdenes de trabajo", permiso: "ot.consultar", icono: <IconoOrdenesTrabajo /> },
  { ruta: "/reportes", etiqueta: "Reportes", permiso: "reporte.consultar", icono: <IconoReportes /> },
  { ruta: "/clientes", etiqueta: "Clientes", permiso: "cliente.consultar", icono: <IconoClientes /> },
  {
    ruta: "/activos",
    etiqueta: "Activos",
    permiso: "activo.consultar",
    icono: <IconoActivos />,
    submenuPermanente: true,
    submenus: [
      {
        ruta: "/activos",
        etiqueta: "Todos los activos",
        permiso: "activo.consultar",
        esActivo: (ruta) => ruta === "/activos" || /^\/activos\/(?:\d|nuevo)/.test(ruta),
      },
      {
        ruta: "/activos/modelos",
        etiqueta: "Modelos de máquina",
        permiso: "modelo.consultar",
        esActivo: (ruta) => ruta.startsWith("/activos/modelos"),
      },
      {
        ruta: "/activos/tipos",
        etiqueta: "Tipos de máquina",
        permiso: "tipo_maquina.consultar",
        esActivo: (ruta) => ruta.startsWith("/activos/tipos"),
      },
    ],
  },
  {
    ruta: "/repuestos",
    etiqueta: "Repuestos",
    permiso: "stock.consultar",
    icono: <IconoRepuestos />,
    submenus: [
      {
        ruta: "/repuestos",
        etiqueta: "Repuestos",
        permiso: "stock.consultar",
        esActivo: (ruta) => ruta.startsWith("/repuestos") && !ruta.startsWith("/repuestos/movimientos"),
      },
      {
        ruta: "/repuestos/movimientos",
        etiqueta: "Movimientos de stock",
        permiso: "stock.consultar",
        esActivo: (ruta) => ruta.startsWith("/repuestos/movimientos"),
      },
    ],
  },
  { ruta: "/documentacion-tecnica", etiqueta: "Documentación", permiso: "documento.consultar", icono: <IconoDocumentacion /> },
  { ruta: "/usuarios", etiqueta: "Usuarios", permiso: "usuario.consultar", icono: <IconoUsuarios /> },
  {
    ruta: "/configuracion",
    etiqueta: "Configuración",
    permiso: null,
    icono: <IconoConfiguracion />,
  },
];

/** Opciones del menú que puede ver un usuario con estos roles, con solo los submenús que también puede ver. */
export function filtrarMenuPorRoles(roles: readonly string[]): ElementoMenu[] {
  return elementosMenu
    .filter((elemento) => elemento.permiso === null || tienePermiso(roles, elemento.permiso))
    .map((elemento) => {
      const submenus = elemento.submenus?.filter((submenu) => tienePermiso(roles, submenu.permiso));
      return { ...elemento, submenus: submenus && submenus.length > 0 ? submenus : undefined };
    });
}

type MenuLateralProps = {
  alElegirOpcion: () => void;
  alAbrirMenu: () => void;
  estaMenuAbierto: boolean;
};

function MenuLateral(props: MenuLateralProps) {
  const rutaActual = usePathname();
  const roles = useUsuarioEnSesion()?.roles ?? [];
  const alertasStock = useAlertasStock(tienePermiso(roles, "stock.consultar"));
  // Los submenús desplegables empiezan siempre plegados: solo se abren si la persona los despliega.
  const [submenusAbiertos, setSubmenusAbiertos] = useState<ReadonlySet<string>>(() => new Set());
  const [menuAbiertoPrevio, setMenuAbiertoPrevio] = useState(props.estaMenuAbierto);

  // Al retraer el menú lateral también se pliegan los submenús desplegables.
  if (menuAbiertoPrevio !== props.estaMenuAbierto) {
    setMenuAbiertoPrevio(props.estaMenuAbierto);
    if (!props.estaMenuAbierto) setSubmenusAbiertos(new Set());
  }

  function alternarSubmenu(ruta: string) {
    setSubmenusAbiertos((abiertos) => {
      const siguientes = new Set(abiertos);
      if (!siguientes.delete(ruta)) siguientes.add(ruta);
      return siguientes;
    });
  }

  return (
    <>
      <nav aria-label="Navegación principal" className="app-menu">
        {filtrarMenuPorRoles(roles).map((elemento) => {
          const estaActivo = rutaActual.startsWith(elemento.ruta);
          const mostrarSubmenu = elemento.submenuPermanente ? submenusAbiertos.has(elemento.ruta) : estaActivo;
          const idSubmenu = "submenu-" + elemento.ruta.slice(1);
          return (
            <div key={elemento.ruta}>
              {elemento.submenuPermanente && elemento.submenus ? (
                <button
                  aria-controls={idSubmenu}
                  aria-expanded={mostrarSubmenu}
                  className="app-menu-enlace app-menu-desplegable"
                  data-actual={estaActivo}
                  onClick={() => {
                    if (!props.estaMenuAbierto) {
                      props.alAbrirMenu();
                      setSubmenusAbiertos((abiertos) => new Set(abiertos).add(elemento.ruta));
                      return;
                    }
                    alternarSubmenu(elemento.ruta);
                  }}
                  title={elemento.etiqueta}
                  type="button"
                >
                  {elemento.icono}
                  <span className="app-menu-texto">{elemento.etiqueta}</span>
                  <svg aria-hidden="true" className="app-menu-flecha" fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="14">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              ) : (
                <Link
                  aria-current={estaActivo && !elemento.submenus ? "page" : undefined}
                  aria-expanded={elemento.submenus ? estaActivo : undefined}
                  aria-controls={elemento.submenus && mostrarSubmenu ? idSubmenu : undefined}
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
              )}
              {elemento.submenus && (mostrarSubmenu || elemento.submenuPermanente) ? (
                <div
                  aria-hidden={!mostrarSubmenu}
                  className={elemento.submenuPermanente ? "app-submenu-animado" : undefined}
                  data-abierto={elemento.submenuPermanente ? mostrarSubmenu : undefined}
                  inert={!mostrarSubmenu}
                >
                <div className={elemento.submenuPermanente ? "app-submenu app-submenu-permanente" : "app-submenu"} id={idSubmenu}>
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
  /** Vista elegida por el técnico (cookie `sotra-vista`); los demás roles no la usan. */
  modoVista?: ModoVista;
};

function esPantallaDeEscritorio() {
  return window.matchMedia?.("(min-width: 761px)").matches ?? false;
}

function EstructuraEscritorio(props: EstructuraAplicacionProps) {
  const children = props.children;
  const referenciaEstructura = useRef<HTMLDivElement>(null);
  const referenciaPie = useRef<HTMLElement>(null);
  const [estaMenuAbierto, setEstaMenuAbierto] = useState(false);
  const versionFrontend = versionDelFrontend.version;
  const [versionBackend, setVersionBackend] = useState("…");
  const usuarioEnSesion = useUsuarioEnSesion();
  const rutaActual = usePathname();
  const puedeVolverAVistaMovil = usuarioEnSesion !== null && esSoloTecnico(usuarioEnSesion.roles);

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
        if (esPantallaDeEscritorio() && estaMenuAbierto) return;
        setEstaMenuAbierto(false);
      }
    }

    document.addEventListener("keydown", cerrarConEscape);
    return () => document.removeEventListener("keydown", cerrarConEscape);
  }, [estaMenuAbierto]);

  async function salirDeLaSesion() {
    setEstaMenuAbierto(false);
    await cerrarSesion();
  }

  function retraerMenu() {
    if (esPantallaDeEscritorio() && estaMenuAbierto) return;
    setEstaMenuAbierto(false);
  }

  const fechaActual = new Date().toLocaleDateString("es-UY", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });


  return (
    <div className="min-h-screen" ref={referenciaEstructura}>
      <button
        aria-controls="menu-lateral"
        aria-expanded={estaMenuAbierto}
        aria-label={estaMenuAbierto ? "Cerrar menú" : "Abrir menú"}
        className="app-boton-menu"
        data-abierto={estaMenuAbierto}
        onClick={() => {
          setEstaMenuAbierto((abierto) => !abierto);
        }}
        type="button"
      >
        {estaMenuAbierto ? <IconoFlechaIzquierda /> : <IconoHamburguesa />}
      </button>
      <aside
        className="app-lateral"
        data-abierto={estaMenuAbierto}
        data-compacto={!estaMenuAbierto}
        id="menu-lateral"
      >
        <Link className="app-lateral-logo" href="/" onClick={retraerMenu}>
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
            alAbrirMenu={() => setEstaMenuAbierto(true)}
            alElegirOpcion={retraerMenu}
            estaMenuAbierto={estaMenuAbierto}
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
          <div className="app-cabecera-fecha" suppressHydrationWarning>
            {fechaActual}
          </div>
          {puedeVolverAVistaMovil ? (
            <a className="text-link" href={urlCambioDeVista("movil", rutaActual)}>
              Vista móvil
            </a>
          ) : null}
          <MenuUsuario usuario={usuarioEnSesion} alCerrarSesion={salirDeLaSesion} />
        </header>
        <div className="app-contenido">{children}</div>
        <footer className="app-pie" ref={referenciaPie}>
          <div className="app-pie-enlaces"><BotonTerminos /></div>
          <div className="app-pie-derecha">
            <div className="app-pie-linea">
              <span>© 2026 AnterG Labs · Sotra App</span>
              <span className="app-pie-version">{"Versión " + versionFrontend + " · API " + versionBackend}</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

/**
 * Elige la estructura: el técnico usa la pensada para el celular en todas sus secciones, salvo que haya elegido la vista
 * de escritorio; los demás roles, la de escritorio, salvo en «Mi trabajo».
 */
export function EstructuraAplicacion(props: EstructuraAplicacionProps) {
  const rutaActual = usePathname();
  const usuario = useUsuarioEnSesion();
  if (usuario && esSoloTecnico(usuario.roles) && props.modoVista !== "escritorio") {
    return <EstructuraTecnico>{props.children}</EstructuraTecnico>;
  }
  if (rutaActual === "/tecnico" || rutaActual.startsWith("/tecnico/")) {
    return <EstructuraTecnico>{props.children}</EstructuraTecnico>;
  }

  return <EstructuraEscritorio>{props.children}</EstructuraEscritorio>;
}
