import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { paginaDe, simularFetch } from "@/pruebas/ayudas";
import { ErrorDeApi, leerTodasLasPaginas, obtenerUrlBaseApi } from "@/servicios/api/solicitudes-http";
import {
  crearEvidencia,
  listarEvidencias,
  obtenerErroresEvidencia,
  obtenerEtiquetaTipoEvidencia,
  obtenerFechaDeHoy,
  obtenerUrlArchivoEvidencia,
} from "@/servicios/servicio-evidencias";
import { crearDocumentoTecnico, obtenerErrorArchivoPdf } from "@/servicios/servicio-documentos-tecnicos";
import { apiObtenerUrlDescargaDocumentoTecnico } from "@/servicios/api/api-documentos-tecnicos";
import {
  formatearDuracion,
  obtenerAlertasMaquinaria,
  obtenerEtiquetaAlerta,
  obtenerIndicadores,
  obtenerReincidencias,
  obtenerRepuestosUsados,
  obtenerTendencias,
  obtenerTiempos,
  obtenerUrlReporteCsv,
  obtenerUrlReportePdf,
  tiposDeReporte,
} from "@/servicios/servicio-reportes";
import {
  actualizarOrdenTrabajo,
  asignarTecnicoOrdenTrabajo,
  borrarSugerenciasTemporales,
  cambiarEstadoOrdenTrabajo,
  crearOrdenTrabajo,
  crearSesionDeSugerencias,
  estadoNecesitaMotivo,
  formatearFechaPrevista,
  guardarSugerenciasTemporales,
  leerSugerenciasTemporales,
  listarOrdenesTrabajo,
  listarTecnicos,
  listarTecnicosPaginados,
  obtenerDetalleOrdenTrabajo,
  obtenerEtiquetaEstadoOrdenTrabajo,
  obtenerErroresOrdenTrabajo,
  solicitarSugerenciaOrdenTrabajo,
} from "@/servicios/servicio-ordenes-trabajo";
import { obtenerVersionSistema } from "@/servicios/servicio-version";
import type { CrearOrdenTrabajoInput, FiltrosOrdenesTrabajo } from "@/tipos/orden-trabajo";
import type { FiltrosIndicadores } from "@/tipos/reporte";

/** Las URL del navegador son relativas (mismo origen): se completan para leer sus partes. */
const urlRelativa = (url: string) => new URL(url, "http://localhost");


beforeEach(() => vi.stubEnv("API_URL", "http://api.test"));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("solicitudes-http", () => {
  it("en el navegador pide al mismo origen (el reenvío de /api/v1 agrega el token)", () => {
    expect(obtenerUrlBaseApi()).toBe("");
  });

  it("usa el mensaje de la API y su código cuando el cuerpo de error es válido", async () => {
    simularFetch(() => ({ estado: 422, cuerpo: { mensaje: "Dato inválido", codigo: "VALIDACION" } }));
    await expect(leerTodasLasPaginas("/api/v1/x", "Falla genérica")).rejects.toMatchObject({
      message: "Dato inválido",
      codigo: "VALIDACION",
      estadoHttp: 422,
    });
  });

  it("usa el mensaje predeterminado si el cuerpo no es un objeto, no es JSON o no trae mensaje", async () => {
    simularFetch(() => ({ estado: 500, cuerpo: "texto" }));
    await expect(leerTodasLasPaginas("/x", "Falla genérica")).rejects.toMatchObject({ message: "Falla genérica", codigo: null });

    simularFetch(() => ({ estado: 500, cuerpo: { mensaje: "", codigo: 5 } }));
    await expect(leerTodasLasPaginas("/x", "Falla genérica")).rejects.toMatchObject({ message: "Falla genérica", codigo: null });

    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>caído</html>", { status: 502 })));
    const error = await leerTodasLasPaginas("/x", "Falla genérica").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ErrorDeApi);
    expect(error).toMatchObject({ message: "Falla genérica", estadoHttp: 502 });
  });

  it("propaga los errores de red sin enmascararlos", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(leerTodasLasPaginas("/x", "Falla")).rejects.toThrow("Failed to fetch");
  });
});

