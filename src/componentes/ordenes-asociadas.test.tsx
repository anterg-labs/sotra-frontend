import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrdenesAsociadas } from "./ordenes-asociadas";
import type { OrdenTrabajo } from "@/tipos/orden-trabajo";
import type { Pagina } from "@/tipos/pagina";

const listarOrdenesTrabajo = vi.hoisted(() => vi.fn());
vi.mock("@/servicios/servicio-ordenes-trabajo", async (importarReal) => ({
  ...(await importarReal<typeof import("@/servicios/servicio-ordenes-trabajo")>()),
  listarOrdenesTrabajo,
}));

function orden(id: number, cliente: string): OrdenTrabajo {
  return {
    id, clienteId: 1, nombreCliente: cliente, activoId: 1, nombreActivo: "Excavadora", responsableId: 4, nombreResponsable: null, tecnicoId: null, nombreTecnico: null,
    tipo: "correctivo", prioridad: "media", descripcion: "", observaciones: "", fechaPrevistaEjecucion: "2026-10-30", estado: "pendiente",
    creadoEn: "2026-10-20T10:00:00Z", fechaInicio: null, fechaCierre: null, sugerencias: [], repuestos: [], transiciones: [],
    historialEstados: [], historialTecnicos: [], historialRepuestos: [], version: "v",
  };
}

function pagina(elementos: OrdenTrabajo[], numero = 1, totalPaginas = 2): Pagina<OrdenTrabajo> {
  return { elementos, pagina: numero, tamanoPagina: 20, totalElementos: 30, totalPaginas };
}

const columnaN = () => screen.getAllByRole("row").slice(1).map((fila) => within(fila).getAllByRole("cell")[0].textContent);

describe("órdenes asociadas", () => {
  beforeEach(() => {
    listarOrdenesTrabajo.mockReset();
  });

  it("ordena en el servidor al hacer clic en el título, vuelve a la página 1 y no vacía la tabla mientras carga", async () => {
    listarOrdenesTrabajo.mockResolvedValueOnce(pagina([orden(1, "Zeta"), orden(2, "Alfa")]));
    render(<OrdenesAsociadas activoId="" clienteId="1" tecnicoId="" titulo="Órdenes del cliente" />);
    expect(await screen.findByText("Zeta")).toBeInTheDocument();
    expect(listarOrdenesTrabajo.mock.calls[0][0]).toMatchObject({ clienteId: "1", pagina: 1, ordenarPor: "", direccionOrden: "" });

    let terminar: (valor: Pagina<OrdenTrabajo>) => void = () => undefined;
    listarOrdenesTrabajo.mockReturnValueOnce(new Promise<Pagina<OrdenTrabajo>>((resolver) => { terminar = resolver; }));
    fireEvent.click(screen.getByRole("button", { name: "Cliente: ordenar de forma ascendente" }));

    expect(listarOrdenesTrabajo.mock.calls[1][0]).toMatchObject({ ordenarPor: "nombreCliente", direccionOrden: "asc", pagina: 1 });
    expect(screen.getByText("Zeta")).toBeVisible();
    expect(screen.queryByText("Cargando órdenes de trabajo…")).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Cliente/ })).toHaveAttribute("aria-sort", "ascending");

    await act(async () => terminar(pagina([orden(2, "Alfa"), orden(1, "Zeta")])));
    await waitFor(() => expect(columnaN()).toEqual(["2", "1"]));
  });

  it("conserva el orden elegido al cambiar de página", async () => {
    listarOrdenesTrabajo.mockResolvedValueOnce(pagina([orden(1, "Zeta")]));
    render(<OrdenesAsociadas activoId="" clienteId="" tecnicoId="7" titulo="Órdenes del técnico" />);
    await screen.findByText("Zeta");

    listarOrdenesTrabajo.mockResolvedValueOnce(pagina([orden(1, "Zeta")]));
    fireEvent.click(screen.getByRole("button", { name: "Estado: ordenar de forma ascendente" }));
    await waitFor(() => expect(screen.getByRole("columnheader", { name: /Estado/ })).toHaveAttribute("aria-sort", "ascending"));

    listarOrdenesTrabajo.mockResolvedValueOnce(pagina([orden(5, "Beta")], 2));
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    await screen.findByText("Beta");
    expect(listarOrdenesTrabajo.mock.calls.at(-1)?.[0]).toMatchObject({ tecnicoId: "7", pagina: 2, ordenarPor: "estado", direccionOrden: "asc" });
  });

  it("muestra el error de carga y el estado vacío", async () => {
    listarOrdenesTrabajo.mockRejectedValueOnce(new Error("falló"));
    const { unmount } = render(<OrdenesAsociadas activoId="" clienteId="1" tecnicoId="" titulo="Órdenes" />);
    expect(await screen.findByText("No se pudieron obtener las órdenes de trabajo asociadas.")).toBeInTheDocument();
    unmount();

    listarOrdenesTrabajo.mockResolvedValueOnce(pagina([], 1, 1));
    render(<OrdenesAsociadas activoId="" clienteId="1" tecnicoId="" titulo="Órdenes" />);
    expect(await screen.findByText("No hay órdenes de trabajo asociadas.")).toBeInTheDocument();
  });
});
