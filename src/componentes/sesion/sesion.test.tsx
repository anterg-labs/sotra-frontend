import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usuarioDePruebas } from "@/pruebas/sesion-de-pruebas";
import type { RolSotra } from "@/seguridad/permisos";

// Estas pruebas usan el contexto de sesión real (vitest.setup.ts lo simula como administrador para el resto).
vi.unmock("@/componentes/sesion/contexto-sesion");

const pathname = vi.hoisted(() => ({ valor: "/ordenes-trabajo" }));
const consultarAlertas = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ usePathname: () => pathname.valor, useRouter: () => ({ push: vi.fn() }) }));
vi.mock("next/image", () => ({ default: (p: { alt: string }) => <span aria-label={p.alt} role="img" /> }));
vi.mock("@/servicios/servicio-version", () => ({ obtenerVersionSistema: () => Promise.resolve("2.0.1") }));
vi.mock("@/hooks/use-alertas-stock", () => ({ useAlertasStock: consultarAlertas }));

const { ProveedorSesion, SiTienePermiso, useTienePermiso } = await import("@/componentes/sesion/contexto-sesion");
const { PantallaSinAcceso } = await import("@/componentes/sesion/pantalla-sin-acceso");
const { EstructuraAplicacion, filtrarMenuPorRoles } = await import("@/componentes/estructura-aplicacion");

function conSesion(roles: RolSotra[] | null, contenido: React.ReactNode) {
  return <ProveedorSesion usuario={roles ? usuarioDePruebas(roles) : null}>{contenido}</ProveedorSesion>;
}

