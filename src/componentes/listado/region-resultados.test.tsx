import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InformarResultados, ProveedorNavegacionListado } from "./navegacion-listado";
import { useFiltrosEnVivo } from "./use-filtros-en-vivo";

const replace = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace }) }));

function Barra() {
  const { valores, cambiar } = useFiltrosEnVivo({ inicial: { estado: "" }, construirUrl: (v) => (v.estado ? "/lista?estado=" + v.estado : "/lista") });
  return (
    <>
      <label htmlFor="estado">Estado</label>
      <select id="estado" onChange={(e) => cambiar({ estado: e.target.value })} value={valores.estado}>
        <option value="">Todos</option>
        <option value="activo">Activo</option>
      </select>
    </>
  );
}

const conProveedor = (ui: React.ReactNode) => <ProveedorNavegacionListado etiquetaCarga="Cargando…">{ui}</ProveedorNavegacionListado>;

beforeEach(() => {
  replace.mockReset();
});

describe("región de resultados (aria-live)", () => {
  it("anuncia «Cargando…» mientras navega y el total cuando termina", async () => {
    let terminar: () => void = () => undefined;
    replace.mockImplementation(() => new Promise<void>((resolver) => { terminar = resolver; }));
    render(
      conProveedor(
        <>
          <Barra />
          <InformarResultados total={1} />
        </>,
      ),
    );
    const region = screen.getByRole("status", { name: "Resultados del listado" });
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toHaveTextContent("1 resultado");

    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "activo" } });
    expect(region).toHaveTextContent("Cargando…");
    await act(async () => terminar());
    await waitFor(() => expect(region).toHaveTextContent("1 resultado"));
  });

  it("usa el plural, «Sin resultados» y se vacía si el listado falló", () => {
    const { rerender } = render(conProveedor(<InformarResultados total={41} />));
    const region = screen.getByRole("status", { name: "Resultados del listado" });
    expect(region).toHaveTextContent("41 resultados");
    rerender(conProveedor(<InformarResultados total={0} />));
    expect(region).toHaveTextContent("Sin resultados");
    rerender(conProveedor(<InformarResultados total={null} />));
    expect(region).toHaveTextContent("");
  });

  it("no falla si el listado se renderiza sin proveedor", () => {
    render(<InformarResultados total={3} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
