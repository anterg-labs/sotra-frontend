import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProveedorDeAvisos, useAvisos } from "./avisos";
import { ModalConfirmacion } from "./modal-confirmacion";
import { RegistroServiceWorker } from "./registro-service-worker";
import { avisarStockActualizado, useAlertasStock } from "@/hooks/use-alertas-stock";

const obtenerAlertasStock = vi.hoisted(() => vi.fn());
vi.mock("@/servicios/servicio-repuestos", () => ({ obtenerAlertasStock }));

function Disparador({ tipo }: { tipo: "exito" | "error" | "info" }) {
  const { mostrarAviso } = useAvisos();
  return (
    <button onClick={() => mostrarAviso(tipo, "Mensaje " + tipo)} type="button">
      avisar
    </button>
  );
}

describe("ProveedorDeAvisos", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("muestra el aviso en una región de estado y lo cierra solo a los 5 segundos", () => {
    render(
      <ProveedorDeAvisos>
        <Disparador tipo="exito" />
      </ProveedorDeAvisos>,
    );
    fireEvent.click(screen.getByRole("button", { name: "avisar" }));
    expect(screen.getByRole("status")).toHaveTextContent("Mensaje exito");
    act(() => {
      vi.advanceTimersByTime(4999);
    });
    expect(screen.getByText("Mensaje exito")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByText("Mensaje exito")).not.toBeInTheDocument();
  });

  it("permite cerrar manualmente y acumula varios avisos", () => {
    render(
      <ProveedorDeAvisos>
        <Disparador tipo="error" />
      </ProveedorDeAvisos>,
    );
    fireEvent.click(screen.getByRole("button", { name: "avisar" }));
    fireEvent.click(screen.getByRole("button", { name: "avisar" }));
    expect(screen.getAllByText("Mensaje error")).toHaveLength(2);
    fireEvent.click(screen.getAllByRole("button", { name: "Cerrar aviso" })[0]);
    expect(screen.getAllByText("Mensaje error")).toHaveLength(1);
  });

  it("sin proveedor, mostrarAviso no falla", () => {
    render(<Disparador tipo="info" />);
    expect(() => fireEvent.click(screen.getByRole("button", { name: "avisar" }))).not.toThrow();
  });
});

describe("ModalConfirmacion", () => {
  it("muestra título y descripción, y llama a confirmar y cancelar", () => {
    const onConfirmar = vi.fn();
    const onCancelar = vi.fn();
    render(
      <ModalConfirmacion
        descripcion="Se dará de baja."
        etiquetaConfirmar="Dar de baja"
        onCancelar={onCancelar}
        onConfirmar={onConfirmar}
        titulo="Baja"
      />,
    );
    expect(screen.getByRole("dialog", { name: "Baja" })).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("Se dará de baja.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Dar de baja" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onConfirmar).toHaveBeenCalledOnce();
    expect(onCancelar).toHaveBeenCalledOnce();
  });

  it("cancela al hacer clic fuera, pero no al hacer clic dentro del panel", () => {
    const onCancelar = vi.fn();
    const { container } = render(
      <ModalConfirmacion descripcion="d" onCancelar={onCancelar} onConfirmar={vi.fn()} etiquetaConfirmar="Ok" titulo="T" />,
    );
    fireEvent.click(screen.getByRole("dialog"));
    expect(onCancelar).not.toHaveBeenCalled();
    fireEvent.click(container.querySelector(".modal-overlay") as HTMLElement);
    expect(onCancelar).toHaveBeenCalledOnce();
  });

  it("mientras confirma deshabilita ambos botones y usa etiqueta personalizada de cancelar", () => {
    render(
      <ModalConfirmacion
        descripcion="d"
        estaConfirmando
        etiquetaCancelar="Volver"
        etiquetaConfirmar="Ok"
        onCancelar={vi.fn()}
        onConfirmar={vi.fn()}
        titulo="T"
      />,
    );
    expect(screen.getByRole("button", { name: "Procesando…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Volver" })).toBeDisabled();
  });
});

describe("RegistroServiceWorker", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    Reflect.deleteProperty(navigator, "serviceWorker");
  });

  it("no registra nada fuera de producción", () => {
    const register = vi.fn().mockResolvedValue({});
    Object.defineProperty(navigator, "serviceWorker", { value: { register }, configurable: true });
    render(<RegistroServiceWorker />);
    expect(register).not.toHaveBeenCalled();
  });

  it("registra /sw.js en producción y tolera que falle", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const register = vi.fn().mockRejectedValue(new Error("falla"));
    Object.defineProperty(navigator, "serviceWorker", { value: { register }, configurable: true });
    render(<RegistroServiceWorker />);
    await waitFor(() => expect(register).toHaveBeenCalledWith("/sw.js", { scope: "/", updateViaCache: "none" }));
  });
});

describe("useAlertasStock", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    obtenerAlertasStock.mockReset();
  });
  afterEach(() => vi.useRealTimers());

  it("consulta al montar, cada minuto y al avisar un cambio de stock; conserva el valor si falla", async () => {
    obtenerAlertasStock.mockResolvedValue({ bajo: 1, sinStock: 0, total: 1 });
    const { result, unmount } = renderHook(() => useAlertasStock());
    await act(async () => {});
    expect(result.current).toEqual({ bajo: 1, sinStock: 0, total: 1 });
    expect(obtenerAlertasStock).toHaveBeenCalledTimes(1);

    obtenerAlertasStock.mockResolvedValue({ bajo: 2, sinStock: 1, total: 3 });
    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });
    expect(result.current?.total).toBe(3);

    obtenerAlertasStock.mockRejectedValue(new Error("red"));
    await act(async () => {
      avisarStockActualizado();
    });
    expect(obtenerAlertasStock).toHaveBeenCalledTimes(3);
    expect(result.current?.total).toBe(3);

    unmount();
    avisarStockActualizado();
    expect(obtenerAlertasStock).toHaveBeenCalledTimes(3);
  });
});
