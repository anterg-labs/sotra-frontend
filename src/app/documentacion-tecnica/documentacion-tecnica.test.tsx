import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FormularioDocumentoTecnico } from "@/componentes/formulario-documento-tecnico";
import { esperarRetardoDeBusqueda } from "@/pruebas/ayudas-filtros";
import { ProveedorNavegacionListado } from "@/componentes/listado/navegacion-listado";
import DetalleDocumento from "./[id]/page";
import { BarraFiltrosDocumentos } from "./barra-filtros-documentos";
import { construirUrlDocumentos, leerFiltrosDocumentos } from "./filtros";
import { ListadoDocumentos } from "./listado-documentos";
import NuevoDocumento from "./nuevo/page";
import { TablaDocumentos } from "./tabla-documentos";

const push = vi.hoisted(() => vi.fn());
const replace = vi.hoisted(() => vi.fn());
const s = vi.hoisted(() => ({
  listarDocumentosTecnicosServidor: vi.fn(),
  obtenerDocumentoTecnicoServidor: vi.fn(),
  listarActivosServidor: vi.fn(),
  listarActivosPaginados: vi.fn(),
  eliminarDocumentoTecnicoAccion: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace }) }));
vi.mock("@/servicios/servicio-activos", () => ({ listarActivosPaginados: s.listarActivosPaginados }));
vi.mock("@/servicios/servidor/activos", () => ({ listarActivosServidor: s.listarActivosServidor, obtenerActivoServidor: vi.fn() }));
vi.mock("@/servicios/servidor/documentos-tecnicos", () => ({
  listarDocumentosTecnicosServidor: s.listarDocumentosTecnicosServidor,
  obtenerDocumentoTecnicoServidor: s.obtenerDocumentoTecnicoServidor,
}));
vi.mock("./acciones", () => ({ eliminarDocumentoTecnicoAccion: s.eliminarDocumentoTecnicoAccion }));

const documento = (id: number, extra: Record<string, unknown> = {}) => ({
  id,
  nombreArchivo: `manual-${id}.pdf`,
  activoId: 2,
  nombreActivo: "Retro 2",
  usaSugerenciasIA: true,
  cantidadFragmentos: 12,
  creadoEn: "2026-03-04T10:00:00Z",
  ...extra,
});
const pagina = (elementos: unknown[], totalPaginas = 1) => ({
  elementos, pagina: 1, tamanoPagina: 20, totalElementos: elementos.length, totalPaginas,
});
const activo = { id: 2, clienteId: 1, numSerie: "SN-2", nombre: "Retro 2", estado: "activo" };
const pdf = () => new File(["%PDF-1.7 contenido"], "manual.pdf", { type: "application/pdf" });
const filtrosVacios = { buscar: "", activoId: "", pagina: 1 };
const conNavegacion = (ui: React.ReactNode) => <ProveedorNavegacionListado etiquetaCarga="Cargando…">{ui}</ProveedorNavegacionListado>;

beforeEach(() => {
  Object.values(s).forEach((f) => f.mockReset());
  push.mockReset();
  replace.mockReset();
  vi.stubEnv("API_URL", "http://api.test");
  s.listarActivosServidor.mockResolvedValue(pagina([activo]));
  s.listarDocumentosTecnicosServidor.mockResolvedValue(
    pagina([documento(1), documento(2, { activoId: null, nombreActivo: null, usaSugerenciasIA: false })]),
  );
});

describe("filtros de la URL de documentos", () => {
  it("lee los filtros con valores seguros y arma la URL", () => {
    expect(leerFiltrosDocumentos({})).toEqual(filtrosVacios);
    expect(leerFiltrosDocumentos({ buscar: "man", activoId: "2", pagina: "3" })).toEqual({ buscar: "man", activoId: "2", pagina: 3 });
    expect(leerFiltrosDocumentos({ activoId: "x" })).toEqual(filtrosVacios);
    expect(construirUrlDocumentos({ buscar: "man", activoId: "2", pagina: 1 })).toBe("/documentacion-tecnica?buscar=man&activoId=2");
  });
});

