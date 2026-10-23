import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EditarRepuesto from "./[id]/editar/page";
import DetalleRepuesto from "./[id]/page";
import NuevoRepuesto from "./nuevo/page";
import PaginaRepuestos from "./page";

const push = vi.hoisted(() => vi.fn());
const avisarStockActualizado = vi.hoisted(() => vi.fn());
const listado = vi.hoisted(() => vi.fn());
const s = vi.hoisted(() => ({
  obtenerRepuestoServidor: vi.fn(),
  listarRepuestosServidor: vi.fn(),
  obtenerAlertasStockServidor: vi.fn(),
  listarMovimientosStockServidor: vi.fn(),
}));
const a = vi.hoisted(() => ({
  crearRepuestoAccion: vi.fn(),
  actualizarRepuestoAccion: vi.fn(),
  cambiarEstadoRepuestoAccion: vi.fn(),
  actualizarStockMinimoAccion: vi.fn(),
  registrarIngresoStockAccion: vi.fn(),
  registrarEgresoStockAccion: vi.fn(),
  registrarAjusteStockAccion: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/componentes/avisos", () => ({ useAvisos: () => ({ mostrarAviso: vi.fn() }) }));
vi.mock("@/hooks/use-alertas-stock", () => ({ avisarStockActualizado }));
vi.mock("@/servicios/servidor/repuestos", () => s);
vi.mock("@/servicios/servidor/movimientos-stock", () => ({ listarMovimientosStockServidor: s.listarMovimientosStockServidor }));
vi.mock("./acciones", () => a);
vi.mock("./listado-repuestos", () => ({
  ListadoRepuestos: (props: unknown) => {
    listado(props);
    return <p>Listado simulado</p>;
  },
}));

const repuesto = {
  id: 5, codigo: "R-5", nombre: "Filtro", descripcion: "Aceite", marca: "CAT", ubicacion: "A1",
  cantidad: 10, cantidadMinima: 4, estado: "activo", estadoStock: "normal",
};
const movimiento = {
  id: 1, repuestoId: 5, codigoRepuesto: "R-5", nombreRepuesto: "Filtro", tipo: "ingreso", cantidad: 3, fecha: "2026-10-01T00:00:00Z",
  ubicacion: "A1", usuarioId: null, nombreUsuario: null, motivo: "Compra", observaciones: "", stockAnterior: 7, stockPosterior: 10,
};
const pagina = (elementos: unknown[]) => ({ elementos, pagina: 1, tamanoPagina: 20, totalElementos: elementos.length, totalPaginas: 1 });
const parametros = (id: string, busqueda: Record<string, string> = {}) => ({ params: Promise.resolve({ id }), searchParams: Promise.resolve(busqueda) });

beforeEach(() => {
  [...Object.values(s), ...Object.values(a), push, avisarStockActualizado, listado].forEach((f) => f.mockReset());
  s.obtenerRepuestoServidor.mockResolvedValue(repuesto);
  s.listarMovimientosStockServidor.mockResolvedValue(pagina([movimiento]));
  s.obtenerAlertasStockServidor.mockResolvedValue({ bajo: 1, sinStock: 0, total: 1 });
  s.listarRepuestosServidor.mockResolvedValue(pagina([{ ...repuesto, estadoStock: "bajo" }]));
});

describe("página del listado de repuestos (Server Component)", () => {
  it("lee searchParams, trae las alertas en el servidor y arma aviso, chips y listado", async () => {
    render(await PaginaRepuestos({ searchParams: Promise.resolve({ stock: "bajo", buscar: "fil", pagina: "2" }) }));
    expect(screen.getByRole("heading", { level: 1, name: "Repuestos" })).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Alerta de stock insuficiente" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Stock bajo/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Buscar")).toHaveValue("fil");
    expect(screen.getByRole("link", { name: "Movimientos de stock" })).toHaveAttribute("href", "/repuestos/movimientos");
    expect(await screen.findByText("Listado simulado")).toBeInTheDocument();
    expect(listado).toHaveBeenCalledWith({ consulta: expect.any(Promise), filtros: { buscar: "fil", estado: "", ubicacion: "", stock: "bajo", pagina: 2 } });
  });

  it("si fallan las alertas el listado sigue funcionando sin aviso", async () => {
    s.obtenerAlertasStockServidor.mockRejectedValue(new Error("x"));
    render(await PaginaRepuestos({ searchParams: Promise.resolve({}) }));
    expect(screen.queryByRole("status", { name: "Alerta de stock insuficiente" })).not.toBeInTheDocument();
    expect(await screen.findByText("Listado simulado")).toBeInTheDocument();
  });
});

describe("detalle de repuesto (Server Component + panel de stock)", () => {
  it("muestra datos, movimientos con la variación de stock y las acciones de un repuesto activo", async () => {
    render(await DetalleRepuesto(parametros("5")));
    expect(screen.getByRole("heading", { level: 1, name: "R-5 - Filtro" })).toBeInTheDocument();
    expect(screen.getByText("Aceite")).toBeInTheDocument();
    expect(screen.getByText("7 → 10")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver detalle" })).toHaveAttribute("href", "/repuestos/movimientos/1");
    expect(screen.getByRole("button", { name: "Registrar egreso" })).toBeEnabled();
    expect(screen.queryByRole("form", { name: /ingreso/i })).not.toBeInTheDocument();
  });

  it("muestra el historial del repuesto con fecha y hora, usuario y el enlace al historial completo", async () => {
    s.listarMovimientosStockServidor.mockResolvedValue({ ...pagina([movimiento]), totalElementos: 45 });
    render(await DetalleRepuesto(parametros("5")));

    expect(screen.getByRole("heading", { level: 2, name: "Historial de movimientos" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Fecha y hora" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Usuario" })).toBeInTheDocument();
    expect(screen.getByText("Sin registrar")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver los 45 movimientos" })).toHaveAttribute("href", "/repuestos/movimientos?repuestoId=5");
  });

  it("no ofrece el historial completo cuando ya se muestran todos los movimientos", async () => {
    render(await DetalleRepuesto(parametros("5")));

    expect(screen.queryByRole("link", { name: /Ver los \d+ movimientos/ })).not.toBeInTheDocument();
  });

  it("informa el error del repuesto, el de movimientos y el vacío", async () => {
    s.listarMovimientosStockServidor.mockRejectedValueOnce(new Error("x"));
    const { unmount } = render(await DetalleRepuesto(parametros("5")));
    expect(screen.getByText("No se pudieron obtener los movimientos de stock de este repuesto.")).toBeInTheDocument();
    unmount();

    s.listarMovimientosStockServidor.mockResolvedValueOnce(pagina([]));
    const { unmount: segundo } = render(await DetalleRepuesto(parametros("5")));
    expect(screen.getByText("Este repuesto todavía no tiene movimientos de stock.")).toBeInTheDocument();
    segundo();

    s.obtenerRepuestoServidor.mockRejectedValue(new Error("x"));
    render(await DetalleRepuesto(parametros("5")));
    expect(screen.getByText("No se pudo obtener la información del repuesto solicitado.")).toBeInTheDocument();
  });

  it("avisa con texto claro cuando el stock está bajo o agotado, y un inactivo no permite mover stock", async () => {
    s.obtenerRepuestoServidor.mockResolvedValue({ ...repuesto, cantidad: 0, estadoStock: "sin_stock" });
    const { unmount } = render(await DetalleRepuesto(parametros("5")));
    expect(screen.getByText(/Sin stock: no quedan unidades/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Registrar egreso" })).toBeDisabled();
    unmount();

    s.obtenerRepuestoServidor.mockResolvedValue({ ...repuesto, estado: "inactivo" });
    render(await DetalleRepuesto(parametros("5", { ingresar: "1" })));
    expect(screen.queryByRole("button", { name: "Ingresar repuesto" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Registrar egreso" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cambiar mínimo" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Cantidad a ingresar")).not.toBeInTheDocument();
  });

  it("abre el formulario de ingreso con ?ingresar=1 si el repuesto está activo", async () => {
    render(await DetalleRepuesto(parametros("5", { ingresar: "1" })));
    expect(screen.getByLabelText("Cantidad a ingresar")).toBeInTheDocument();
    expect(screen.queryByLabelText("Fecha del ingreso")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Motivo del ingreso")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Ubicación o depósito")).not.toBeInTheDocument();
  });

  it("valida el ingreso: enfoca el primer campo inválido y muestra el error del servidor", async () => {
    a.registrarIngresoStockAccion.mockResolvedValue({ exito: false, errores: {}, mensaje: "No se pudo registrar el ingreso de stock." });
    render(await DetalleRepuesto(parametros("5", { ingresar: "1" })));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar ingreso" }));
    expect(await screen.findByText("La cantidad a ingresar debe ser un número entero mayor a cero.")).toHaveAttribute("role", "alert");
    await waitFor(() => expect(screen.getByLabelText("Cantidad a ingresar")).toHaveFocus());
    expect(a.registrarIngresoStockAccion).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Cantidad a ingresar"), { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar ingreso" }));
    const alerta = await screen.findByText("No se pudo registrar el ingreso de stock.");
    await waitFor(() => expect(alerta).toHaveFocus());
  });

  it("registra un ingreso válido, confirma y avisa a los contadores", async () => {
    a.registrarIngresoStockAccion.mockResolvedValue({ exito: true, registro: movimiento });
    render(await DetalleRepuesto(parametros("5", { ingresar: "1" })));
    fireEvent.change(screen.getByLabelText("Cantidad a ingresar"), { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar ingreso" }));
    await waitFor(() => expect(a.registrarIngresoStockAccion).toHaveBeenCalledWith(5, { cantidad: 5, observaciones: "" }));
    expect(await screen.findByText("Ingreso registrado correctamente. El stock se actualizó.")).toBeInTheDocument();
    expect(avisarStockActualizado).toHaveBeenCalled();
    expect(screen.queryByLabelText("Cantidad a ingresar")).not.toBeInTheDocument();
  });

  it("registra un egreso validando contra el stock disponible y un ajuste", async () => {
    a.registrarEgresoStockAccion.mockResolvedValue({ exito: true, registro: { ...movimiento, tipo: "egreso" } });
    a.registrarAjusteStockAccion.mockResolvedValue({ exito: true, registro: { ...movimiento, tipo: "ajuste" } });
    render(await DetalleRepuesto(parametros("5")));
    fireEvent.click(screen.getByRole("button", { name: "Registrar egreso" }));
    fireEvent.change(screen.getByLabelText("Cantidad a retirar"), { target: { value: "99" } });
    fireEvent.change(screen.getByLabelText("Motivo del egreso"), { target: { value: "Entrega" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar egreso" }));
    expect(await screen.findByText("No hay stock suficiente: disponible 10.")).toBeInTheDocument();
    expect(a.registrarEgresoStockAccion).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Cantidad a retirar"), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar egreso" }));
    await waitFor(() => expect(a.registrarEgresoStockAccion).toHaveBeenCalledWith(5, expect.objectContaining({ cantidad: 2, motivo: "Entrega" })));
    expect(await screen.findByText("Egreso registrado correctamente. El stock se actualizó.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ajustar stock" }));
    fireEvent.change(screen.getByLabelText("Stock real contado"), { target: { value: "8" } });
    fireEvent.change(screen.getByLabelText("Motivo del ajuste"), { target: { value: "Conteo" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar ajuste" }));
    await waitFor(() => expect(a.registrarAjusteStockAccion).toHaveBeenCalledWith(5, { cantidadReal: 8, motivo: "Conteo", observaciones: "" }));
    expect(await screen.findByText("Ajuste registrado correctamente. El stock se actualizó.")).toBeInTheDocument();
  });

  it("actualiza el stock mínimo desde el editor y confirma", async () => {
    a.actualizarStockMinimoAccion.mockResolvedValue({ exito: true, registro: { ...repuesto, cantidadMinima: 6 } });
    render(await DetalleRepuesto(parametros("5")));
    fireEvent.click(screen.getByRole("button", { name: "Cambiar mínimo" }));
    fireEvent.change(screen.getByLabelText("Stock mínimo"), { target: { value: "-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText("El stock mínimo debe ser un número entero mayor o igual a cero.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Stock mínimo"), { target: { value: "6" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(a.actualizarStockMinimoAccion).toHaveBeenCalledWith(5, 6));
    expect(await screen.findByText("Stock mínimo actualizado.")).toBeInTheDocument();
  });
});

describe("edición y alta de repuesto", () => {
  it("la edición precarga, deja la cantidad de solo lectura y envía los cambios", async () => {
    a.actualizarRepuestoAccion.mockResolvedValue({ exito: true, registro: repuesto });
    render(await EditarRepuesto({ params: Promise.resolve({ id: "5" }) }));
    expect(screen.getByLabelText("Código")).toHaveValue("R-5");
    expect(screen.getByLabelText("Cantidad en stock")).toHaveAttribute("readonly");
    fireEvent.change(screen.getByLabelText("Nombre del repuesto"), { target: { value: "Filtro XL" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar modificación" }));
    await waitFor(() => expect(a.actualizarRepuestoAccion).toHaveBeenCalledWith(5, expect.objectContaining({ nombre: "Filtro XL", cantidad: 10 })));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/repuestos"));
  });

  it("la edición informa el error de carga y la alta valida los campos antes de llamar a la acción", async () => {
    s.obtenerRepuestoServidor.mockRejectedValue(new Error("x"));
    const { unmount } = render(await EditarRepuesto({ params: Promise.resolve({ id: "5" }) }));
    expect(screen.getByText("No se pudo obtener la información del repuesto solicitado.")).toBeInTheDocument();
    unmount();

    render(<NuevoRepuesto />);
    fireEvent.click(screen.getByRole("button", { name: "Confirmar registro" }));
    expect(await screen.findByText("El código del repuesto es obligatorio.")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText("Código")).toHaveFocus());
    expect(a.crearRepuestoAccion).not.toHaveBeenCalled();
  });

  it("ubica el código duplicado junto al campo", async () => {
    a.crearRepuestoAccion.mockResolvedValue({ exito: false, errores: { codigo: "El código ya existe." }, mensaje: "" });
    render(<NuevoRepuesto />);
    fireEvent.change(screen.getByLabelText("Código"), { target: { value: "R-1" } });
    fireEvent.change(screen.getByLabelText("Nombre del repuesto"), { target: { value: "Filtro" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar registro" }));
    expect(await screen.findByText("El código ya existe.")).toHaveAttribute("id", "codigo-error");
    await waitFor(() => expect(screen.getByLabelText("Código")).toHaveFocus());
  });
});
