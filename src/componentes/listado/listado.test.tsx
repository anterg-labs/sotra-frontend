import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFormularioAccion } from "@/componentes/use-formulario-accion";
import { CargandoPagina } from "./cargando-pagina";
import { EstadoRegistro } from "./estado-registro";
import { InterruptorActivo } from "./interruptor-activo";
import { ProveedorNavegacionListado, useNavegacionListado, ZonaListado } from "./navegacion-listado";
import { PaginacionListado } from "./paginacion-listado";
import { marcarCreado, useUltimoCreado } from "./ultimo-creado";
import { useCambioEstado } from "./use-cambio-estado";
import { construirUrlListado, leerEstado, leerIdFiltro, leerPagina, primerValor } from "./url-listado";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

beforeEach(() => {
  push.mockReset();
});

describe("URL del listado", () => {
  it("lee valores seguros de los searchParams", () => {
    expect(primerValor(["a", "b"])).toBe("a");
    expect(primerValor(undefined)).toBe("");
    expect(leerEstado({ estado: "activo" })).toBe("activo");
    expect(leerEstado({ estado: "x" })).toBe("");
    expect(leerPagina({ pagina: "4" })).toBe(4);
    expect(leerPagina({ pagina: "0" })).toBe(1);
    expect(leerPagina({ pagina: "1.5" })).toBe(1);
    expect(leerIdFiltro({ clienteId: "12" }, "clienteId")).toBe("12");
    expect(leerIdFiltro({ clienteId: "1; DROP" }, "clienteId")).toBe("");
  });

  it("arma la URL sin parámetros vacíos ni página 1 y codifica el texto", () => {
    expect(construirUrlListado("/x", { buscar: "", estado: "", pagina: 1 })).toBe("/x");
    expect(construirUrlListado("/x", { buscar: " a&b ", estado: "activo", pagina: 3 })).toBe("/x?buscar=a%26b&estado=activo&pagina=3");
  });
});