describe("listado de documentación técnica (Server Component)", () => {
  it("muestra filas con activo asociado, uso de IA y enlace público de descarga", async () => {
    render(conNavegacion(await ListadoDocumentos({ filtros: { ...filtrosVacios, buscar: "man" } })));
    expect(s.listarDocumentosTecnicosServidor).toHaveBeenCalledWith({ ...filtrosVacios, buscar: "man" });
    const filas = screen.getAllByRole("row");
    expect(within(filas[1]).getByText("manual-1.pdf")).toBeInTheDocument();
    expect(within(filas[1]).getByText("Retro 2")).toBeInTheDocument();
    expect(within(filas[1]).getByText("Sí")).toBeInTheDocument();
    expect(within(filas[1]).getByRole("link", { name: "Descargar PDF" })).toHaveAttribute("href", "/api/v1/documentos-tecnicos/1/archivo");
    expect(within(filas[2]).getByText("Sin activo")).toBeInTheDocument();
    expect(within(filas[2]).getByText("No")).toBeInTheDocument();
  });

  it("muestra el error y el vacío, y pagina conservando los filtros", async () => {
    s.listarDocumentosTecnicosServidor.mockRejectedValueOnce(new Error("x"));
    const { unmount } = render(await ListadoDocumentos({ filtros: filtrosVacios }));
    expect(screen.getByText("No se pudo obtener el listado de documentos técnicos.")).toBeInTheDocument();
    unmount();

    s.listarDocumentosTecnicosServidor.mockResolvedValueOnce(pagina([]));
    const { unmount: segundo } = render(await ListadoDocumentos({ filtros: filtrosVacios }));
    expect(screen.getByText("No se encontraron documentos técnicos con los filtros aplicados.")).toBeInTheDocument();
    segundo();

    s.listarDocumentosTecnicosServidor.mockResolvedValueOnce(pagina([documento(1)], 2));
    render(conNavegacion(await ListadoDocumentos({ filtros: { buscar: "man", activoId: "2", pagina: 1 } })));
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(push).toHaveBeenLastCalledWith("/documentacion-tecnica?buscar=man&activoId=2&pagina=2");
  });
});

describe("barra de filtros de documentos (en vivo)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("el texto busca una sola vez tras el retardo", async () => {
    vi.useFakeTimers();
    render(conNavegacion(<BarraFiltrosDocumentos activos={[]} filtros={{ ...filtrosVacios, pagina: 2 }} />));
    const buscar = screen.getByLabelText("Buscar");
    fireEvent.change(buscar, { target: { value: "m" } });
    fireEvent.change(buscar, { target: { value: "manual" } });
    expect(replace).not.toHaveBeenCalled();
    await esperarRetardoDeBusqueda();
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/documentacion-tecnica?buscar=manual");
  });

  it("filtra por texto y activo (combobox) sin botón y limpia", async () => {
    render(conNavegacion(<BarraFiltrosDocumentos activos={[activo as never, { ...activo, id: 3, nombre: null, numSerie: "SN-3" } as never]} filtros={filtrosVacios} />));
    fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "manual" } });
    fireEvent.focus(screen.getByRole("combobox", { name: "Activo asociado" }));
    expect(screen.getByRole("option", { name: "SN-3" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: "Retro 2" }));
    expect(replace).toHaveBeenLastCalledWith("/documentacion-tecnica?buscar=manual&activoId=2");
    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(replace).toHaveBeenLastCalledWith("/documentacion-tecnica");
  });
});

