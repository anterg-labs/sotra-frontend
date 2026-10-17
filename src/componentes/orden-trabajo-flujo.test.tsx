import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrdenTrabajo } from "@/tipos/orden-trabajo";
import { FormularioOrdenTrabajo } from "./formulario-orden-trabajo";
import { SugerenciasOrdenTrabajo } from "./sugerencias-orden-trabajo";
import { SelectorClienteActivoOrdenTrabajo } from "./selector-cliente-activo-orden-trabajo";
import { SelectorRepuestosOrdenTrabajo } from "./selector-repuestos-orden-trabajo";
import { CamposGeneralesOrdenTrabajo } from "./campos-generales-orden-trabajo";
import { EstructuraTecnico } from "./estructura-tecnico";

const push = vi.hoisted(() => vi.fn());
const pathname = vi.hoisted(() => ({ valor: "/tecnico" }));
const s = vi.hoisted(() => ({
  solicitarSugerenciaOrdenTrabajo: vi.fn(),
  listarTecnicosPaginados: vi.fn(),
  listarClientesPaginados: vi.fn(),
  listarActivosPaginados: vi.fn(),
  listarRepuestosPaginados: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), usePathname: () => pathname.valor }));
vi.mock("@/componentes/avisos", () => ({ useAvisos: () => ({ mostrarAviso: vi.fn() }) }));
vi.mock("@/servicios/servicio-ordenes-trabajo", async (importarOriginal) => ({
  ...(await importarOriginal<typeof import("@/servicios/servicio-ordenes-trabajo")>()),
  solicitarSugerenciaOrdenTrabajo: s.solicitarSugerenciaOrdenTrabajo,
  listarTecnicosPaginados: s.listarTecnicosPaginados,
  crearSesionDeSugerencias: () => "sesion-fija",
}));
vi.mock("@/servicios/servicio-clientes", () => ({
  listarClientesPaginados: s.listarClientesPaginados,
  crearCliente: vi.fn(),
}));
vi.mock("@/servicios/servicio-activos", () => ({ listarActivosPaginados: s.listarActivosPaginados }));
vi.mock("@/servicios/servicio-repuestos", () => ({ listarRepuestosPaginados: s.listarRepuestosPaginados }));
vi.mock("next/image", () => ({
  default: (p: { alt: string; src: string }) => <span data-src={p.src} role="img" aria-label={p.alt} />,
}));

const pagina = (elementos: unknown[]) => ({ elementos, pagina: 1, tamanoPagina: 20, totalElementos: elementos.length, totalPaginas: 1 });
const clientes = [
  { id: 1, razonSocial: "ACME", estado: "activo" },
  { id: 2, razonSocial: "Otro", estado: "activo" },
] as never[];
const activos = [
  { id: 10, clienteId: 1, nombre: "Retro 1", numSerie: "S1", estado: "activo" },
  { id: 11, clienteId: 1, nombre: null, numSerie: "S2", estado: "activo" },
  { id: 12, clienteId: 1, nombre: "Vieja", numSerie: "S3", estado: "inactivo" },
  { id: 20, clienteId: 2, nombre: "Ajena", numSerie: "S9", estado: "activo" },
] as never[];
const tecnicos = [{ id: 7, nombre: "Tomás", apellido: "Ruiz" }] as never[];
const repuestos = [
  { id: 3, codigo: "R3", nombre: "Filtro", estado: "activo" },
  { id: 4, codigo: "R4", nombre: "Bomba", estado: "inactivo" },
] as never[];

function ordenExistente(extra: Partial<OrdenTrabajo> = {}): OrdenTrabajo {
  return {
    id: 11, clienteId: 1, nombreCliente: "ACME", activoId: 10, nombreActivo: "Retro 1", tecnicoId: 7, nombreTecnico: "Tomás Ruiz",
    tipo: "correctivo", prioridad: "alta", descripcion: "Cambiar filtro", observaciones: "Obs", fechaPrevistaEjecucion: "2026-10-20",
    estado: "en_ejecucion", creadoEn: "2026-10-01T10:00:00Z", fechaInicio: null, fechaCierre: null, sugerencias: ["Sugerida"],
    repuestos: [{ id: 3, codigo: "R3", nombre: "Filtro" }], estadosSiguientes: ["pausada", "finalizada"], historialEstados: [], version: "v1",
    ...extra,
  };
}

