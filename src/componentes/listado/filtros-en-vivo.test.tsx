import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { esperarRetardoDeBusqueda } from "@/pruebas/ayudas-filtros";
import { ProveedorNavegacionListado, ZonaListado } from "./navegacion-listado";
import { PaginacionListado } from "./paginacion-listado";
import { construirUrlListado } from "./url-listado";
import { RETARDO_BUSQUEDA_MS, useFiltrosEnVivo } from "./use-filtros-en-vivo";

const push = vi.hoisted(() => vi.fn());
const replace = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace }) }));

type Valores = { buscar: string; estado: string; desde: string; hasta: string };
const vacios: Valores = { buscar: "", estado: "", desde: "", hasta: "" };

function Barra(props: { inicial?: Valores }) {
  const { valores, cambiar, aplicarAhora, limpiar, estaPendiente } = useFiltrosEnVivo<Valores>({
    inicial: props.inicial ?? vacios,
    construirUrl: (v) => construirUrlListado("/lista", v),
    sonValidos: (v) => v.desde === "" || v.hasta === "" || v.hasta >= v.desde,
    alInvalido: () => document.getElementById("hasta")?.focus(),
  });
  return (
    <form
      aria-busy={estaPendiente}
      onSubmit={(evento) => {
        evento.preventDefault();
        aplicarAhora();
      }}
    >
      <label htmlFor="buscar">Buscar</label>
      <input id="buscar" onChange={(e) => cambiar({ buscar: e.target.value }, true)} value={valores.buscar} />
      <label htmlFor="estado">Estado</label>
      <select id="estado" onChange={(e) => cambiar({ estado: e.target.value })} value={valores.estado}>
        <option value="">Todos</option>
        <option value="activo">Activo</option>
      </select>
      <label htmlFor="desde">Desde</label>
      <input id="desde" onChange={(e) => cambiar({ desde: e.target.value })} type="date" value={valores.desde} />
      <label htmlFor="hasta">Hasta</label>
      <input id="hasta" onChange={(e) => cambiar({ hasta: e.target.value })} type="date" value={valores.hasta} />
      <button onClick={() => limpiar(vacios)} type="button">Limpiar filtros</button>
    </form>
  );
}

function conProveedor(ui: React.ReactNode) {
  return <ProveedorNavegacionListado etiquetaCarga="Cargando…">{ui}</ProveedorNavegacionListado>;
}

