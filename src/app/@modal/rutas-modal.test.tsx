import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn(), push: vi.fn() }) }));

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

const contenido = (nombre: string) => ({ [nombre]: () => <p>{"Formulario " + nombre}</p> });
vi.mock("@/app/clientes/[id]/editar/contenido-editar-cliente", () => contenido("ContenidoEditarCliente"));
vi.mock("@/app/repuestos/[id]/editar/contenido-editar-repuesto", () => contenido("ContenidoEditarRepuesto"));
vi.mock("@/app/activos/[id]/editar/contenido-editar-activo", () => contenido("ContenidoEditarActivo"));
vi.mock("@/app/activos/modelos/[id]/editar/contenido-editar-modelo", () => contenido("ContenidoEditarModelo"));
vi.mock("@/app/activos/tipos/[id]/editar/contenido-editar-tipo", () => contenido("ContenidoEditarTipo"));
vi.mock("@/app/usuarios/[id]/editar/contenido-editar-usuario", () => contenido("ContenidoEditarUsuario"));
vi.mock("@/app/ordenes-trabajo/nuevo/contenido-nueva-orden", () => contenido("ContenidoNuevaOrden"));
vi.mock("@/app/ordenes-trabajo/[id]/editar/contenido-editar-orden", () => contenido("ContenidoEditarOrden"));
vi.mock("@/app/documentacion-tecnica/nuevo/contenido-nuevo-documento", () => contenido("ContenidoNuevoDocumento"));
vi.mock("@/app/documentacion-tecnica/[id]/editar/contenido-editar-documento", () => contenido("ContenidoEditarDocumento"));

const params = { params: Promise.resolve({ id: "5" }) };

/** Las altas y modificaciones abiertas desde un listado o un detalle se muestran como modal, con el tamaño que necesitan. */
const RUTAS = [
  ["(.)clientes/[id]/editar", "Modificar cliente", false],
  ["(.)repuestos/[id]/editar", "Modificar repuesto", false],
  ["(.)activos/[id]/editar", "Modificar activo", false],
  ["(.)activos/modelos/[id]/editar", "Modificar modelo de máquina", false],
  ["(.)activos/tipos/[id]/editar", "Modificar tipo de máquina", false],
  ["(.)usuarios/[id]/editar", "Modificar usuario", false],
  ["(.)ordenes-trabajo/nuevo", "Crear orden de trabajo", true],
  ["(.)ordenes-trabajo/[id]/editar", "Modificar orden de trabajo", true],
  ["(.)documentacion-tecnica/nuevo", "Cargar documento técnico", true],
  ["(.)documentacion-tecnica/[id]/editar", "Modificar documento", false],
] as const;

describe("rutas interceptadas de altas y modificaciones", () => {
  it.each(RUTAS)("%s se muestra como modal «%s»", async (ruta, titulo, esAmplio) => {
    const modulo = await import(`./${ruta}/page`);
    render(modulo.default(params));

    const dialogo = await screen.findByRole("dialog", { name: titulo });
    expect(dialogo).toHaveClass("modal-dialogo");
    if (esAmplio) expect(dialogo).toHaveClass("modal-dialogo-amplio");
    else expect(dialogo).not.toHaveClass("modal-dialogo-amplio");
    expect(await screen.findByText(/^Formulario Contenido/)).toBeInTheDocument();
  });

  it("la ranura no muestra nada sin modal abierto ni en direcciones desconocidas", async () => {
    const porDefecto = (await import("./default")).default;
    const cerrar = (await import("./[...resto]/page")).default;
    expect(porDefecto()).toBeNull();
    expect(cerrar()).toBeNull();
  });
});
