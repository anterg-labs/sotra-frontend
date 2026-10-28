import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { conEstadosOrden } from "@/pruebas/estados-orden";
import type { FiltrosOrdenesTrabajo, RespuestaCalendarioOrdenes } from "@/tipos/orden-trabajo";
import { CalendarioOrdenes } from "./calendario-ordenes";
import { SelectorDeVista } from "./selector-de-vista";

const api = vi.hoisted(() => ({ apiObtenerCalendarioOrdenes: vi.fn(), apiObtenerOrdenTrabajo: vi.fn() }));
vi.mock("@/servicios/api/api-ordenes-trabajo", () => api);
vi.mock("@/componentes/sesion/contexto-sesion", () => ({ SiTienePermiso: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("./[id]/detalle-orden", () => ({
  DetalleOrdenTrabajo: ({ ordenInicial, enModal }: { ordenInicial: { id: number }; enModal?: boolean }) => (
    <p>{"Detalle simulado de la orden " + ordenInicial.id + (enModal ? " en modal" : "")}</p>
  ),
}));

const filtros: FiltrosOrdenesTrabajo = {
  buscar: "", clienteId: "", activoId: "", tecnicoId: "", estado: "", fase: "", prioridad: "", tipo: "",
  fechaDesde: "", fechaHasta: "", soloActivas: false, sinAsignar: false, conSugerencias: false, vista: "calendario", mes: "2026-10", meses: "", eliminadas: false, pagina: 1,
};

const orden = (id: number, fecha: string, extra: Record<string, unknown> = {}) => ({
  id, fecha, nombreActivo: "Retro " + id, nombreCliente: "ACME", tipo: "correctivo", prioridad: "media", estado: "pendiente", fase: "pendiente", vencida: false, ...extra,
});

const respuesta = (elementos: unknown[], extra: Partial<RespuestaCalendarioOrdenes> = {}) =>
  ({ desde: "2026-10-01", hasta: "2026-10-31", truncado: false, elementos, ...extra }) as RespuestaCalendarioOrdenes;

function dibujar(f: FiltrosOrdenesTrabajo = filtros) {
  return render(conEstadosOrden(<CalendarioOrdenes filtros={f} />));
}

beforeEach(() => {
  Object.values(api).forEach((funcion) => funcion.mockReset());
  window.history.replaceState(null, "", "/ordenes-trabajo?vista=calendario");
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) { this.setAttribute("open", ""); });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) { this.removeAttribute("open"); });
});

afterEach(() => {
  window.history.replaceState(null, "", "/");
});

describe("selector de vista", () => {
  it("alterna entre lista y calendario conservando los filtros", () => {
    const { rerender } = render(<SelectorDeVista filtros={{ ...filtros, vista: "", estado: "pausado" }} />);
    expect(screen.getByRole("link", { name: "Lista" })).toHaveAttribute("aria-current", "page");
    const calendario = screen.getByRole("link", { name: "Calendario" }).getAttribute("href") ?? "";
    expect(calendario).toContain("estado=pausado");
    expect(calendario).toContain("vista=calendario");
    rerender(<SelectorDeVista filtros={{ ...filtros, estado: "pausado" }} />);
    expect(screen.getByRole("link", { name: "Calendario" })).toHaveAttribute("aria-current", "page");
    const lista = screen.getByRole("link", { name: "Lista" }).getAttribute("href") ?? "";
    expect(lista).toContain("estado=pausado");
    expect(lista).not.toContain("vista=");
  });
});