beforeEach(() => {
  push.mockReset();
  replace.mockReset();
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("filtros en vivo", () => {
  it("el texto navega una sola vez, tras el retardo, con router.replace", async () => {
    render(conProveedor(<Barra />));
    const buscar = screen.getByLabelText("Buscar");
    fireEvent.change(buscar, { target: { value: "a" } });
    fireEvent.change(buscar, { target: { value: "ac" } });
    fireEvent.change(buscar, { target: { value: "acme" } });
    expect(replace).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(RETARDO_BUSQUEDA_MS - 50);
    });
    expect(replace).not.toHaveBeenCalled();
    await esperarRetardoDeBusqueda();
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/lista?buscar=acme");
    expect(push).not.toHaveBeenCalled();
  });

  it("los selectores y las fechas aplican de inmediato, incluyendo lo que se estaba escribiendo", () => {
    render(conProveedor(<Barra />));
    fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "acme" } });
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "activo" } });
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenLastCalledWith("/lista?buscar=acme&estado=activo");
    fireEvent.change(screen.getByLabelText("Desde"), { target: { value: "2026-05-01" } });
    expect(replace).toHaveBeenLastCalledWith("/lista?buscar=acme&estado=activo&desde=2026-05-01");
  });

  it("no queda un temporizador pendiente después de aplicar de inmediato", async () => {
    render(conProveedor(<Barra />));
    fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "acme" } });
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "activo" } });
    await esperarRetardoDeBusqueda();
    expect(replace).toHaveBeenCalledTimes(1);
  });

  it("no navega si el valor normalizado no cambió", async () => {
    render(conProveedor(<Barra inicial={{ ...vacios, buscar: "acme" }} />));
    const buscar = screen.getByLabelText("Buscar");
    fireEvent.change(buscar, { target: { value: "acme  " } });
    await esperarRetardoDeBusqueda();
    expect(replace).not.toHaveBeenCalled();

    fireEvent.change(buscar, { target: { value: "otro" } });
    await esperarRetardoDeBusqueda();
    expect(replace).toHaveBeenCalledTimes(1);
    fireEvent.change(buscar, { target: { value: " otro" } });
    await esperarRetardoDeBusqueda();
    expect(replace).toHaveBeenCalledTimes(1);
  });

  it("vuelve a la página 1: la URL de los filtros nunca lleva pagina", async () => {
    render(conProveedor(<Barra />));
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "activo" } });
    expect(String(replace.mock.calls[0][0])).not.toContain("pagina");
  });

  it("un rango de fechas invertido no navega y lleva el foco a la fecha final", () => {
    render(conProveedor(<Barra />));
    fireEvent.change(screen.getByLabelText("Desde"), { target: { value: "2026-06-10" } });
    expect(replace).toHaveBeenCalledTimes(1);
    fireEvent.change(screen.getByLabelText("Hasta"), { target: { value: "2026-06-01" } });
    expect(replace).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Hasta")).toHaveFocus();

    fireEvent.change(screen.getByLabelText("Hasta"), { target: { value: "2026-06-20" } });
    expect(replace).toHaveBeenCalledTimes(2);
    expect(replace).toHaveBeenLastCalledWith("/lista?desde=2026-06-10&hasta=2026-06-20");
  });

  it("limpiar filtros vacía los campos y navega a la lista sin filtros", () => {
    render(conProveedor(<Barra inicial={{ ...vacios, buscar: "acme", estado: "activo" }} />));
    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(replace).toHaveBeenCalledWith("/lista");
    expect(screen.getByLabelText("Buscar")).toHaveValue("");
    expect(screen.getByLabelText("Estado")).toHaveValue("");
  });

  it("Enter en el buscador aplica ya mismo, sin recargar la página", () => {
    render(conProveedor(<Barra />));
    const buscar = screen.getByLabelText("Buscar");
    fireEvent.change(buscar, { target: { value: "acme" } });
    const envio = fireEvent.submit(buscar.closest("form") as HTMLFormElement);
    expect(envio).toBe(false);
    expect(replace).toHaveBeenCalledWith("/lista?buscar=acme");
  });

  it("al escribir conserva el mismo campo, con foco, aunque la tabla se reemplace por el esqueleto", async () => {
    replace.mockImplementation(() => new Promise<void>(() => undefined));
    render(
      conProveedor(
        <>
          <Barra />
          <ZonaListado>
            <p>Tabla</p>
          </ZonaListado>
        </>,
      ),
    );
    const buscar = screen.getByLabelText("Buscar") as HTMLInputElement;
    buscar.focus();
    fireEvent.change(buscar, { target: { value: "acme" } });
    await esperarRetardoDeBusqueda();
    expect(screen.getByRole("status", { name: "Cargando…" })).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText("Tabla")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Buscar")).toBe(buscar);
    expect(buscar).toHaveFocus();
    expect(buscar.value).toBe("acme");
    expect(document.querySelector("form")).toHaveAttribute("aria-busy", "true");
  });

  it("la paginación registra su URL: volver a la misma búsqueda sí navega a la página 1", async () => {
    render(
      conProveedor(
        <>
          <Barra inicial={{ ...vacios, buscar: "acme" }} />
          <PaginacionListado filtros={{ buscar: "acme" }} pagina={1} plural="cosas" ruta="/lista" totalElementos={50} totalPaginas={3} />
        </>,
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(push).toHaveBeenCalledWith("/lista?buscar=acme&pagina=2");
    fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "otro" } });
    await esperarRetardoDeBusqueda();
    fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "acme" } });
    await esperarRetardoDeBusqueda();
    expect(replace).toHaveBeenLastCalledWith("/lista?buscar=acme");
  });
});