beforeEach(() => {
  pathname.valor = "/ordenes-trabajo";
  consultarAlertas.mockReset().mockReturnValue(null);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("permisos en la interfaz", () => {
  function BotonCrear() {
    return useTienePermiso("ot.crear") ? <button type="button">Crear orden</button> : <p>Solo consulta</p>;
  }

  it("SiTienePermiso y useTienePermiso muestran lo que el rol puede hacer", () => {
    render(conSesion(["jefe_mantenimiento"], <><BotonCrear /><SiTienePermiso permiso="stock.registrar_movimiento">Repuestos</SiTienePermiso></>));
    expect(screen.getByRole("button", { name: "Crear orden" })).toBeInTheDocument();
    expect(screen.queryByText("Repuestos")).not.toBeInTheDocument();
    cleanup();

    render(conSesion(["panolero"], <><BotonCrear /><SiTienePermiso permiso="stock.registrar_movimiento">Repuestos</SiTienePermiso></>));
    expect(screen.getByText("Solo consulta")).toBeInTheDocument();
    expect(screen.getByText("Repuestos")).toBeInTheDocument();
  });

  it("sin sesión no hay ningún permiso", () => {
    render(conSesion(null, <SiTienePermiso alternativa="Nada" permiso="ot.consultar">Órdenes</SiTienePermiso>));
    expect(screen.getByText("Nada")).toBeInTheDocument();
  });

  it.each([
    [["tecnico"], ["/ordenes-trabajo", "/clientes", "/activos", "/documentacion-tecnica"]],
    [["jefe_mantenimiento"], ["/inicio", "/ordenes-trabajo", "/reportes", "/clientes", "/activos", "/repuestos", "/documentacion-tecnica", "/usuarios"]],
    [["panolero"], ["/ordenes-trabajo", "/clientes", "/activos", "/repuestos"]],
    [["administrador"], ["/inicio", "/ordenes-trabajo", "/reportes", "/clientes", "/activos", "/repuestos", "/documentacion-tecnica", "/usuarios", "/configuracion"]],
  ] as const)("menú de %j", (roles, rutas) => {
    expect(filtrarMenuPorRoles(roles).map((elemento) => elemento.ruta)).toEqual(rutas);
  });

  it("el pañolero ve activos sin los submenús de modelos y tipos de máquina", () => {
    const activos = filtrarMenuPorRoles(["panolero"]).find((elemento) => elemento.ruta === "/activos");
    expect(activos?.submenus?.map((submenu) => submenu.ruta)).toEqual(["/activos"]);
  });

  it("la estructura muestra el nombre del usuario y el menú de su rol; consulta alertas de stock porque ve repuestos", () => {
    render(conSesion(["jefe_mantenimiento"], <EstructuraAplicacion>contenido</EstructuraAplicacion>));
    expect(within(screen.getByRole("banner")).getByRole("button", { name: "Menú de usuario: Ana Pérez" })).toHaveTextContent("Ana Pérez");
    const menu = within(screen.getByRole("navigation", { name: "Navegación principal" }));
    expect(menu.getAllByRole("link").map((enlace) => enlace.getAttribute("href"))).toEqual([
      "/inicio", "/ordenes-trabajo", "/reportes", "/clientes", "/activos",
      "/repuestos", "/documentacion-tecnica", "/usuarios",
    ]);
    expect(consultarAlertas).toHaveBeenCalledWith(true);
    cleanup();

    render(conSesion(["panolero"], <EstructuraAplicacion>contenido</EstructuraAplicacion>));
    expect(consultarAlertas).toHaveBeenCalledWith(true);
  });

  it.each(["/tecnico", "/activos", "/activos/6", "/clientes", "/documentacion-tecnica/3"])(
    "el técnico usa la vista móvil también en %s (no cambia a escritorio)",
    (ruta) => {
      pathname.valor = ruta;
      render(conSesion(["tecnico"], <EstructuraAplicacion>contenido</EstructuraAplicacion>));
      expect(screen.getByRole("navigation", { name: "Navegación del técnico" })).toBeInTheDocument();
      expect(screen.queryByRole("navigation", { name: "Navegación principal" })).not.toBeInTheDocument();
      // «Escritorio» cambia la vista guardada y abre la misma pantalla en el escritorio.
      expect(screen.getByRole("link", { name: "Escritorio" }).getAttribute("href")).toMatch(/^\/vista\?modo=escritorio&destino=/);
    },
  );

  it("si el técnico eligió la vista de escritorio, usa la de escritorio con un enlace para volver a la móvil", () => {
    pathname.valor = "/ordenes-trabajo/15";
    render(
      <ProveedorSesion usuario={usuarioDePruebas(["tecnico"])}>
        <EstructuraAplicacion modoVista="escritorio">contenido</EstructuraAplicacion>
      </ProveedorSesion>,
    );
    expect(screen.getByRole("navigation", { name: "Navegación principal" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Vista móvil" })).toHaveAttribute("href", "/vista?modo=movil&destino=%2Ftecnico%2F15");
  });

  it("administrador y jefe usan la vista móvil solo en «Mi trabajo», con enlace al escritorio", () => {
    pathname.valor = "/tecnico";
    render(conSesion(["jefe_mantenimiento"], <EstructuraAplicacion>contenido</EstructuraAplicacion>));
    expect(screen.getByRole("link", { name: "Escritorio" })).toHaveAttribute("href", "/ordenes-trabajo");
    cleanup();
    pathname.valor = "/activos";
    render(conSesion(["jefe_mantenimiento"], <EstructuraAplicacion>contenido</EstructuraAplicacion>));
    expect(screen.getByRole("navigation", { name: "Navegación principal" })).toBeInTheDocument();
  });

  it("la barra del técnico ofrece sus secciones sin repuestos y el encabezado permite cerrar sesión", () => {
    pathname.valor = "/clientes";
    render(conSesion(["tecnico"], <EstructuraAplicacion>contenido</EstructuraAplicacion>));
    const barra = within(screen.getByRole("navigation", { name: "Navegación del técnico" }));
    expect(barra.getAllByRole("link").map((enlace) => enlace.getAttribute("href"))).toEqual(["/tecnico", "/activos", "/clientes", "/documentacion-tecnica"]);
    expect(barra.getByRole("link", { name: "Clientes" })).toHaveAttribute("aria-current", "page");
    fireEvent.click(screen.getByRole("button", { name: "Menú de usuario: Ana Pérez" }));
    expect(screen.getByRole("button", { name: "Cerrar sesión" })).toBeInTheDocument();
  });
});

describe("pantalla sin acceso", () => {
  it("explica que no tiene acceso y solo permite cerrar la sesión (POST a /logout)", () => {
    const enviar = vi.spyOn(HTMLFormElement.prototype, "submit").mockImplementation(() => undefined);
    render(<PantallaSinAcceso correo="persona@sotra.test" motivo="sin-acceso" />);
    expect(screen.getByRole("heading", { name: "Tu usuario no tiene acceso a SOTRA. Contactá al administrador." })).toBeInTheDocument();
    expect(screen.getByText("Iniciaste sesión como persona@sotra.test.")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    expect(enviar).toHaveBeenCalledOnce();
    const formulario = enviar.mock.contexts[0] as HTMLFormElement;
    expect(formulario.method).toBe("post");
    expect(new URL(formulario.action).pathname).toBe("/logout");
    enviar.mockRestore();
  });

  it("si no se pudo consultar la sesión ofrece reintentar", () => {
    render(<PantallaSinAcceso motivo="error" />);
    expect(screen.getByRole("heading", { name: "No pudimos obtener los datos de tu sesión." })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
  });
});