describe("servicio-version", () => {
  it("consulta /api/v1/version sin caché", async () => {
    const { llamadas } = simularFetch(() => ({ cuerpo: { version: "1.2.3" } }));
    expect(await obtenerVersionSistema()).toBe("1.2.3");
    expect(llamadas[0].url).toBe("/api/v1/version");
    expect(llamadas[0].opciones.cache).toBe("no-store");
  });
});

describe("servicio-evidencias", () => {
  const hoy = obtenerFechaDeHoy();

  it("la fecha de hoy tiene formato ISO con ceros", () => {
    expect(hoy).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 5, 12));
    expect(obtenerFechaDeHoy()).toBe("2026-01-05");
    vi.useRealTimers();
  });

  it("exige tipo y fecha, y archivo salvo en observaciones", () => {
    expect(obtenerErroresEvidencia({ tipo: "", observacion: "", fechaRegistro: "", archivo: null })).toMatchObject({
      tipo: "Seleccioná el tipo de evidencia.",
      fechaRegistro: "Indicá la fecha de registro.",
      archivo: "Adjuntá el archivo de la evidencia.",
    });
    expect(obtenerErroresEvidencia({ tipo: "observacion", observacion: " ", fechaRegistro: hoy, archivo: null }).observacion).toBeDefined();
    expect(obtenerErroresEvidencia({ tipo: "observacion", observacion: "Ok", fechaRegistro: hoy, archivo: null })).toEqual({});
    expect(obtenerErroresEvidencia({ tipo: "foto", observacion: "", fechaRegistro: "2999-01-01", archivo: null }).fechaRegistro).toContain("futura");
  });

  it("rechaza archivos de más de 10 MB y acepta exactamente 10 MB", () => {
    const grande = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "a.jpg");
    const justo = new File([new Uint8Array(10 * 1024 * 1024)], "b.jpg");
    expect(obtenerErroresEvidencia({ tipo: "foto", observacion: "", fechaRegistro: hoy, archivo: grande }).archivo).toBe("El archivo supera 10 MB.");
    expect(obtenerErroresEvidencia({ tipo: "foto", observacion: "", fechaRegistro: hoy, archivo: justo })).toEqual({});
  });

  it("crea la evidencia con multipart y sin forzar Content-Type", async () => {
    const { llamadas } = simularFetch(() => ({ estado: 201, cuerpo: { id: 1 } }));
    await expect(crearEvidencia(4, { tipo: "foto", observacion: "", fechaRegistro: hoy, archivo: null })).rejects.toThrow("Adjuntá");
    await crearEvidencia(4, { tipo: "foto", observacion: "Nota", fechaRegistro: hoy, archivo: new File(["x"], "a.jpg", { type: "image/jpeg" }) });
    await crearEvidencia(4, { tipo: "observacion", observacion: "Solo texto", fechaRegistro: hoy, archivo: null });
    await listarEvidencias(4);
    expect(llamadas).toHaveLength(3);
    const formulario = llamadas[0].cuerpo as FormData;
    expect(formulario.get("tipo")).toBe("foto");
    expect((formulario.get("archivo") as File).name).toBe("a.jpg");
    expect(llamadas[0].encabezados["Content-Type"]).toBeUndefined();
    expect((llamadas[1].cuerpo as FormData).has("archivo")).toBe(false);
    expect(llamadas[2].url).toBe("/api/v1/ordenes-trabajo/4/evidencias");
  });

  it("arma la URL del archivo y traduce los tipos", () => {
    expect(obtenerUrlArchivoEvidencia(4, 9)).toBe("/api/v1/ordenes-trabajo/4/evidencias/9/archivo");
    expect(obtenerEtiquetaTipoEvidencia("foto")).toBe("Foto");
    expect(obtenerEtiquetaTipoEvidencia("documento")).toBe("Documento");
    expect(obtenerEtiquetaTipoEvidencia("observacion")).toBe("Observación");
  });
});

