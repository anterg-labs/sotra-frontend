import { fireEvent, render as renderBase, screen, waitFor, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MiTrabajo } from "./mi-trabajo";
import PaginaMiTrabajo from "./page";
import { conEstadosOrden } from "@/pruebas/estados-orden";
import { usuarioDePruebas } from "@/pruebas/sesion-de-pruebas";
import { obtenerEstadoSesion } from "@/servicios/servidor/sesion";

function render(ui: ReactElement) {
  return renderBase(conEstadosOrden(ui));
}

const replace = vi.hoisted(() => vi.fn());
const listarOrdenesTrabajoServidor = vi.hoisted(() => vi.fn());
const listarTecnicosServidor = vi.hoisted(() => vi.fn());
const obtenerUsuarioServidor = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@/servicios/servidor/ordenes-trabajo", () => ({ listarOrdenesTrabajoServidor, listarTecnicosServidor }));
vi.mock("@/servicios/servidor/usuarios", () => ({ obtenerUsuarioServidor }));

function orden(id: number, estado: string, prioridad: string, fecha: string) {
  return { id, nombreCliente: "ANTER-G", nombreActivo: "Activo " + id, prioridad, estado, fechaPrevistaEjecucion: fecha };
}

function pagina(elementos: unknown[]) {
  return { elementos, pagina: 1, tamanoPagina: 20, totalElementos: elementos.length, totalPaginas: 1 };
}

const tecnico = { id: 25, nombre: "Roberto", apellido: "Pérez" };

beforeEach(() => {
  [replace, listarOrdenesTrabajoServidor, listarTecnicosServidor, obtenerUsuarioServidor].forEach((f) => f.mockReset());
  listarTecnicosServidor.mockResolvedValue([tecnico]);
  listarOrdenesTrabajoServidor.mockImplementation(async (filtros: { fase: string }) => {
    if (filtros.fase === "pendiente") return pagina([orden(1, "en_progreso", "baja", "2026-11-01")]);
    return pagina([orden(2, "en_progreso", "alta", "2026-12-01"), orden(3, "en_progreso", "alta", "2026-11-15"), orden(4, "pausado", "media", "2026-11-05")]);
  });
});

describe("Mi trabajo (Server Component)", () => {
  it("pide elegir un técnico antes de mostrar órdenes y no consulta órdenes", async () => {
    render(await PaginaMiTrabajo({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Elegí un técnico para ver sus órdenes.")).toBeInTheDocument();
    expect(listarOrdenesTrabajoServidor).not.toHaveBeenCalled();
  });

  it("lista las órdenes abiertas del técnico ordenadas por prioridad y fecha prevista", async () => {
    render(await PaginaMiTrabajo({ searchParams: Promise.resolve({ tecnicoId: "25" }) }));
    const enlaces = screen.getAllByRole("link");
    expect(enlaces.map((enlace) => enlace.getAttribute("href"))).toEqual(["/tecnico/3", "/tecnico/2", "/tecnico/4", "/tecnico/1"]);
    expect(listarOrdenesTrabajoServidor).toHaveBeenCalledWith(expect.objectContaining({ tecnicoId: "25", fase: "en_curso" }));
    expect(listarOrdenesTrabajoServidor).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("combobox", { name: "Técnico" })).toHaveValue("Roberto Pérez");
  });

  it("completa el técnico elegido si no está en la primera página y descarta ids inválidos", async () => {
    obtenerUsuarioServidor.mockResolvedValue({ id: 90, nombre: "Lucía", apellido: "Díaz" });
    render(await PaginaMiTrabajo({ searchParams: Promise.resolve({ tecnicoId: "90" }) }));
    expect(obtenerUsuarioServidor).toHaveBeenCalledWith(90);
    expect(screen.getByRole("combobox", { name: "Técnico" })).toHaveValue("Lucía Díaz");

    listarOrdenesTrabajoServidor.mockClear();
    render(await PaginaMiTrabajo({ searchParams: Promise.resolve({ tecnicoId: "x;1" }) }));
    expect(listarOrdenesTrabajoServidor).not.toHaveBeenCalled();
  });

  it("muestra un error con consejo si falla la carga de órdenes, y otro si falla la lista de técnicos", async () => {
    listarOrdenesTrabajoServidor.mockRejectedValue(new Error("red"));
    const { unmount } = render(await PaginaMiTrabajo({ searchParams: Promise.resolve({ tecnicoId: "25" }) }));
    expect(screen.getByRole("alert")).toHaveTextContent("Revisá tu conexión");
    unmount();

    listarTecnicosServidor.mockRejectedValue(new Error("x"));
    render(await PaginaMiTrabajo({ searchParams: Promise.resolve({}) }));
    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo obtener la lista de técnicos.");
  });
});

describe("Mi trabajo con la sesión de un técnico", () => {
  it("muestra las órdenes del usuario en sesión, sin selector ni lista de técnicos", async () => {
    vi.mocked(obtenerEstadoSesion).mockResolvedValueOnce({ estado: "con-acceso", usuario: usuarioDePruebas(["tecnico"], { idUsuario: 30 }) });
    render(await PaginaMiTrabajo({ searchParams: Promise.resolve({ tecnicoId: "25" }) }));
    expect(listarOrdenesTrabajoServidor).toHaveBeenCalledWith(expect.objectContaining({ tecnicoId: "30" }));
    expect(listarTecnicosServidor).not.toHaveBeenCalled();
    expect(screen.queryByRole("combobox", { name: "Técnico" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(4);
  });
});

describe("Mi trabajo (isla)", () => {
  const ordenes = [orden(3, "en_progreso", "alta", "2026-11-15"), orden(2, "en_progreso", "alta", "2026-12-01"), orden(4, "pausado", "media", "2026-11-05"), orden(1, "en_progreso", "baja", "2026-11-01")];

  it("filtra por estado con los chips (con contadores) y busca por número", async () => {
    render(<MiTrabajo puedeElegirTecnico error="" ordenes={ordenes as never} tecnicoId="25" tecnicos={[{ valor: "25", etiqueta: "Roberto Pérez" }]} />);
    const chipPausadas = screen.getByRole("button", { name: /Pausado/ });
    expect(within(chipPausadas).getByText("1")).toBeInTheDocument();
    fireEvent.click(chipPausadas);
    expect(screen.getAllByRole("link")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: /Todas/ }));
    fireEvent.change(screen.getByLabelText("Buscar por número de orden"), { target: { value: "2" } });
    await waitFor(() => expect(screen.getAllByRole("link")).toHaveLength(1));
    expect(screen.getByRole("link")).toHaveAttribute("href", "/tecnico/2");
  });

  it("al elegir un técnico escribe la URL; sin técnico la quita", () => {
    render(<MiTrabajo puedeElegirTecnico error="" ordenes={null} tecnicoId="" tecnicos={[{ valor: "25", etiqueta: "Roberto Pérez" }]} />);
    fireEvent.focus(screen.getByRole("combobox", { name: "Técnico" }));
    fireEvent.click(screen.getByRole("option", { name: "Roberto Pérez" }));
    expect(replace).toHaveBeenLastCalledWith("/tecnico?tecnicoId=25");
  });

  it("muestra el vacío cuando el filtro no tiene órdenes", () => {
    render(<MiTrabajo puedeElegirTecnico error="" ordenes={[]} tecnicoId="25" tecnicos={[]} />);
    expect(screen.getByText("No tenés órdenes pendientes con este filtro.")).toBeInTheDocument();
  });
});
