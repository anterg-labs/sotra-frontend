import { resolverServidor } from "@/pruebas/resolver-servidor";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FormularioDocumentoTecnico } from "@/componentes/formulario-documento-tecnico";
import { esperarRetardoDeBusqueda } from "@/pruebas/ayudas-filtros";
import { ProveedorNavegacionListado } from "@/componentes/listado/navegacion-listado";
import DetalleDocumento from "./[id]/page";
import { BarraFiltrosDocumentos } from "./barra-filtros-documentos";
import { construirUrlDocumentos, leerFiltrosDocumentos } from "./filtros";
import { ListadoDocumentos } from "./listado-documentos";
import { ContenidoEditarDocumento as EditarDocumento } from "./[id]/editar/contenido-editar-documento";
import { FormularioEditarDocumento } from "@/componentes/formulario-editar-documento";
import NuevoDocumento from "./nuevo/page";
import { TablaDocumentos } from "./tabla-documentos";
import { ProveedorDeAvisos } from "@/componentes/avisos";

const push = vi.hoisted(() => vi.fn());
const replace = vi.hoisted(() => vi.fn());
const s = vi.hoisted(() => ({
  listarDocumentosTecnicosServidor: vi.fn(),
  obtenerDocumentoTecnicoServidor: vi.fn(),
  listarActivosServidor: vi.fn(),
  listarActivosPaginados: vi.fn(),
  eliminarDocumentoTecnicoAccion: vi.fn(),
  cambiarVigenciaDocumentoAccion: vi.fn(),
  actualizarDocumentoAccion: vi.fn(),
  reprocesarDocumentoAccion: vi.fn(),
}));

const refresh = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace, refresh }), usePathname: () => "/documentacion-tecnica/nuevo", useSelectedLayoutSegment: () => null }));
vi.mock("@/servicios/servicio-activos", () => ({ listarActivosPaginados: s.listarActivosPaginados }));
vi.mock("@/servicios/servidor/activos", () => ({ listarActivosServidor: s.listarActivosServidor, obtenerActivoServidor: vi.fn() }));
vi.mock("@/servicios/servidor/documentos-tecnicos", () => ({
  listarDocumentosTecnicosServidor: s.listarDocumentosTecnicosServidor,
  obtenerDocumentoTecnicoServidor: s.obtenerDocumentoTecnicoServidor,
}));
vi.mock("./acciones", () => ({
  eliminarDocumentoTecnicoAccion: s.eliminarDocumentoTecnicoAccion,
  cambiarVigenciaDocumentoAccion: s.cambiarVigenciaDocumentoAccion,
  actualizarDocumentoAccion: s.actualizarDocumentoAccion,
  reprocesarDocumentoAccion: s.reprocesarDocumentoAccion,
}));

const documento = (id: number, extra: Record<string, unknown> = {}) => ({
  id,
  nombreArchivo: `manual-${id}.pdf`,
  titulo: `Manual ${id}`,
  tipo: "manual_tecnico",
  descripcion: null,
  vigente: true,
  modeloMaquinaId: null,
  nombreModelo: null,
  activoId: 2,
  nombreActivo: "Retro 2",
  usaSugerenciasIA: true,
  cantidadFragmentos: 12,
  creadoEn: "2026-03-04T10:00:00Z",
  estadoProcesamiento: "listo",
  codigoErrorProcesamiento: null,
  mensajeErrorProcesamiento: null,
  ...extra,
});
const pagina = (elementos: unknown[], totalPaginas = 1) => ({
  elementos, pagina: 1, tamanoPagina: 20, totalElementos: elementos.length, totalPaginas,
});
const activo = { id: 2, clienteId: 1, numSerie: "SN-2", nombre: "Retro 2", estado: "activo" };
const pdf = () => new File(["%PDF-1.7 contenido"], "manual.pdf", { type: "application/pdf" });
const filtrosVacios = { buscar: "", activoId: "", modeloMaquinaId: "", tipo: "", vigente: "", pagina: 1 };
const conNavegacion = (ui: React.ReactNode) => <ProveedorNavegacionListado etiquetaCarga="Cargando…">{ui}</ProveedorNavegacionListado>;

