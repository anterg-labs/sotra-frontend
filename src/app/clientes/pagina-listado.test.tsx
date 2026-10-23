import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PaginaClientes from "./page";

const listado = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/componentes/avisos", () => ({ useAvisos: () => ({ mostrarAviso: vi.fn() }) }));
vi.mock("./acciones", () => ({ cambiarEstadoClienteAccion: vi.fn(), crearClienteAccion: vi.fn() }));
vi.mock("./listado-clientes", () => ({
  ListadoClientes: (props: unknown) => {
    listado(props);
    return <p>Listado simulado</p>;
  },
}));

describe("página del listado (Server Component)", () => {
  it("lee searchParams de forma asíncrona y pasa los filtros a la barra y al listado", async () => {
    render(await PaginaClientes({ searchParams: Promise.resolve({ buscar: "acme", estado: "inactivo", pagina: "2" }) }));
    expect(screen.getByRole("heading", { level: 1, name: "Gestión de clientes" })).toBeInTheDocument();
    expect(screen.getByLabelText("Buscar")).toHaveValue("acme");
    expect(screen.getByLabelText("Estado")).toHaveValue("inactivo");
    expect(screen.getByRole("button", { name: "Registrar nuevo cliente" })).toBeInTheDocument();
    expect(await screen.findByText("Listado simulado")).toBeInTheDocument();
    expect(listado).toHaveBeenCalledWith({ filtros: expect.objectContaining({ buscar: "acme", estado: "inactivo", pagina: 2 }) });
  });
});