describe("servicio-documentos-tecnicos", () => {
  const pdfValido = () => new File(["%PDF-1.7 contenido"], "manual.pdf", { type: "application/pdf" });

  it("valida que el PDF exista, tenga extensión .pdf y firma real", async () => {
    expect(await obtenerErrorArchivoPdf(null)).toBe("Seleccioná un archivo PDF.");
    expect(await obtenerErrorArchivoPdf(new File(["%PDF-1"], "manual.txt"))).toBe("El archivo debe tener la extensión .pdf.");
    expect(await obtenerErrorArchivoPdf(new File(["hola mundo"], "falso.pdf"))).toBe("El archivo no es un PDF válido.");
    expect(await obtenerErrorArchivoPdf(new File(["%PDF-1"], "MANUAL.PDF"))).toBeNull();
  });

  it("sube el documento como multipart con las banderas indicadas", async () => {
    const { llamadas } = simularFetch(() => ({ estado: 201, cuerpo: { id: 1 } }));
    await expect(crearDocumentoTecnico({ archivo: null, activoId: null, usaSugerenciasIA: true })).rejects.toThrow("Seleccioná");
    await expect(crearDocumentoTecnico({ archivo: new File(["x"], "a.pdf"), activoId: null, usaSugerenciasIA: true })).rejects.toThrow("no es un PDF válido");
    expect(llamadas).toHaveLength(0);

    await crearDocumentoTecnico({ archivo: pdfValido(), activoId: 7, usaSugerenciasIA: false });
    await crearDocumentoTecnico({ archivo: pdfValido(), activoId: null, usaSugerenciasIA: true });
    const primero = llamadas[0].cuerpo as FormData;
    expect(primero.get("activoId")).toBe("7");
    expect(primero.get("usaSugerenciasIA")).toBe("false");
    expect((llamadas[1].cuerpo as FormData).has("activoId")).toBe(false);
  });

  it("arma el enlace público de descarga con la URL del navegador", () => {
    expect(apiObtenerUrlDescargaDocumentoTecnico(8)).toBe("/api/v1/documentos-tecnicos/8/archivo");
  });
});