beforeEach(() => {
  Object.values(s).forEach((f) => f.mockReset());
  push.mockReset();
  replace.mockReset();
  refresh.mockReset();
  vi.stubEnv("API_URL", "http://api.test");
  s.listarActivosServidor.mockResolvedValue(pagina([activo]));
  s.listarDocumentosTecnicosServidor.mockResolvedValue(
    pagina([documento(1), documento(2, { activoId: null, nombreActivo: null, usaSugerenciasIA: false })]),
  );
});

describe("filtros de la URL de documentos", () => {
  it("lee los filtros con valores seguros y arma la URL", () => {
    expect(leerFiltrosDocumentos({})).toEqual(filtrosVacios);
    expect(leerFiltrosDocumentos({ buscar: "man", activoId: "2", pagina: "3" })).toEqual({ ...filtrosVacios, buscar: "man", activoId: "2", pagina: 3 });
    expect(leerFiltrosDocumentos({ tipo: "normativa", vigente: "false" })).toEqual({ ...filtrosVacios, tipo: "normativa", vigente: "false" });
    expect(leerFiltrosDocumentos({ tipo: "contrato", vigente: "quizás" })).toEqual(filtrosVacios);
    expect(leerFiltrosDocumentos({ modeloMaquinaId: "4" })).toEqual({ ...filtrosVacios, modeloMaquinaId: "4" });
    expect(leerFiltrosDocumentos({ activoId: "x" })).toEqual(filtrosVacios);
    expect(construirUrlDocumentos({ ...filtrosVacios, buscar: "man", activoId: "2" })).toBe("/documentacion-tecnica?buscar=man&activoId=2");
  });
});

describe("listado de documentación técnica (Server Component)", () => {
  it("muestra filas con activo asociado, uso de IA y enlace público de descarga", async () => {
    render(conNavegacion(await ListadoDocumentos({ filtros: { ...filtrosVacios, buscar: "man" } })));
    expect(s.listarDocumentosTecnicosServidor).toHaveBeenCalledWith({ ...filtrosVacios, buscar: "man" });
    const filas = screen.getAllByRole("row");
    expect(within(filas[1]).getByText("Manual 1")).toBeInTheDocument();
    expect(within(filas[1]).getByText("manual-1.pdf")).toBeInTheDocument();
    expect(within(filas[1]).getByText("Manual técnico")).toBeInTheDocument();
    expect(within(filas[1]).getByText("Vigente")).toBeInTheDocument();
    expect(within(filas[1]).getByText("Retro 2")).toBeInTheDocument();
    expect(within(filas[1]).getByText("Sí")).toBeInTheDocument();
    expect(within(filas[1]).getByRole("link", { name: "Descargar PDF" })).toHaveAttribute("href", "/api/v1/documentos-tecnicos/1/archivo");
    expect(within(filas[2]).getByText("General")).toBeInTheDocument();
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
    render(conNavegacion(await ListadoDocumentos({ filtros: { ...filtrosVacios, buscar: "man", activoId: "2" } })));
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
    render(conNavegacion(<BarraFiltrosDocumentos activos={[]} filtros={{ ...filtrosVacios, pagina: 2 }} modelosMaquina={[]} />));
    const buscar = screen.getByLabelText("Buscar");
    fireEvent.change(buscar, { target: { value: "m" } });
    fireEvent.change(buscar, { target: { value: "manual" } });
    expect(replace).not.toHaveBeenCalled();
    await esperarRetardoDeBusqueda();
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/documentacion-tecnica?buscar=manual");
  });

  it("filtra por texto y activo (combobox) sin botón y limpia", async () => {
    render(conNavegacion(<BarraFiltrosDocumentos activos={[activo as never, { ...activo, id: 3, nombre: null, numSerie: "SN-3" } as never]} filtros={filtrosVacios} modelosMaquina={[]} />));
    fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "manual" } });
    fireEvent.click(screen.getByRole("button", { name: "Filtros avanzados" }));
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
    render(<ProveedorNavegacionListado etiquetaCarga="Cargando"><TablaDocumentos documentos={[documento(1) as never]} filtros={{ buscar: "", activoId: "", modeloMaquinaId: "", tipo: "", vigente: "", pagina: 1 }} /></ProveedorNavegacionListado>);
    fireEvent.click(screen.getByRole("button", { name: "Eliminar documento" }));
    const dialogo = screen.getByRole("dialog", { name: "Eliminar documento" });
    expect(dialogo).toHaveTextContent("Manual 1");
    expect(dialogo).toHaveTextContent("embeddings");
    expect(s.eliminarDocumentoTecnicoAccion).not.toHaveBeenCalled();
    fireEvent.click(within(dialogo).getByRole("button", { name: "Eliminar" }));
    await waitFor(() => expect(s.eliminarDocumentoTecnicoAccion).toHaveBeenCalledWith(1));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("cancelar no elimina y un fallo muestra el error", async () => {
    s.eliminarDocumentoTecnicoAccion.mockResolvedValue({ exito: false, mensaje: "No se pudo eliminar el documento seleccionado." });
    render(<ProveedorDeAvisos><ProveedorNavegacionListado etiquetaCarga="Cargando"><TablaDocumentos documentos={[documento(1) as never]} filtros={{ buscar: "", activoId: "", modeloMaquinaId: "", tipo: "", vigente: "", pagina: 1 }} /></ProveedorNavegacionListado></ProveedorDeAvisos>);
    fireEvent.click(screen.getByRole("button", { name: "Eliminar documento" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(s.eliminarDocumentoTecnicoAccion).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Eliminar documento" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Eliminar" }));
    expect(await screen.findByText("No se pudo eliminar el documento seleccionado.")).toBeInTheDocument();
  });
});