describe("navegación del listado", () => {
  it("falla con un mensaje claro sin proveedor", () => {
    const silencio = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => renderHook(() => useNavegacionListado())).toThrow("Falta el ProveedorNavegacionListado.");
    silencio.mockRestore();
  });

  it("reemplaza el contenido por el esqueleto accesible mientras navega y lo devuelve al terminar", async () => {
    let terminar: () => void = () => undefined;
    push.mockImplementation(() => new Promise<void>((resolver) => { terminar = resolver; }));
    function Prueba() {
      const { navegar } = useNavegacionListado();
      return <button onClick={() => navegar("/x?p=2")} type="button">Ir</button>;
    }
    render(
      <ProveedorNavegacionListado etiquetaCarga="Cargando cosas…">
        <Prueba />
        <ZonaListado><p>Contenido anterior</p></ZonaListado>
      </ProveedorNavegacionListado>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Ir" }));
    const esqueleto = await screen.findByRole("status", { name: "Cargando cosas…" });
    expect(esqueleto).toHaveAttribute("aria-busy", "true");
    expect(push).toHaveBeenCalledWith("/x?p=2");
    expect(screen.queryByText("Contenido anterior")).not.toBeInTheDocument();
    await act(async () => terminar());
    expect(await screen.findByText("Contenido anterior")).toBeInTheDocument();
  });

  it("la pantalla de carga genérica es accesible", () => {
    render(<CargandoPagina />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Cargando contenido…")).toBeVisible();
    expect(screen.getByText("Cargando contenido…")).not.toHaveClass("sr-only");
  });
});

describe("paginación del listado", () => {
  const base = { ruta: "/x", filtros: { buscar: "a", estado: "" }, plural: "cosas", totalElementos: 41, totalPaginas: 3 };
  const conProveedor = (pagina: number) => (
    <ProveedorNavegacionListado etiquetaCarga="Cargando…">
      <PaginacionListado {...base} pagina={pagina} />
    </ProveedorNavegacionListado>
  );

  it("no se muestra con una sola página", () => {
    render(
      <ProveedorNavegacionListado etiquetaCarga="Cargando…">
        <PaginacionListado {...base} pagina={1} totalPaginas={1} />
      </ProveedorNavegacionListado>,
    );
    expect(screen.queryByText(/Página/)).not.toBeInTheDocument();
  });

  it("conserva los filtros, usa el plural y deshabilita los extremos", () => {
    const { rerender } = render(conProveedor(1));
    expect(screen.getByText("Página 1 de 3 (41 cosas)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(push).toHaveBeenLastCalledWith("/x?buscar=a&pagina=2");

    rerender(conProveedor(2));
    fireEvent.click(screen.getByRole("button", { name: "Anterior" }));
    expect(push).toHaveBeenLastCalledWith("/x?buscar=a");

    rerender(conProveedor(3));
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();
  });
});

describe("baja y reactivación desde una tabla", () => {
  function Tabla(props: { accion: Parameters<typeof useCambioEstado>[0]; alExito?: () => void }) {
    const { enProcesoId, error, ejecutar } = useCambioEstado(props.accion, props.alExito);
    return (
      <div>
        <button onClick={() => ejecutar(7, "inactivo")} type="button">Dar de baja</button>
        <output aria-label="en proceso">{String(enProcesoId)}</output>
        <p>{error}</p>
      </div>
    );
  }

  it("marca el registro en proceso de inmediato y avisa al terminar con éxito", async () => {
    let resolver: (r: { exito: true }) => void = () => undefined;
    const accion = vi.fn().mockReturnValue(new Promise((resolve) => { resolver = resolve; }));
    const alExito = vi.fn();
    render(<Tabla accion={accion} alExito={alExito} />);
    fireEvent.click(screen.getByRole("button", { name: "Dar de baja" }));
    await waitFor(() => expect(screen.getByLabelText("en proceso")).toHaveTextContent("7"));
    expect(accion).toHaveBeenCalledWith(7, "inactivo");
    await act(async () => resolver({ exito: true }));
    await waitFor(() => expect(screen.getByLabelText("en proceso")).toHaveTextContent("null"));
    expect(alExito).toHaveBeenCalled();
  });

  it("muestra el mensaje de error y revierte la marca", async () => {
    const accion = vi.fn().mockResolvedValue({ exito: false, mensaje: "No se pudo." });
    render(<Tabla accion={accion} />);
    fireEvent.click(screen.getByRole("button", { name: "Dar de baja" }));
    expect(await screen.findByText("No se pudo.")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText("en proceso")).toHaveTextContent("null"));
  });
});

describe("último registro creado", () => {
  it("se comparte por módulo", () => {
    const { result } = renderHook(() => ({ a: useUltimoCreado("modulo-a"), b: useUltimoCreado("modulo-b") }));
    expect(result.current).toEqual({ a: null, b: null });
    act(() => marcarCreado("modulo-a", 5));
    expect(result.current).toEqual({ a: 5, b: null });
  });
});

describe("piezas de presentación", () => {
  it("muestra el estado y el interruptor «Activo»", () => {
    const alCambiar = vi.fn();
    render(
      <>
        <EstadoRegistro estado="inactivo" />
        <InterruptorActivo alCambiar={alCambiar} estaActivo />
      </>,
    );
    expect(screen.getByText("Inactivo")).toHaveClass("status-inactivo");
    fireEvent.click(screen.getByRole("switch", { name: "Activo" }));
    expect(alCambiar).toHaveBeenCalledWith(false);
  });
});

describe("formulario con acción", () => {
  function Formulario(props: { accion: () => Promise<unknown>; alExito: () => void }) {
    const { errores, errorGeneral, estaEnviando, enviar, referenciaErrorGeneral } = useFormularioAccion({
      validar: (datos: { nombre: string }) => (datos.nombre === "" ? { nombre: "Falta el nombre." } : {}),
      accion: props.accion as never,
      alExito: props.alExito,
      mensajeGeneral: "Falló.",
    });
    return (
      <form onSubmit={(evento) => { evento.preventDefault(); enviar({ nombre: (evento.currentTarget.elements.namedItem("nombre") as HTMLInputElement).value }); }}>
        <input id="nombre" name="nombre" />
        <p>{errores.nombre}</p>
        <p ref={referenciaErrorGeneral} tabIndex={-1}>{errorGeneral}</p>
        <button type="submit">{estaEnviando ? "Enviando…" : "Enviar"}</button>
      </form>
    );
  }

  it("valida antes de llamar a la acción y enfoca el campo", async () => {
    const accion = vi.fn();
    render(<Formulario accion={accion} alExito={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    expect(await screen.findByText("Falta el nombre.")).toBeInTheDocument();
    await waitFor(() => expect(document.getElementById("nombre")).toHaveFocus());
    expect(accion).not.toHaveBeenCalled();
  });

  it("avisa el éxito, y ante una excepción muestra el mensaje general enfocado", async () => {
    const alExito = vi.fn();
    const accion = vi.fn().mockResolvedValueOnce({ exito: true, registro: { id: 1 } }).mockRejectedValueOnce(new Error("ECONNREFUSED"));
    render(<Formulario accion={accion} alExito={alExito} />);
    fireEvent.change(document.getElementById("nombre") as HTMLInputElement, { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    await waitFor(() => expect(alExito).toHaveBeenCalledWith({ id: 1 }));

    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    const mensaje = await screen.findByText("Falló.");
    await waitFor(() => expect(mensaje).toHaveFocus());
    expect(screen.queryByText(/ECONNREFUSED/)).not.toBeInTheDocument();
  });
});
