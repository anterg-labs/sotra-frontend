import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AltaUsuario } from "./alta-usuario";
import { EstructuraAplicacion } from "./estructura-aplicacion";

const pathname = vi.hoisted(() => ({ valor: "/clientes" }));
const alertas = vi.hoisted(() => ({ valor: null as null | { bajo: number; sinStock: number; total: number } }));
const s = vi.hoisted(() => ({
  listarClientesPaginados: vi.fn(),
  listarModelosMaquinaPaginados: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.valor,
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("next/image", () => ({ default: (p: { alt: string }) => <span aria-label={p.alt} role="img" /> }));
vi.mock("@/hooks/use-alertas-stock", () => ({ useAlertasStock: () => alertas.valor }));
vi.mock("@/servicios/servicio-version", () => ({ obtenerVersionSistema: () => Promise.resolve("2.0.1") }));
vi.mock("@/servicios/servicio-clientes", () => ({ listarClientesPaginados: s.listarClientesPaginados, crearCliente: vi.fn() }));
vi.mock("@/servicios/servicio-modelos-maquina", () => ({ listarModelosMaquinaPaginados: s.listarModelosMaquinaPaginados }));
vi.mock("@/app/usuarios/acciones", () => ({ crearUsuarioAccion: vi.fn() }));
vi.mock("@/servicios/servicio-activos", () => ({ crearActivo: vi.fn(), listarActivosPaginados: vi.fn() }));

beforeEach(() => {
  vi.unstubAllGlobals();
  pathname.valor = "/clientes";
  alertas.valor = null;
  Object.values(s).forEach((f) => f.mockReset());
});

describe("EstructuraAplicacion: navegación de escritorio", () => {
  it("mantiene el menú expandido al navegar y salir con el puntero hasta contraerlo con el botón", () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
    const { rerender } = render(<EstructuraAplicacion>x</EstructuraAplicacion>);
    fireEvent.click(screen.getByRole("button", { name: "Abrir menú" }));
    const lateral = document.getElementById("menu-lateral")!;
    const botonMenu = screen.getByRole("button", { name: "Cerrar menú", expanded: true });
    expect(botonMenu).toHaveAttribute("data-abierto", "true");
    expect(botonMenu.parentElement).toBe(lateral.parentElement);
    fireEvent.pointerLeave(lateral);
    fireEvent.keyDown(document, { key: "Escape" });
    const enlace = within(screen.getByRole("navigation", { name: "Navegación principal" })).getByRole("link", { name: "Usuarios" });
    enlace.addEventListener("click", (evento) => evento.preventDefault());
    fireEvent.click(enlace);
    pathname.valor = "/usuarios";
    rerender(<EstructuraAplicacion>usuarios</EstructuraAplicacion>);
    expect(lateral).toHaveAttribute("data-abierto", "true");
    expect(lateral).toHaveAttribute("data-compacto", "false");
    fireEvent.click(screen.getByRole("button", { name: "Cerrar menú", expanded: true }));
    expect(lateral).toHaveAttribute("data-abierto", "false");
    fireEvent.pointerEnter(lateral);
    fireEvent.focus(within(lateral).getByRole("link", { name: "Clientes" }));
    expect(lateral).toHaveAttribute("data-abierto", "false");
    expect(screen.getByRole("button", { name: "Abrir menú" })).toHaveAttribute("aria-expanded", "false");
  });

  it("los subítems de Activos empiezan retraídos y se despliegan y pliegan cuantas veces se quiera", () => {
    render(<EstructuraAplicacion>x</EstructuraAplicacion>);
    const menu = screen.getByRole("navigation", { name: "Navegación principal" });
    const alternar = within(menu).getByRole("button", { name: "Activos" });
    expect(alternar).toHaveAttribute("aria-expanded", "false");
    expect(within(menu).queryByRole("link", { name: "Modelos de máquina" })).not.toBeInTheDocument();
    for (let vez = 0; vez < 2; vez += 1) {
      fireEvent.click(alternar);
      expect(alternar).toHaveAttribute("aria-expanded", "true");
      expect(within(menu).getByRole("link", { name: "Tipos de máquina" })).toBeInTheDocument();
      fireEvent.click(alternar);
      expect(alternar).toHaveAttribute("aria-expanded", "false");
      expect(within(menu).queryByRole("link", { name: "Tipos de máquina" })).not.toBeInTheDocument();
    }
  });

  it("con el menú retraído, pulsar Activos abre el menú y despliega sus subítems", () => {
    render(<EstructuraAplicacion>x</EstructuraAplicacion>);
    const menu = screen.getByRole("navigation", { name: "Navegación principal" });
    expect(screen.getByRole("button", { name: "Abrir menú" })).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(within(menu).getByRole("button", { name: "Activos" }));
    expect(screen.getByRole("button", { name: "Cerrar menú", expanded: true })).toBeInTheDocument();
    expect(within(menu).getByRole("link", { name: "Todos los activos" })).toBeInTheDocument();
  });

  it("al retraer el menú lateral se pliega el submenú de Activos", () => {
    render(<EstructuraAplicacion>x</EstructuraAplicacion>);
    const menu = screen.getByRole("navigation", { name: "Navegación principal" });
    fireEvent.click(screen.getByRole("button", { name: "Abrir menú" }));
    fireEvent.click(within(menu).getByRole("button", { name: "Activos" }));
    expect(within(menu).getByRole("link", { name: "Modelos de máquina" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar menú", expanded: true }));
    expect(within(menu).queryByRole("link", { name: "Modelos de máquina" })).not.toBeInTheDocument();
  });

  it("marca la sección actual y mantiene los subítems de Activos disponibles desde otras secciones", () => {
    render(<EstructuraAplicacion>x</EstructuraAplicacion>);
    const menu = screen.getByRole("navigation", { name: "Navegación principal" });
    fireEvent.click(within(menu).getByRole("button", { name: "Activos" }));
    expect(within(menu).getByRole("link", { name: "Clientes" })).toHaveAttribute("aria-current", "page");
    expect(within(menu).queryByRole("link", { name: "Activos" })).not.toBeInTheDocument();
    expect(within(menu).getByRole("link", { name: "Todos los activos" })).not.toHaveAttribute("aria-current");
    expect(within(menu).getByRole("link", { name: "Modelos de máquina" })).toHaveAttribute("href", "/activos/modelos");
    expect(within(menu).getByRole("link", { name: "Tipos de máquina" })).toHaveAttribute("href", "/activos/tipos");
    expect(within(menu).queryByRole("link", { name: "Movimientos de stock" })).not.toBeInTheDocument();
  });

  it.each([
    ["/activos", "Todos los activos"],
    ["/activos/5", "Todos los activos"],
    ["/activos/modelos/3", "Modelos de máquina"],
    ["/activos/tipos", "Tipos de máquina"],
  ])("en %s el submenú activo es %s", (ruta, activo) => {
    pathname.valor = ruta;
    render(<EstructuraAplicacion>x</EstructuraAplicacion>);
    fireEvent.click(screen.getByRole("button", { name: "Activos" }));
    const submenu = within(document.getElementById("submenu-activos") as HTMLElement);
    const actuales = submenu.getAllByRole("link").filter((enlace) => enlace.getAttribute("aria-current") === "page");
    expect(actuales.map((e) => e.textContent)).toEqual([activo]);
  });

  it("en repuestos distingue la lista de los movimientos de stock", () => {
    pathname.valor = "/repuestos/movimientos/4";
    render(<EstructuraAplicacion>x</EstructuraAplicacion>);
    const submenu = within(document.getElementById("submenu-repuestos") as HTMLElement);
    expect(submenu.getByRole("link", { name: "Movimientos de stock" })).toHaveAttribute("aria-current", "page");
    expect(submenu.getByRole("link", { name: "Repuestos" })).not.toHaveAttribute("aria-current");
  });

  it("muestra la insignia de alertas de stock con texto accesible y '99+' si hay más de 99", () => {
    alertas.valor = { bajo: 2, sinStock: 1, total: 3 };
    const { unmount } = render(<EstructuraAplicacion>x</EstructuraAplicacion>);
    expect(screen.getByText("3 repuestos con alerta de stock")).toBeInTheDocument();
    unmount();
    alertas.valor = { bajo: 100, sinStock: 20, total: 120 };
    render(<EstructuraAplicacion>x</EstructuraAplicacion>);
    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("no muestra insignia sin alertas", () => {
    alertas.valor = { bajo: 0, sinStock: 0, total: 0 };
    render(<EstructuraAplicacion>x</EstructuraAplicacion>);
    expect(screen.queryByText(/repuestos con alerta de stock/)).not.toBeInTheDocument();
  });

  it("abre y cierra el menú móvil con el botón, el fondo oscuro, Escape y al elegir una opción", () => {
    render(<EstructuraAplicacion>x</EstructuraAplicacion>);
    const boton = screen.getByRole("button", { name: "Abrir menú" });
    expect(boton).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(boton);
    expect(screen.getByRole("button", { name: "Cerrar menú", expanded: true })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByRole("button", { name: "Abrir menú" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Abrir menú" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Cerrar menú" })[0]);
    expect(screen.getByRole("button", { name: "Abrir menú" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Abrir menú" }));
    const enlace = within(screen.getByRole("navigation", { name: "Navegación principal" })).getByRole("link", { name: "Usuarios" });
    enlace.addEventListener("click", (e) => e.preventDefault());
    fireEvent.click(enlace);
    expect(screen.getByRole("button", { name: "Abrir menú" })).toBeInTheDocument();
    const lateral = document.getElementById("menu-lateral");
    fireEvent.pointerEnter(lateral!);
    expect(lateral).toHaveAttribute("data-abierto", "false");
  });

  it("incluye «Configuración» en el menú y el enlace de términos en el pie", () => {
    pathname.valor = "/configuracion/terminos";
    render(<EstructuraAplicacion>x</EstructuraAplicacion>);
    const menu = within(screen.getByRole("navigation", { name: "Navegación principal" }));
    expect(menu.getByRole("link", { name: "Configuración" })).toHaveAttribute("href", "/configuracion");
    expect(menu.getByRole("link", { name: "Configuración" })).toHaveAttribute("aria-current", "page");
    expect(within(screen.getByRole("contentinfo")).getByRole("button", { name: "Términos y condiciones" })).toBeInTheDocument();
  });

  it("muestra el usuario en sesión en el encabezado y permite cerrar sesión", () => {
    render(<EstructuraAplicacion>x</EstructuraAplicacion>);
    expect(screen.queryByRole("button", { name: "Cerrar sesión" })).not.toBeInTheDocument();
    fireEvent.click(within(screen.getByRole("banner")).getByRole("button", { name: "Menú de usuario: Ana Pérez" }));
    expect(screen.getByText("admin.prueba@sotra.test")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cerrar sesión" })).toBeEnabled();
  });

  it("usa la estructura del técnico en /tecnico y la de escritorio en el resto", () => {
    pathname.valor = "/tecnico/6";
    const { unmount } = render(<EstructuraAplicacion>x</EstructuraAplicacion>);
    expect(screen.getByRole("navigation", { name: "Navegación del técnico" })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Navegación principal" })).not.toBeInTheDocument();
    unmount();
    pathname.valor = "/tecnicos-otros";
    render(<EstructuraAplicacion>x</EstructuraAplicacion>);
    expect(screen.getByRole("navigation", { name: "Navegación principal" })).toBeInTheDocument();
  });

  it("incluye Configuración en la barra inferior del técnico", () => {
    pathname.valor = "/tecnico";
    render(<EstructuraAplicacion>x</EstructuraAplicacion>);
    const barra = screen.getByRole("navigation", { name: "Navegación del técnico" });
    expect(within(barra).getByRole("link", { name: "Configuración" })).toHaveAttribute("href", "/configuracion");
    expect(within(barra).getByRole("link", { name: "Mi trabajo" })).toHaveAttribute("aria-current", "page");
  });
});

describe("AltaUsuario", () => {
  it("informa el error de roles, la ausencia de roles y muestra el formulario con roles", () => {
    const { unmount } = render(<AltaUsuario roles={null} />);
    expect(screen.getByText("No se pudo obtener el listado de roles.")).toBeInTheDocument();
    unmount();
    const { unmount: desmontar } = render(<AltaUsuario roles={[]} />);
    expect(screen.getByText("No hay roles disponibles.")).toBeInTheDocument();
    desmontar();
    render(<AltaUsuario roles={[{ id: 1, nombre: "Técnico", estado: "activo" }]} />);
    expect(screen.getByLabelText("Nombre")).toBeInTheDocument();
    expect(screen.queryByLabelText("Contraseña")).not.toBeInTheDocument();
  });
});