describe("tabla de documentos (eliminación)", () => {
  it("pide confirmar advirtiendo sobre los embeddings y elimina al confirmar", async () => {
    s.eliminarDocumentoTecnicoAccion.mockResolvedValue({ exito: true });
    render(<TablaDocumentos documentos={[documento(1) as never]} />);
    fireEvent.click(screen.getByRole("button", { name: "Eliminar documento" }));
    const dialogo = screen.getByRole("dialog", { name: "Eliminar documento técnico" });
    expect(dialogo).toHaveTextContent("manual-1.pdf");
    expect(dialogo).toHaveTextContent("embeddings");
    expect(s.eliminarDocumentoTecnicoAccion).not.toHaveBeenCalled();
    fireEvent.click(within(dialogo).getByRole("button", { name: "Eliminar" }));
    await waitFor(() => expect(s.eliminarDocumentoTecnicoAccion).toHaveBeenCalledWith(1));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("cancelar no elimina y un fallo muestra el error", async () => {
    s.eliminarDocumentoTecnicoAccion.mockResolvedValue({ exito: false, mensaje: "No se pudo eliminar el documento seleccionado." });
    render(<TablaDocumentos documentos={[documento(1) as never]} />);
    fireEvent.click(screen.getByRole("button", { name: "Eliminar documento" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(s.eliminarDocumentoTecnicoAccion).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Eliminar documento" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Eliminar" }));
    expect(await screen.findByText("No se pudo eliminar el documento seleccionado.")).toBeInTheDocument();
  });
});

describe("detalle de documento técnico (Server Component)", () => {
  const parametros = (id: string) => ({ params: Promise.resolve({ id }) });

  it("muestra archivo, activo enlazado, uso de IA con fragmentos y descarga", async () => {
    s.obtenerDocumentoTecnicoServidor.mockResolvedValue(documento(4));
    render(await DetalleDocumento(parametros("4")));
    expect(screen.getByRole("heading", { level: 1, name: "manual-4.pdf" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Retro 2" })).toHaveAttribute("href", "/activos/2");
    expect(screen.getByText("Se usa para sugerencias de IA (12 fragmentos procesados)")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Descargar PDF" })).toHaveAttribute("href", "/api/v1/documentos-tecnicos/4/archivo");
  });

  it("muestra los casos sin activo, sin IA o con nombre faltante, y el error de carga", async () => {
    s.obtenerDocumentoTecnicoServidor.mockResolvedValue(documento(5, { activoId: null, nombreActivo: null, usaSugerenciasIA: false }));
    const { unmount } = render(await DetalleDocumento(parametros("5")));
    expect(screen.getByText("Sin activo")).toBeInTheDocument();
    expect(screen.getByText("No se usa para sugerencias de IA")).toBeInTheDocument();
    unmount();

    s.obtenerDocumentoTecnicoServidor.mockResolvedValue(documento(6, { nombreActivo: null }));
    const { unmount: segundo } = render(await DetalleDocumento(parametros("6")));
    expect(screen.getByRole("link", { name: "Activo 2" })).toBeInTheDocument();
    segundo();

    s.obtenerDocumentoTecnicoServidor.mockRejectedValue(new Error("x"));
    render(await DetalleDocumento(parametros("6")));
    expect(screen.getByText("No se pudo obtener la información del documento solicitado.")).toBeInTheDocument();
  });
});

describe("alta de documento técnico (página)", () => {
  it("carga los activos activos en el servidor y muestra el formulario", async () => {
    render(await NuevoDocumento());
    expect(s.listarActivosServidor).toHaveBeenCalledWith(expect.objectContaining({ estado: "activo" }));
    expect(screen.getByLabelText("Archivo PDF")).toBeInTheDocument();
  });

  it("informa si no se pueden cargar los activos", async () => {
    s.listarActivosServidor.mockRejectedValue(new Error("x"));
    render(await NuevoDocumento());
    expect(screen.getByText("No se pudo obtener el listado de activos.")).toBeInTheDocument();
  });
});

describe("FormularioDocumentoTecnico", () => {
  function elegirArchivo(archivo: File | null) {
    const entrada = screen.getByLabelText("Archivo PDF") as HTMLInputElement;
    fireEvent.change(entrada, { target: { files: archivo ? [archivo] : [] } });
  }

  it("rechaza archivos que no son PDF reales, con el error enlazado al campo", async () => {
    const alEnviar = vi.fn();
    render(<FormularioDocumentoTecnico activos={[]} alEnviar={alEnviar} />);
    elegirArchivo(new File(["texto plano"], "falso.pdf"));
    fireEvent.click(screen.getByRole("button", { name: "Guardar documento" }));
    const error = await screen.findByText("El archivo no es un PDF válido.");
    expect(error).toHaveAttribute("id", "archivo-error");
    expect(screen.getByLabelText("Archivo PDF")).toHaveAttribute("aria-describedby", "archivo-error");
    expect(alEnviar).not.toHaveBeenCalled();

    elegirArchivo(new File(["%PDF-1"], "manual.docx"));
    fireEvent.click(screen.getByRole("button", { name: "Guardar documento" }));
    expect(await screen.findByText("El archivo debe tener la extensión .pdf.")).toBeInTheDocument();
  });

  it("envía el PDF con el activo elegido y la bandera de IA, y vuelve al listado", async () => {
    const alEnviar = vi.fn().mockResolvedValue({ id: 1 });
    render(<FormularioDocumentoTecnico activos={[activo] as never} alEnviar={alEnviar} />);
    const archivo = pdf();
    elegirArchivo(archivo);
    const combo = screen.getByRole("combobox", { name: "Activo asociado (opcional)" });
    fireEvent.focus(combo);
    fireEvent.click(screen.getByRole("option", { name: "Retro 2 (cliente 1)" }));
    fireEvent.click(screen.getByRole("switch", { name: /sugerencias de IA/ }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar documento" }));
    await waitFor(() => expect(alEnviar).toHaveBeenCalledWith({ archivo, activoId: 2, usaSugerenciasIA: true }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/documentacion-tecnica"));
  });

  it("sin activo envía null; muestra el aviso de procesamiento largo y el error del servidor", async () => {
    let rechazar: (e: Error) => void = () => undefined;
    const alEnviar = vi.fn().mockImplementation(() => new Promise((_, rej) => (rechazar = rej)));
    render(<FormularioDocumentoTecnico activos={[]} alEnviar={alEnviar} />);
    elegirArchivo(pdf());
    fireEvent.click(screen.getByRole("switch", { name: /sugerencias de IA/ }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar documento" }));
    expect(await screen.findByText(/Puede tardar varios minutos/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardando…" })).toBeDisabled();
    expect(alEnviar).toHaveBeenCalledWith(expect.objectContaining({ activoId: null }));

    rechazar(new Error("No se pudo procesar el PDF."));
    const alerta = await screen.findByRole("alert");
    expect(alerta).toHaveTextContent("No se pudo procesar el PDF.");
    await waitFor(() => expect(alerta).toHaveFocus());
    expect(screen.getByRole("button", { name: "Guardar documento" })).toBeEnabled();
  });

  it("usa un mensaje genérico cuando el error no es una instancia de Error", async () => {
    const alEnviar = vi.fn().mockRejectedValue("fallo");
    render(<FormularioDocumentoTecnico activos={[]} alEnviar={alEnviar} />);
    elegirArchivo(pdf());
    fireEvent.click(screen.getByRole("button", { name: "Guardar documento" }));
    expect(await screen.findByText("No se pudo guardar el documento técnico.")).toBeInTheDocument();
  });

  it("al quitar el archivo vuelve a exigirlo", async () => {
    render(<FormularioDocumentoTecnico activos={[]} alEnviar={vi.fn()} />);
    elegirArchivo(pdf());
    elegirArchivo(null);
    fireEvent.click(screen.getByRole("button", { name: "Guardar documento" }));
    expect(await screen.findByText("Seleccioná un archivo PDF.")).toBeInTheDocument();
  });
});