describe("servicio-reportes", () => {
  const vacios: FiltrosIndicadores = { fechaDesde: "", fechaHasta: "", tecnicoId: "", clienteId: "", activoId: "", estado: "", tipo: "" };
  const completos: FiltrosIndicadores = {
    fechaDesde: "2026-01-01",
    fechaHasta: "2026-01-31",
    tecnicoId: "1",
    clienteId: "2",
    activoId: "3",
    estado: "cerrada",
    tipo: "correctivo",
  };

  it("los indicadores omiten filtros vacíos y envían los completos", async () => {
    const { llamadas } = simularFetch(() => ({ cuerpo: {} }));
    await obtenerIndicadores(vacios);
    await obtenerIndicadores(completos);
    expect(llamadas[0].url).toBe("/api/v1/reportes/indicadores");
    expect(Object.fromEntries(urlRelativa(llamadas[1].url).searchParams)).toEqual({
      fechaDesde: "2026-01-01",
      fechaHasta: "2026-01-31",
      tecnicoId: "1",
      clienteId: "2",
      activoId: "3",
      estado: "cerrada",
      tipo: "correctivo",
    });
  });

  it("los reportes analíticos usan sus rutas y solo los filtros que aplican", async () => {
    const { llamadas } = simularFetch(() => ({ cuerpo: {} }));
    await obtenerTendencias(completos, "mes");
    await obtenerTiempos(vacios);
    await obtenerReincidencias(completos);
    await obtenerRepuestosUsados(vacios);
    await obtenerAlertasMaquinaria(vacios);
    const rutas = llamadas.map((l) => urlRelativa(l.url).pathname);
    expect(rutas).toEqual([
      "/api/v1/reportes/tendencias",
      "/api/v1/reportes/tiempos",
      "/api/v1/reportes/reincidencias",
      "/api/v1/reportes/repuestos-usados",
      "/api/v1/reportes/alertas-maquinaria",
    ]);
    const tendencias = urlRelativa(llamadas[0].url).searchParams;
    expect(tendencias.get("agrupacion")).toBe("mes");
    expect(tendencias.has("estado")).toBe(false);
    expect(llamadas[1].url).toBe("/api/v1/reportes/tiempos");
  });

  it("arma las URL de descarga PDF y CSV con prioridad", () => {
    expect(obtenerUrlReportePdf("ordenes-trabajo", vacios, "")).toBe("/api/v1/reportes/ordenes-trabajo/pdf");
    const csv = urlRelativa(obtenerUrlReporteCsv("indicadores", completos, "alta"));
    expect(csv.pathname).toBe("/api/v1/reportes/indicadores/csv");
    expect(csv.searchParams.get("prioridad")).toBe("alta");
    expect(csv.searchParams.get("estado")).toBe("cerrada");
    expect(tiposDeReporte.map((t) => t.valor)).toContain("actividad-tecnicos");
  });

  it("traduce las alertas y formatea duraciones", () => {
    expect(obtenerEtiquetaAlerta("sin_asignar")).toBe("Orden sin asignar");
    expect(obtenerEtiquetaAlerta("maquina_detenida")).toBe("Máquina detenida mucho tiempo");
    expect(formatearDuracion(null)).toBe("Sin datos");
    expect(formatearDuracion(0.25)).toBe("15 min");
    expect(formatearDuracion(5.04)).toBe("5 h");
    expect(formatearDuracion(24)).toBe("1 d");
    expect(formatearDuracion(52)).toBe("2 d 4 h");
  });
});