describe("estado del procesamiento de los documentos", () => {
  const parametros = (id: string) => ({ params: Promise.resolve({ id }) });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("el listado muestra los documentos en cola, procesándose o con error, y se actualiza mientras procesa", async () => {
    vi.useFakeTimers();
    s.listarDocumentosTecnicosServidor.mockResolvedValue(pagina([
      documento(1, { estadoProcesamiento: "pendiente", cantidadFragmentos: 0 }),
      documento(2, { estadoProcesamiento: "procesando", cantidadFragmentos: 0 }),
      documento(3, { estadoProcesamiento: "error", codigoErrorProcesamiento: "PDF_SIN_TEXTO", mensajeErrorProcesamiento: "El PDF no tiene texto." }),
    ]));
    render(conNavegacion(await ListadoDocumentos({ filtros: filtrosVacios })));
    const filas = screen.getAllByRole("row");
    expect(within(filas[1]).getByText("En cola")).toBeInTheDocument();
    expect(within(filas[2]).getByText("Procesando…")).toBeInTheDocument();
    expect(within(filas[3]).getByText("Error al procesar")).toBeInTheDocument();

    refresh.mockClear();
    vi.advanceTimersByTime(5000);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("el listado no se vuelve a pedir cuando ningún documento se está procesando", async () => {
    vi.useFakeTimers();
    s.listarDocumentosTecnicosServidor.mockResolvedValue(pagina([documento(1)]));
    render(conNavegacion(await ListadoDocumentos({ filtros: filtrosVacios })));
    refresh.mockClear();
    vi.advanceTimersByTime(15000);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("el detalle explica que se está preparando y muestra el error con la opción de volver a procesar", async () => {
    s.obtenerDocumentoTecnicoServidor.mockResolvedValue(documento(7, { estadoProcesamiento: "procesando", cantidadFragmentos: 0 }));
    const { unmount } = render(await DetalleDocumento(parametros("7")));
    expect(screen.getByText("Procesando…")).toBeInTheDocument();
    expect(screen.getByText(/Puede tardar varios minutos/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Volver a procesar" })).not.toBeInTheDocument();
    unmount();

    s.obtenerDocumentoTecnicoServidor.mockResolvedValue(documento(8, {
      estadoProcesamiento: "error",
      codigoErrorProcesamiento: "PDF_SIN_TEXTO",
      mensajeErrorProcesamiento: "El PDF no tiene texto que se pueda leer.",
      cantidadFragmentos: 0,
    }));
    s.reprocesarDocumentoAccion.mockResolvedValueOnce({ exito: false, mensaje: "No se pudo volver a procesar el documento." });
    s.reprocesarDocumentoAccion.mockResolvedValueOnce({ exito: true });
    render(await DetalleDocumento(parametros("8")));
    expect(screen.getByText("Error al procesar")).toBeInTheDocument();
    expect(screen.getByText("El PDF no tiene texto que se pueda leer.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Volver a procesar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo volver a procesar el documento.");
    refresh.mockClear();
    fireEvent.click(await screen.findByRole("button", { name: "Volver a procesar" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(s.reprocesarDocumentoAccion).toHaveBeenCalledWith(8);
  });
});

describe("detalle de documento técnico (Server Component)", () => {
  const parametros = (id: string) => ({ params: Promise.resolve({ id }) });

  it("muestra archivo, activo enlazado, uso de IA con fragmentos y descarga", async () => {
    s.obtenerDocumentoTecnicoServidor.mockResolvedValue(documento(4));
    render(await DetalleDocumento(parametros("4")));
    expect(screen.getByRole("heading", { level: 1, name: "Manual 4" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Retro 2" })).toHaveAttribute("href", "/activos/2");
    expect(screen.getByText("Se usa para sugerencias de IA (12 fragmentos procesados)")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Descargar PDF" })).toHaveAttribute("href", "/api/v1/documentos-tecnicos/4/archivo");
  });

  it("muestra los casos sin activo, sin IA o con nombre faltante, y el error de carga", async () => {
    s.obtenerDocumentoTecnicoServidor.mockResolvedValue(documento(5, { activoId: null, nombreActivo: null, usaSugerenciasIA: false }));
    const { unmount } = render(await DetalleDocumento(parametros("5")));
    expect(screen.getByText("Sin activo")).toBeInTheDocument();
    expect(screen.getByText("Sin modelo")).toBeInTheDocument();
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
    render(await resolverServidor(await NuevoDocumento()));
    expect(s.listarActivosServidor).toHaveBeenCalledWith(expect.objectContaining({ estado: "activo" }));
    expect(screen.getByLabelText("Archivo PDF")).toBeInTheDocument();
  });

  it("informa si no se pueden cargar los activos", async () => {
    s.listarActivosServidor.mockRejectedValue(new Error("x"));
    render(await resolverServidor(await NuevoDocumento()));
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
    await waitFor(() => expect(alEnviar).toHaveBeenCalledWith({ archivo, titulo: "", tipo: "manual_tecnico", descripcion: "", activoId: 2, modeloMaquinaId: null, usaSugerenciasIA: true }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/documentacion-tecnica"));
  });

  it("sin activo envía null; avisa que el procesamiento sigue en segundo plano y muestra el error del servidor", async () => {
    let rechazar: (e: Error) => void = () => undefined;
    const alEnviar = vi.fn().mockImplementation(() => new Promise((_, rej) => (rechazar = rej)));
    render(<FormularioDocumentoTecnico activos={[]} alEnviar={alEnviar} />);
    elegirArchivo(pdf());
    fireEvent.click(screen.getByRole("switch", { name: /sugerencias de IA/ }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar documento" }));
    expect(await screen.findByText(/en segundo plano/)).toBeInTheDocument();
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

describe("datos generales y vigencia de la documentación", () => {
  const parametros = (id: string) => ({ params: Promise.resolve({ id }) });

  it("muestra en el listado un documento obsoleto con su tipo y el modelo asociado", async () => {
    s.listarDocumentosTecnicosServidor.mockResolvedValue(
      pagina([documento(7, { tipo: "normativa", vigente: false, nombreModelo: "SY215C" })]),
    );
    render(conNavegacion(await ListadoDocumentos({ filtros: filtrosVacios })));
    const fila = screen.getAllByRole("row")[1];
    expect(within(fila).getByText("Normativa")).toBeInTheDocument();
    expect(within(fila).getByText("Obsoleto")).toBeInTheDocument();
    expect(within(fila).getByText("Retro 2 · SY215C")).toBeInTheDocument();
  });

  it("el detalle muestra tipo, vigencia, descripción y modelo", async () => {
    s.obtenerDocumentoTecnicoServidor.mockResolvedValue(
      documento(8, { tipo: "politica_seguridad", descripcion: "Uso de EPP", nombreModelo: "SY215C", modeloMaquinaId: 4 }),
    );
    render(await DetalleDocumento(parametros("8")));
    expect(screen.getByText("Política de seguridad")).toBeInTheDocument();
    expect(screen.getByText("Vigente")).toBeInTheDocument();
    expect(screen.getByText("Uso de EPP")).toBeInTheDocument();
    expect(screen.getByText("SY215C")).toBeInTheDocument();
  });

  it("marca un documento vigente como obsoleto desde el detalle y refresca la pantalla", async () => {
    s.obtenerDocumentoTecnicoServidor.mockResolvedValue(documento(9));
    s.cambiarVigenciaDocumentoAccion.mockResolvedValue({ exito: true });
    render(await DetalleDocumento(parametros("9")));
    fireEvent.click(screen.getByRole("button", { name: "Marcar como obsoleto" }));
    await waitFor(() => expect(s.cambiarVigenciaDocumentoAccion).toHaveBeenCalledWith(9, false));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("ofrece volver a marcar como vigente un documento obsoleto y muestra el error si falla", async () => {
    s.obtenerDocumentoTecnicoServidor.mockResolvedValue(documento(10, { vigente: false }));
    s.cambiarVigenciaDocumentoAccion.mockResolvedValue({ exito: false, mensaje: "No se pudo cambiar la vigencia del documento." });
    render(await DetalleDocumento(parametros("10")));
    fireEvent.click(screen.getByRole("button", { name: "Marcar como vigente" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo cambiar la vigencia del documento.");
    expect(refresh).not.toHaveBeenCalled();
  });

  it("los filtros de tipo y vigencia actualizan la URL", async () => {
    render(conNavegacion(<BarraFiltrosDocumentos activos={[]} filtros={filtrosVacios} modelosMaquina={[]} />));
    fireEvent.click(screen.getByRole("button", { name: "Filtros avanzados" }));
    fireEvent.change(screen.getByLabelText("Tipo"), { target: { value: "normativa" } });
    await waitFor(() => expect(push.mock.calls.concat(replace.mock.calls).flat().join(" ")).toContain("tipo=normativa"));
    fireEvent.change(screen.getByLabelText("Vigencia"), { target: { value: "false" } });
    await waitFor(() => expect(push.mock.calls.concat(replace.mock.calls).flat().join(" ")).toContain("vigente=false"));
  });

  it("el formulario envía título, tipo y descripción, y rechaza un título demasiado largo", async () => {
    const alEnviar = vi.fn().mockResolvedValue({ id: 1 });
    render(<FormularioDocumentoTecnico activos={[]} alEnviar={alEnviar} />);
    fireEvent.change(screen.getByLabelText("Archivo PDF"), { target: { files: [pdf()] } });
    fireEvent.change(screen.getByLabelText("Título (opcional)"), { target: { value: "x".repeat(201) } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar documento" }));
    const error = await screen.findByText("El título no puede superar 200 caracteres.");
    expect(error).toHaveAttribute("id", "titulo-error");
    expect(alEnviar).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Título (opcional)"), { target: { value: "Norma de EPP" } });
    fireEvent.change(screen.getByLabelText("Tipo de documento"), { target: { value: "normativa" } });
    fireEvent.change(screen.getByLabelText("Descripción (opcional)"), { target: { value: "Uso obligatorio" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar documento" }));
    await waitFor(() => expect(alEnviar).toHaveBeenCalledWith(expect.objectContaining({
      titulo: "Norma de EPP", tipo: "normativa", descripcion: "Uso obligatorio", modeloMaquinaId: null,
    })));
  });
});

describe("edición de un documento", () => {
  const parametros = (id: string) => ({ params: Promise.resolve({ id }) });
  const documentoCompleto = (extra: Record<string, unknown> = {}) =>
    documento(11, { titulo: "Norma de EPP", tipo: "normativa", descripcion: "Uso obligatorio", activoId: 2, modeloMaquinaId: 4, nombreModelo: "SY215C", ...extra }) as never;

  it("la página carga los datos del documento en el formulario", async () => {
    s.obtenerDocumentoTecnicoServidor.mockResolvedValue(documentoCompleto());
    render(await resolverServidor(await EditarDocumento(parametros("11"))));
    expect(screen.getByLabelText("Título")).toHaveValue("Norma de EPP");
    expect(screen.getByLabelText("Tipo de documento")).toHaveValue("normativa");
    expect(screen.getByLabelText("Descripción")).toHaveValue("Uso obligatorio");
  });

  it("la página informa si no se puede obtener el documento", async () => {
    s.obtenerDocumentoTecnicoServidor.mockRejectedValue(new Error("x"));
    render(await resolverServidor(await EditarDocumento(parametros("11"))));
    expect(screen.getByText("No se pudo obtener la información del documento solicitado.")).toBeInTheDocument();
  });

  it("guarda los cambios y vuelve al detalle", async () => {
    const accion = vi.fn().mockResolvedValue({ exito: true, registro: documento(11) });
    render(<FormularioEditarDocumento accion={accion} documento={documentoCompleto()} />);
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Norma de EPP 2026" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar modificación" }));
    await waitFor(() => expect(accion).toHaveBeenCalledWith({
      titulo: "Norma de EPP 2026", tipo: "normativa", descripcion: "Uso obligatorio", activoId: 2, modeloMaquinaId: 4,
    }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/documentacion-tecnica/11"));
  });

  it("muestra el error del servidor junto al campo y no navega", async () => {
    const accion = vi.fn().mockResolvedValue({ exito: false, errores: { titulo: "El título no puede superar 200 caracteres." }, mensaje: "" });
    render(<FormularioEditarDocumento accion={accion} documento={documentoCompleto()} />);
    fireEvent.click(screen.getByRole("button", { name: "Confirmar modificación" }));
    expect(await screen.findByText("El título no puede superar 200 caracteres.")).toHaveAttribute("id", "titulo-error");
    expect(push).not.toHaveBeenCalled();
  });

  it("valida el largo localmente sin llamar a la acción", async () => {
    const accion = vi.fn();
    render(<FormularioEditarDocumento accion={accion} documento={documentoCompleto()} />);
    fireEvent.change(screen.getByLabelText("Descripción"), { target: { value: "x".repeat(1001) } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar modificación" }));
    expect(await screen.findByText("La descripción no puede superar 1000 caracteres.")).toBeInTheDocument();
    expect(accion).not.toHaveBeenCalled();
  });

  it("el detalle ofrece el botón Modificar", async () => {
    s.obtenerDocumentoTecnicoServidor.mockResolvedValue(documento(12));
    render(await DetalleDocumento(parametros("12")));
    expect(screen.getByRole("link", { name: "Modificar" })).toHaveAttribute("href", "/documentacion-tecnica/12/editar");
  });
});