beforeEach(() => {
  Object.values(s).forEach((f) => f.mockReset());
  push.mockReset();
  localStorage.clear();
  pathname.valor = "/tecnico";
  s.listarTecnicosPaginados.mockResolvedValue([]);
  s.listarClientesPaginados.mockResolvedValue(pagina([]));
  s.listarActivosPaginados.mockResolvedValue(pagina([]));
  s.listarRepuestosPaginados.mockResolvedValue(pagina([]));
});

function dibujarFormulario(props: Partial<React.ComponentProps<typeof FormularioOrdenTrabajo>> = {}) {
  const alEnviar = vi.fn().mockResolvedValue({});
  render(
    <FormularioOrdenTrabajo
      activos={activos}
      alEnviar={alEnviar}
      clientes={clientes}
      etiquetaConfirmacion="Confirmar"
      repuestos={repuestos}
      tecnicos={tecnicos}
      {...props}
    />,
  );
  return alEnviar;
}

function elegir(nombre: string | RegExp, opcion: string) {
  fireEvent.focus(screen.getByRole("combobox", { name: nombre }));
  fireEvent.click(screen.getByRole("option", { name: opcion }));
}

describe("FormularioOrdenTrabajo (alta)", () => {
  it("muestra los cuatro errores obligatorios y enfoca el primero", async () => {
    const alEnviar = dibujarFormulario();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(await screen.findByText("El cliente es obligatorio.")).toBeInTheDocument();
    expect(screen.getByText("El activo es obligatorio.")).toBeInTheDocument();
    expect(screen.getByText("La descripción de la tarea es obligatoria.")).toBeInTheDocument();
    expect(screen.getByText("La fecha prevista de ejecución es obligatoria.")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /Cliente/ })).toHaveFocus();
    expect(alEnviar).not.toHaveBeenCalled();
  });

  it("enfoca el siguiente campo con error cuando el cliente ya está elegido", async () => {
    dibujarFormulario();
    elegir(/Cliente/, "ACME");
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    await screen.findByText("El activo es obligatorio.");
    expect(screen.getByRole("combobox", { name: /Activo/ })).toHaveFocus();
  });

  it("solo ofrece los activos activos del cliente elegido y reinicia el activo al cambiar de cliente", () => {
    dibujarFormulario();
    expect(screen.getByRole("combobox", { name: /Activo/ })).toBeDisabled();
    elegir(/Cliente/, "ACME");
    fireEvent.focus(screen.getByRole("combobox", { name: /Activo/ }));
    expect(within(screen.getByRole("listbox")).getAllByRole("option").map((o) => o.textContent)).toEqual(["Retro 1", "S2"]);
    fireEvent.click(screen.getByRole("option", { name: "Retro 1" }));
    expect(screen.getByRole("combobox", { name: /Activo/ })).toHaveValue("Retro 1");
    elegir(/Cliente/, "Otro");
    expect(screen.getByRole("combobox", { name: /Activo/ })).toHaveValue("");
  });

  it("envía la orden completa con repuestos, técnico y sesión de sugerencias", async () => {
    const alEnviar = dibujarFormulario();
    elegir(/Cliente/, "ACME");
    elegir(/Activo/, "Retro 1");
    elegir(/Técnico responsable/, "Tomás Ruiz");
    fireEvent.change(screen.getByLabelText("Tipo de mantenimiento"), { target: { value: "correctivo" } });
    fireEvent.change(screen.getByLabelText("Prioridad"), { target: { value: "alta" } });
    fireEvent.change(screen.getByLabelText("Descripción de la tarea"), { target: { value: "Pierde aceite" } });
    fireEvent.change(screen.getByLabelText("Observaciones adicionales"), { target: { value: "Urgente" } });
    fireEvent.change(screen.getByLabelText("Fecha prevista de ejecución"), { target: { value: "2026-11-01" } });
    fireEvent.focus(screen.getByRole("combobox", { name: "Repuestos" }));
    expect(within(screen.getByRole("listbox")).getAllByRole("option").map((o) => o.textContent)).toEqual(["R3 - Filtro"]);
    fireEvent.click(screen.getByRole("option", { name: /R3 - Filtro/ }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));

    await waitFor(() =>
      expect(alEnviar).toHaveBeenCalledWith({
        clienteId: 1, activoId: 10, tecnicoId: 7, tipo: "correctivo", prioridad: "alta", descripcion: "Pierde aceite",
        observaciones: "Urgente", fechaPrevistaEjecucion: "2026-11-01", sugerencias: [], repuestosIds: [3], estado: "creada",
        motivoEstado: "", sesion: "sesion-fija",
      }),
    );
    await waitFor(() => expect(push).toHaveBeenCalledWith("/ordenes-trabajo"));
  });

  it("muestra el error del servidor en una alerta enfocable y permite reintentar", async () => {
    const alEnviar = dibujarFormulario();
    alEnviar.mockRejectedValueOnce(new Error("El activo no pertenece al cliente.")).mockRejectedValueOnce("raro");
    elegir(/Cliente/, "ACME");
    elegir(/Activo/, "Retro 1");
    fireEvent.change(screen.getByLabelText("Descripción de la tarea"), { target: { value: "x" } });
    fireEvent.change(screen.getByLabelText("Fecha prevista de ejecución"), { target: { value: "2026-11-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    const alerta = await screen.findByText("El activo no pertenece al cliente.");
    await waitFor(() => expect(alerta).toHaveFocus());
    expect(push).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(await screen.findByText("No se pudo guardar la orden de trabajo.")).toBeInTheDocument();
  });
});

describe("FormularioOrdenTrabajo (modificación)", () => {
  it("precarga los datos y ofrece el estado actual y los siguientes", () => {
    dibujarFormulario({ ordenInicial: ordenExistente() });
    expect(screen.getByLabelText("Descripción de la tarea")).toHaveValue("Cambiar filtro");
    expect(screen.getByLabelText("Fecha prevista de ejecución")).toHaveValue("2026-10-20");
    expect(within(screen.getByLabelText("Estado")).getAllByRole("option").map((o) => o.textContent)).toEqual([
      "En ejecución", "Pausada", "Finalizada",
    ]);
    expect(screen.getByLabelText("Sugerencia 1")).toHaveValue("Sugerida");
    expect(within(screen.getByRole("list", { name: "Repuestos seleccionados" })).getByText(/R3 - Filtro/)).toBeInTheDocument();
  });

  it("exige motivo al pausar, lo enfoca y recién entonces envía", async () => {
    const alEnviar = dibujarFormulario({ ordenInicial: ordenExistente() });
    expect(screen.queryByLabelText("Motivo del cambio de estado")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "pausada" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(await screen.findByText("Indicá el motivo del cambio de estado.")).toHaveAttribute("role", "alert");
    expect(screen.getByLabelText("Motivo del cambio de estado")).toHaveFocus();
    expect(alEnviar).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Motivo del cambio de estado"), { target: { value: "Falta repuesto" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    await waitFor(() => expect(alEnviar).toHaveBeenCalledWith(expect.objectContaining({ estado: "pausada", motivoEstado: "Falta repuesto" })));
  });

  it("recupera las sugerencias temporales guardadas y las borra al guardar", async () => {
    localStorage.setItem("sugerencias-orden-11", JSON.stringify(["Borrador A", "Borrador B"]));
    dibujarFormulario({ ordenInicial: ordenExistente() });
    expect(screen.getByLabelText("Sugerencia 2")).toHaveValue("Borrador B");
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(localStorage.getItem("sugerencias-orden-11")).toBeNull();
  });

  it("cancelar descarta las sugerencias temporales", () => {
    localStorage.setItem("sugerencias-orden-11", JSON.stringify(["Borrador A"]));
    dibujarFormulario({ ordenInicial: ordenExistente() });
    const cancelar = screen.getByRole("link", { name: "Cancelar" });
    cancelar.addEventListener("click", (evento) => evento.preventDefault());
    fireEvent.click(cancelar);
    expect(localStorage.getItem("sugerencias-orden-11")).toBeNull();
  });
});

describe("SugerenciasOrdenTrabajo", () => {
  function dibujar(sugerencias: string[] = []) {
    const alCambiar = vi.fn();
    render(
      <SugerenciasOrdenTrabajo
        alCambiarSugerencias={alCambiar}
        claveSugerenciasTemporales="clave"
        descripcion="Fuga de aceite"
        sesion="sesion-1"
        sugerencias={sugerencias}
      />,
    );
    return alCambiar;
  }

  it("solicita una sugerencia con número de intento y sesión, la agrega y la guarda como temporal", async () => {
    s.solicitarSugerenciaOrdenTrabajo.mockResolvedValue("Revisar sellos");
    const alCambiar = dibujar(["Previa"]);
    fireEvent.click(screen.getByRole("button", { name: "Solicitar sugerencia" }));
    expect(screen.getByRole("button", { name: "Solicitando…" })).toBeDisabled();
    expect(screen.getByText(/buscando la sugerencia en la documentación técnica/)).toBeInTheDocument();
    await waitFor(() => expect(alCambiar).toHaveBeenCalledWith(["Previa", "Revisar sellos"]));
    expect(s.solicitarSugerenciaOrdenTrabajo).toHaveBeenCalledWith({ descripcion: "Fuga de aceite", numero: 2, sesion: "sesion-1" });
    expect(JSON.parse(localStorage.getItem("clave") ?? "[]")).toEqual(["Previa", "Revisar sellos"]);
  });

  it("vuelve a solicitar reemplazando solo la sugerencia elegida, y permite editar y quitar", async () => {
    s.solicitarSugerenciaOrdenTrabajo.mockResolvedValue("Nueva");
    const alCambiar = dibujar(["Una", "Dos"]);
    fireEvent.click(screen.getAllByRole("button", { name: "Volver a solicitar" })[1]);
    await waitFor(() => expect(alCambiar).toHaveBeenCalledWith(["Una", "Nueva"]));

    fireEvent.change(screen.getByLabelText("Sugerencia 1"), { target: { value: "Una editada" } });
    expect(alCambiar).toHaveBeenLastCalledWith(["Una editada", "Dos"]);
    fireEvent.click(screen.getAllByRole("button", { name: "Quitar sugerencia" })[0]);
    expect(alCambiar).toHaveBeenLastCalledWith(["Dos"]);
  });

  it("muestra el error de la solicitud, también al volver a solicitar, y uno genérico", async () => {
    s.solicitarSugerenciaOrdenTrabajo.mockRejectedValueOnce(new Error("Sin información suficiente.")).mockRejectedValueOnce("raro");
    dibujar(["Una"]);
    fireEvent.click(screen.getByRole("button", { name: "Solicitar sugerencia" }));
    const alerta = await screen.findByText("Sin información suficiente.");
    await waitFor(() => expect(alerta).toHaveFocus());
    fireEvent.click(screen.getByRole("button", { name: "Volver a solicitar" }));
    expect(await screen.findByText("No se pudo obtener la sugerencia.")).toBeInTheDocument();
  });

  it("sin clave temporal no usa el almacenamiento", async () => {
    s.solicitarSugerenciaOrdenTrabajo.mockResolvedValue("X");
    const alCambiar = vi.fn();
    render(
      <SugerenciasOrdenTrabajo alCambiarSugerencias={alCambiar} claveSugerenciasTemporales="" descripcion="d" sesion="s" sugerencias={[]} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Solicitar sugerencia" }));
    await waitFor(() => expect(alCambiar).toHaveBeenCalledWith(["X"]));
    expect(localStorage.length).toBe(0);
  });
});

describe("selectores y campos de la orden", () => {
  it("el selector de cliente/activo busca en la API con los filtros correctos", async () => {
    s.listarClientesPaginados.mockResolvedValue(pagina([{ id: 5, razonSocial: "Buscado" }]));
    s.listarActivosPaginados.mockResolvedValue(pagina([{ id: 6, nombre: "", numSerie: "SN-6" }]));
    render(
      <SelectorClienteActivoOrdenTrabajo
        activoId=""
        activoIdInicial=""
        activos={[]}
        alCambiarActivo={vi.fn()}
        alCambiarCliente={vi.fn()}
        alRegistrarCliente={vi.fn()}
        clienteId="5"
        clientes={[]}
        errores={{ clienteId: "Falta cliente", activoId: "Falta activo" }}
      />,
    );
    expect(screen.getByText("Falta cliente")).toHaveAttribute("role", "alert");
    expect(screen.getByRole("combobox", { name: /Cliente/ })).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Escribí para buscar entre los activos del cliente.")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox", { name: /Cliente/ }), { target: { value: "bus" } });
    await waitFor(() => expect(s.listarClientesPaginados).toHaveBeenCalledWith({ buscar: "bus", estado: "activo", pagina: 1 }));
    expect(await screen.findByRole("option", { name: "Buscado" })).toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox", { name: /Activo/ }), { target: { value: "sn" } });
    await waitFor(() =>
      expect(s.listarActivosPaginados).toHaveBeenCalledWith({ buscar: "sn", clienteId: "5", modeloMaquinaId: "", estado: "activo", pagina: 1 }),
    );
    expect(await screen.findByRole("option", { name: "SN-6" })).toBeInTheDocument();
  });

  it("el selector de cliente conserva el activo inicial aunque esté inactivo", () => {
    render(
      <SelectorClienteActivoOrdenTrabajo
        activoId="12"
        activoIdInicial="12"
        activos={activos}
        alCambiarActivo={vi.fn()}
        alCambiarCliente={vi.fn()}
        alRegistrarCliente={vi.fn()}
        clienteId="1"
        clientes={clientes}
      />,
    );
    expect(screen.getByRole("combobox", { name: /Activo/ })).toHaveValue("Vieja");
  });

  it("el selector de repuestos conserva el repuesto inactivo ya elegido y busca activos en la API", async () => {
    s.listarRepuestosPaginados.mockResolvedValue(pagina([{ id: 9, codigo: "R9", nombre: "Nuevo" }]));
    const alCambiar = vi.fn();
    render(<SelectorRepuestosOrdenTrabajo alCambiarIdsRepuestos={alCambiar} idsRepuestos={[4]} repuestos={repuestos} />);
    expect(within(screen.getByRole("list", { name: "Repuestos seleccionados" })).getByText(/R4 - Bomba/)).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: "Repuestos" }), { target: { value: "nue" } });
    await waitFor(() =>
      expect(s.listarRepuestosPaginados).toHaveBeenCalledWith({ buscar: "nue", estado: "activo", ubicacion: "", bajoStock: false, pagina: 1 }),
    );
    fireEvent.click(await screen.findByRole("option", { name: /R9 - Nuevo/ }));
    expect(alCambiar).toHaveBeenCalledWith([4, 9]);
  });

  it("los campos generales buscan técnicos por texto", async () => {
    s.listarTecnicosPaginados.mockResolvedValue([{ id: 8, nombre: "Lía", apellido: "Gómez" }]);
    render(
      <CamposGeneralesOrdenTrabajo
        alCambiarPrioridad={vi.fn()}
        alCambiarTecnico={vi.fn()}
        alCambiarTipo={vi.fn()}
        prioridad="media"
        tecnicoId=""
        tecnicos={[]}
        tipo="preventivo"
      />,
    );
    fireEvent.change(screen.getByRole("combobox", { name: /Técnico responsable/ }), { target: { value: "lia" } });
    await waitFor(() => expect(s.listarTecnicosPaginados).toHaveBeenCalledWith("lia"));
    expect(await screen.findByRole("option", { name: "Lía Gómez" })).toBeInTheDocument();
  });
});

describe("EstructuraTecnico", () => {
  it("marca la sección activa de la barra inferior con aria-current", () => {
    pathname.valor = "/repuestos/3";
    render(<EstructuraTecnico><p>contenido</p></EstructuraTecnico>);
    const navegacion = screen.getByRole("navigation", { name: "Navegación del técnico" });
    expect(within(navegacion).getByRole("link", { name: "Repuestos" })).toHaveAttribute("aria-current", "page");
    expect(within(navegacion).getByRole("link", { name: "Mi trabajo" })).not.toHaveAttribute("aria-current");
    expect(screen.getByText("contenido")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Escritorio" })).toHaveAttribute("href", "/reportes");
  });

  it("'Mi trabajo' y 'Activos' se activan por su prefijo de ruta", () => {
    pathname.valor = "/tecnico/6";
    const { unmount } = render(<EstructuraTecnico>x</EstructuraTecnico>);
    expect(screen.getByRole("link", { name: "Mi trabajo" })).toHaveAttribute("aria-current", "page");
    unmount();
    pathname.valor = "/activos/2";
    render(<EstructuraTecnico>x</EstructuraTecnico>);
    expect(screen.getByRole("link", { name: "Activos" })).toHaveAttribute("aria-current", "page");
  });
});