describe("servicio-ordenes-trabajo", () => {
  const orden: CrearOrdenTrabajoInput = {
    clienteId: 1,
    activoId: 2,
    tecnicoId: null,
    tipo: "correctivo",
    prioridad: "media",
    descripcion: "Cambiar filtro",
    observaciones: "",
    fechaPrevistaEjecucion: "2026-10-20",
    sugerencias: [],
    repuestosIds: [],
    estado: "creada",
    motivoEstado: "",
    sesion: "s",
  };
  const filtrosVacios: FiltrosOrdenesTrabajo = {
    buscar: "", clienteId: "", activoId: "", tecnicoId: "", estado: "", prioridad: "", tipo: "",
    fechaDesde: "", fechaHasta: "", conSugerencias: false, pagina: 1,
  };

  it("valida cliente, activo, descripción y fecha", () => {
    expect(obtenerErroresOrdenTrabajo(orden)).toEqual({});
    expect(obtenerErroresOrdenTrabajo({ ...orden, clienteId: 0, activoId: 0, descripcion: " ", fechaPrevistaEjecucion: "" })).toEqual({
      clienteId: "El cliente es obligatorio.",
      activoId: "El activo es obligatorio.",
      descripcion: "La descripción de la tarea es obligatoria.",
      fechaPrevistaEjecucion: "La fecha prevista de ejecución es obligatoria.",
    });
  });

  it("crea y actualiza con validación, y envía If-Match entre comillas si hay versión", async () => {
    const { llamadas } = simularFetch(() => ({ cuerpo: { id: 1 } }));
    await expect(crearOrdenTrabajo({ ...orden, activoId: 0 })).rejects.toThrow("activo");
    await expect(actualizarOrdenTrabajo(1, { ...orden, clienteId: 0 })).rejects.toThrow("cliente");
    expect(llamadas).toHaveLength(0);
    await crearOrdenTrabajo(orden);
    await actualizarOrdenTrabajo(1, orden, "v7");
    await actualizarOrdenTrabajo(1, orden);
    expect(llamadas[1].encabezados["If-Match"]).toBe('"v7"');
    expect(llamadas[2].encabezados["If-Match"]).toBeUndefined();
    expect(llamadas[2].metodo).toBe("PUT");
  });

  it("propaga el código 412 de conflicto de versión", async () => {
    simularFetch(() => ({ estado: 412, cuerpo: { mensaje: "La orden cambió.", codigo: "VERSION_DESACTUALIZADA" } }));
    await expect(actualizarOrdenTrabajo(1, orden, "v1")).rejects.toMatchObject({ estadoHttp: 412, codigo: "VERSION_DESACTUALIZADA" });
  });

  it("lista con todos los filtros y la bandera de sugerencias", async () => {
    const { llamadas } = simularFetch(() => ({ cuerpo: paginaDe([]) }));
    await listarOrdenesTrabajo(filtrosVacios);
    await listarOrdenesTrabajo({
      buscar: " fuga ", clienteId: "1", activoId: "2", tecnicoId: "3", estado: "pausada", prioridad: "alta",
      tipo: "preventivo", fechaDesde: "2026-01-01", fechaHasta: "2026-02-01", conSugerencias: true, pagina: 3,
    });
    await obtenerDetalleOrdenTrabajo(4);
    expect(llamadas[0].url).toBe("/api/v1/ordenes-trabajo?pagina=1");
    expect(Object.fromEntries(urlRelativa(llamadas[1].url).searchParams)).toMatchObject({
      buscar: "fuga", estado: "pausada", conSugerencias: "true", pagina: "3", tecnicoId: "3",
    });
    expect(llamadas[2].url).toBe("/api/v1/ordenes-trabajo/4");
  });

  it("exige motivo solo en los cambios de estado que lo requieren", async () => {
    expect(estadoNecesitaMotivo("creada", "creada")).toBe(false);
    expect(estadoNecesitaMotivo("en_ejecucion", "pausada")).toBe(true);
    expect(estadoNecesitaMotivo("asignada", "cancelada")).toBe(true);
    expect(estadoNecesitaMotivo("finalizada", "cerrada")).toBe(true);
    expect(estadoNecesitaMotivo("finalizada", "asignada")).toBe(true);
    expect(estadoNecesitaMotivo("creada", "asignada")).toBe(false);

    const { llamadas } = simularFetch(() => ({ cuerpo: { id: 1 } }));
    await expect(cambiarEstadoOrdenTrabajo(1, "creada", "", "")).rejects.toThrow("Seleccioná el nuevo estado");
    await expect(cambiarEstadoOrdenTrabajo(1, "en_ejecucion", "pausada", "  ")).rejects.toThrow("motivo");
    expect(llamadas).toHaveLength(0);
    await cambiarEstadoOrdenTrabajo(1, "en_ejecucion", "pausada", "  falta repuesto ");
    await cambiarEstadoOrdenTrabajo(1, "creada", "asignada", "");
    expect(llamadas[0]).toMatchObject({ metodo: "PATCH", cuerpo: { estado: "pausada", motivo: "falta repuesto" } });
    expect(llamadas[0].url).toBe("/api/v1/ordenes-trabajo/1/estado");
  });

  it("asigna técnico convirtiendo el id y rechazando vacío", async () => {
    const { llamadas } = simularFetch(() => ({ cuerpo: { id: 1 } }));
    await expect(asignarTecnicoOrdenTrabajo(1, "")).rejects.toThrow("Seleccioná un técnico");
    await asignarTecnicoOrdenTrabajo(1, "12");
    expect(llamadas[0]).toMatchObject({ url: "/api/v1/ordenes-trabajo/1/tecnico", cuerpo: { tecnicoId: 12 } });
  });

  it("etiqueta estados y formatea la fecha prevista", () => {
    expect(obtenerEtiquetaEstadoOrdenTrabajo("en_ejecucion")).toBe("En ejecución");
    expect(obtenerEtiquetaEstadoOrdenTrabajo("cancelada")).toBe("Cancelada");
    expect(formatearFechaPrevista("2026-10-05")).toBe("05/10/2026");
  });

  it("solicita sugerencias: valida, traduce 422 y 5xx, y devuelve el texto", async () => {
    const { llamadas } = simularFetch(() => ({ cuerpo: { sugerencia: "Revisar sellos" } }));
    await expect(solicitarSugerenciaOrdenTrabajo({ descripcion: " ", numero: 1, sesion: "s" })).rejects.toThrow("Escribí la descripción");
    expect(await solicitarSugerenciaOrdenTrabajo({ descripcion: "Fuga", numero: 1, sesion: "s" })).toBe("Revisar sellos");
    expect(llamadas[0]).toMatchObject({ metodo: "POST", url: "/api/v1/ordenes-trabajo/sugerencia" });

    simularFetch(() => ({ estado: 422, cuerpo: {} }));
    await expect(solicitarSugerenciaOrdenTrabajo({ descripcion: "Fuga", numero: 1, sesion: "s" })).rejects.toThrow("información suficiente");
    simularFetch(() => ({ estado: 503, cuerpo: {} }));
    await expect(solicitarSugerenciaOrdenTrabajo({ descripcion: "Fuga", numero: 1, sesion: "s" })).rejects.toThrow("No se pudo obtener la sugerencia");
  });

  it("genera identificadores de sesión únicos, con o sin crypto.randomUUID", () => {
    const uno = crearSesionDeSugerencias();
    expect(uno).toMatch(/^[0-9a-f-]{36}$/);
    expect(crearSesionDeSugerencias()).not.toBe(uno);
    vi.stubGlobal("crypto", {});
    const alternativo = crearSesionDeSugerencias();
    expect(alternativo).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it("guarda, lee y borra sugerencias temporales tolerando fallos del almacenamiento", () => {
    expect(leerSugerenciasTemporales("k")).toBeNull();
    expect(guardarSugerenciasTemporales("k", ["a", "b"])).toBe(true);
    expect(leerSugerenciasTemporales("k")).toEqual(["a", "b"]);
    expect(borrarSugerenciasTemporales("k")).toBe(true);
    expect(leerSugerenciasTemporales("k")).toBeNull();

    localStorage.setItem("roto", "{no es json");
    expect(leerSugerenciasTemporales("roto")).toBeNull();

    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("cuota");
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    expect(guardarSugerenciasTemporales("k", ["a"])).toBe(false);
    expect(borrarSugerenciasTemporales("k")).toBe(false);
  });

  it("lista técnicos activos filtrando por el nombre del rol, sin pedir /roles (solo del administrador)", async () => {
    const usuario = (id: number, rol: string, estado: string) => ({ id, estado, roles: [{ id: 1, nombre: rol, activo: true }] });
    const { llamadas } = simularFetch(() => ({
      cuerpo: paginaDe([usuario(1, "Técnico", "activo"), usuario(2, "Técnico", "inactivo"), usuario(3, "Administrador", "activo")]),
    }));
    const tecnicos = await listarTecnicos();
    expect(tecnicos.map((t) => t.id)).toEqual([1]);

    const paginados = await listarTecnicosPaginados("ana");
    expect(paginados.map((t) => t.id)).toEqual([1]);
    const ultima = urlRelativa(llamadas.at(-1)!.url);
    expect(ultima.pathname).toBe("/api/v1/usuarios");
    expect(ultima.searchParams.get("rolId")).toBeNull();
    expect(ultima.searchParams.get("estado")).toBe("activo");
    expect(ultima.searchParams.get("tamanoPagina")).toBe("100");
    expect(ultima.searchParams.get("buscar")).toBe("ana");
    expect(llamadas.some((llamada) => llamada.url.includes("/roles"))).toBe(false);
  });
});