describe("calendario de órdenes", () => {
  it("ubica cada orden en su fecha prevista, marca las vencidas y pide el rango del mes con los filtros", async () => {
    api.apiObtenerCalendarioOrdenes.mockResolvedValue(respuesta([orden(1, "2026-10-10"), orden(2, "2026-10-10", { vencida: true, tipo: "preventivo" })]));
    dibujar({ ...filtros, clienteId: "3", tipo: "correctivo" });

    expect(await screen.findByRole("button", { name: /Orden 1, Retro 1, Pendiente\. Ver detalle/ })).toBeInTheDocument();
    expect(api.apiObtenerCalendarioOrdenes).toHaveBeenCalledWith({
      desde: "2026-10-01", hasta: "2026-10-31", clienteId: "3", activoId: "", estado: "", tipo: "correctivo", prioridad: "", incluirEliminadas: false, sinAsignar: false,
    });
    expect(screen.getByRole("heading", { name: "octubre de 2026" })).toBeInTheDocument();
    const dia = screen.getByRole("button", { name: /Orden 1,/ }).closest("td") as HTMLElement;
    expect(dia).toHaveTextContent("10");
    expect(within(dia).getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("button", { name: /Orden 2, .*, vencida/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1 vencida" })).toBeInTheDocument();
  });

  it("navega entre meses, permite ver varios a la vez y recuerda el estado en la URL", async () => {
    api.apiObtenerCalendarioOrdenes.mockResolvedValue(respuesta([]));
    dibujar();
    await screen.findByText("No hay órdenes con fecha prevista en este período.");

    fireEvent.click(screen.getByRole("button", { name: "Mes siguiente" }));
    await waitFor(() => expect(api.apiObtenerCalendarioOrdenes).toHaveBeenLastCalledWith(expect.objectContaining({ desde: "2026-11-01", hasta: "2026-11-30" })));
    fireEvent.change(screen.getByLabelText("Meses a la vez"), { target: { value: "3" } });
    await waitFor(() => expect(api.apiObtenerCalendarioOrdenes).toHaveBeenLastCalledWith(expect.objectContaining({ desde: "2026-11-01", hasta: "2027-01-31" })));
    expect(screen.getByRole("heading", { name: "noviembre de 2026 – enero de 2027" })).toBeInTheDocument();
    expect(screen.getAllByRole("table")).toHaveLength(3);
    expect(window.location.search).toContain("mes=2026-11");
    expect(window.location.search).toContain("meses=3");

    fireEvent.click(screen.getByLabelText("Mostrar eliminadas"));
    await waitFor(() => expect(api.apiObtenerCalendarioOrdenes).toHaveBeenLastCalledWith(expect.objectContaining({ incluirEliminadas: true })));
    expect(window.location.search).toContain("eliminadas=true");
  });

  it("la leyenda y el contador de vencidas filtran lo que se ve", async () => {
    api.apiObtenerCalendarioOrdenes.mockResolvedValue(
      respuesta([orden(1, "2026-10-05"), orden(2, "2026-10-06", { estado: "pausado", vencida: true })]),
    );
    dibujar();
    await screen.findByRole("button", { name: /Orden 1,/ });

    fireEvent.click(screen.getByRole("button", { name: "Pausado" }));
    expect(screen.queryByRole("button", { name: /Orden 1,/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Orden 2,/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Pausado" }));
    fireEvent.click(screen.getByRole("button", { name: "1 vencida" }));
    expect(screen.queryByRole("button", { name: /Orden 1,/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Orden 2,/ })).toBeInTheDocument();
  });

  it("con muchas órdenes en un día muestra tres y «+N más» las despliega", async () => {
    api.apiObtenerCalendarioOrdenes.mockResolvedValue(respuesta([1, 2, 3, 4, 5].map((id) => orden(id, "2026-10-12"))));
    dibujar();
    await screen.findByRole("button", { name: /Orden 1,/ });
    expect(screen.queryByRole("button", { name: /Orden 4,/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "+2 más" }));
    expect(screen.getByRole("button", { name: /Orden 5,/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ver menos" }));
    expect(screen.queryByRole("button", { name: /Orden 5,/ })).not.toBeInTheDocument();
  });

  it("el lápiz solo aparece en las órdenes que se pueden modificar y el detalle se abre en un modal", async () => {
    api.apiObtenerCalendarioOrdenes.mockResolvedValue(respuesta([orden(1, "2026-10-05"), orden(2, "2026-10-06", { estado: "cerrado", fase: "cerrada" })]));
    api.apiObtenerOrdenTrabajo.mockResolvedValue({ id: 1 });
    dibujar();
    await screen.findByRole("button", { name: /Orden 1,/ });
    expect(screen.getByRole("link", { name: "Modificar la orden 1" })).toHaveAttribute("href", "/ordenes-trabajo/1/editar");
    expect(screen.queryByRole("link", { name: "Modificar la orden 2" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Orden 1,/ }));
    expect(await screen.findByText("Detalle simulado de la orden 1 en modal")).toBeInTheDocument();
    expect(api.apiObtenerOrdenTrabajo).toHaveBeenCalledWith(1);
  });

  it("avisa si hay más órdenes que las que se pueden mostrar", async () => {
    api.apiObtenerCalendarioOrdenes.mockResolvedValueOnce(respuesta([], { truncado: true }));
    dibujar();
    expect(await screen.findByText(/Hay más órdenes que las que se pueden mostrar/)).toBeInTheDocument();
  });

  it("muestra el error del pedido con su botón de reintento", async () => {
    api.apiObtenerCalendarioOrdenes.mockRejectedValueOnce(new Error("No se pudo obtener el calendario de órdenes."));
    api.apiObtenerCalendarioOrdenes.mockResolvedValue(respuesta([orden(1, "2026-10-05")]));
    dibujar();
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo obtener el calendario de órdenes.");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByRole("button", { name: /Orden 1,/ })).toBeInTheDocument();
  });
});
