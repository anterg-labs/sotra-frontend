import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContenedorGrafico, GraficoColumnas, GraficoLineas, GraficoPareto, MiniColumnas, Sparkline } from "@/componentes/graficos-avanzados";
import type { Avisos, Comparativa, Desgaste, DesempenoOperativo, Envejecimiento, MetricaComparada, Tendencias, Tiempos } from "@/tipos/reporte";
import { anticiparConsulta } from "@/servicios/servidor/consulta-anticipada";
import { FranjaAvisos, enlaceDelAviso } from "./franja-avisos";
import { SeccionAnalisisAvanzado } from "./seccion-analisis-avanzado";
import { SeccionMaquinaria } from "./seccion-maquinaria";
import { SeccionPlegable } from "./seccion-plegable";
import { SeccionProceso } from "./seccion-proceso";
import { TarjetasKpi } from "./tarjetas-kpi";
import { tonoDeLaVariacion } from "./tono-variacion";

const api = vi.hoisted(() => ({
  apiObtenerDesempeno: vi.fn(),
  apiObtenerTendencias: vi.fn(),
  apiObtenerEnvejecimiento: vi.fn(),
  apiObtenerTiempos: vi.fn(),
  apiObtenerComparativa: vi.fn(),
  apiObtenerDesgaste: vi.fn(),
}));
vi.mock("@/servicios/api/api-reportes", () => api);
vi.mock("@/servicios/api/api-estacionalidad", () => ({
  apiObtenerEstacionalidad: vi.fn().mockResolvedValue({ fechaDesde: null, fechaHasta: null, total: 0, tipos: [],
    meses: Array.from({ length: 12 }, (_, indice) => ({ mes: indice + 1, correctivas: 0 })) }),
}));
vi.mock("@/servicios/api/api-repuestos-por-modelo", () => ({
  apiObtenerRepuestosPorModelo: vi.fn().mockResolvedValue({ fechaDesde: null, fechaHasta: null, modelos: [] }),
}));
vi.mock("@/servicios/api/api-resumen-por-cliente", () => ({
  apiObtenerResumenPorCliente: vi.fn().mockResolvedValue({ fechaDesde: null, fechaHasta: null, diasReincidencia: 90, clientes: [] }),
}));
vi.mock("@/servicios/api/api-demoras-etapas", () => ({
  apiObtenerDemorasEtapas: vi.fn().mockResolvedValue({ calculadoEn: "2026-10-27T00:00:00Z", etapas: [], demoradas: { elementos: [], pagina: 1, tamanoPagina: 20, totalElementos: 0, totalPaginas: 0 } }),
}));
vi.mock("@/servicios/api/api-desgaste-edad-uso", () => ({
  apiObtenerDesgasteEdadUso: vi.fn().mockResolvedValue({
    fechaDesde: null, fechaHasta: null, totalActivos: 0, conEdad: 0, conUso: 0, activos: [],
  }),
}));

const filtros = { fechaDesde: "", fechaHasta: "", clienteId: "", activoId: "", estado: "", tipo: "" };

const maquina = (extra: Record<string, unknown>) => ({
  id: 1, nombre: "Retro 1", cliente: "ACME", ordenes: 4, correctivas: 3, preventivas: 1, horasPromedioEjecucion: 5, horasParada: 60,
  correctivasCerradas: 3, tiempoMedioReparacionHoras: 20, porcentajeDeLaParada: 60, porcentajeAcumulado: 60, activosEnServicio: null, costoParada: null,
  ...extra,
});

const desempeno = {
  ordenes: { creadas: 4, cerradas: 3, eliminadas: 0, abiertas: 1, preventivas: 1, correctivas: 3, porcentajePreventivas: 25 },
  tiempos: {},
  flujo: {
    pausas: { cantidad: 2, ordenesConPausa: 1, duracionPromedioHoras: 5, motivos: [], porMotivo: [{ codigo: "falta_repuesto", motivo: "Falta de repuesto", cantidad: 2, horas: 10, horasPromedio: 5 }] },
    devoluciones: { cantidad: 0, ordenesDevueltas: 0, porcentajeDeOrdenes: null, motivos: [] },
    reasignaciones: { cantidad: 0, ordenesReasignadas: 0 },
  },
  maquinaria: {
    porTipo: [maquina({ id: 7, nombre: "Retroexcavadora", cliente: null, costoParada: 3000 })],
    activos: [maquina({}), maquina({ id: 2, nombre: "Retro 2", horasParada: 40, porcentajeDeLaParada: 40, porcentajeAcumulado: 100 })],
    porModelo: [maquina({ id: 9, nombre: "BHL75 (Retroexcavadora)", cliente: null, activosEnServicio: 3 })],
  },
  estimacion: { ordenes: 0, horasEstimadas: null, horasReales: null, desviacionPromedioPorcentaje: null },
  planificacion: {
    periodo: { desde: "2026-10-01", hasta: "2026-10-31" },
    resumen: { ordenesCerradas: 2, horasPreventivas: 10, horasCorrectivas: 30, horasTotales: 40, porcentajePlanificado: 25 },
    porMes: [{ periodo: "2026-10-01", resumen: { ordenesCerradas: 2, horasPreventivas: 10, horasCorrectivas: 30, horasTotales: 40, porcentajePlanificado: 25 } }],
    porTipo: [{ id: 7, nombre: "Retroexcavadora", resumen: { ordenesCerradas: 2, horasPreventivas: 10, horasCorrectivas: 30, horasTotales: 40, porcentajePlanificado: 25 } }],
  },
} as unknown as DesempenoOperativo;

beforeEach(() => {
  Object.values(api).forEach((funcion) => funcion.mockReset());
  api.apiObtenerComparativa.mockResolvedValue({ periodo: { desde: "2026-10-01", hasta: "2026-10-31" }, metricas: [] });
  window.history.replaceState(null, "", "/reportes");
});

afterEach(() => {
  window.history.replaceState(null, "", "/");
});

describe("sistema de gráficas", () => {
  it("la mini línea corta el trazo en los meses sin datos y avisa si no alcanza para una tendencia", () => {
    const { container, rerender } = render(<Sparkline titulo="Tendencia" valores={[1, 2, null, 4, 5]} />);
    expect(screen.getByRole("img", { name: "Tendencia" })).toBeInTheDocument();
    expect(container.querySelectorAll("polyline")).toHaveLength(2);
    rerender(<Sparkline titulo="Tendencia" valores={[1, null, null]} />);
    expect(screen.getByText("Sin tendencia")).toBeInTheDocument();
  });

  it("el Pareto dibuja las barras, la línea acumulada y la referencia del 80 %", () => {
    const { container } = render(
      <GraficoPareto datos={[{ etiqueta: "Retro 1", valor: 60, acumulado: 60 }, { etiqueta: "Retro 2", valor: 40, acumulado: 100 }]} titulo="Pareto" unidad="horas" />,
    );
    expect(screen.getByRole("img", { name: "Pareto" })).toBeInTheDocument();
    expect(container.querySelectorAll("rect.grafico-barra-principal")).toHaveLength(2);
    expect(container.querySelector("polyline.grafico-linea-acumulada")).not.toBeNull();
    expect(container.querySelector("line.grafico-referencia")).not.toBeNull();
    expect(screen.getByText("Porcentaje acumulado")).toBeInTheDocument();
  });

  it("las líneas y las columnas se dibujan y, sin datos, dicen que no hay", () => {
    const series = [{ nombre: "Creadas", clase: "grafico-serie-creadas", valores: [3, 5] }, { nombre: "Cerradas", clase: "grafico-serie-cerradas", valores: [1, 4] }];
    const { rerender } = render(<GraficoLineas etiquetas={["09/26", "10/26"]} series={series} titulo="Evolución" />);
    expect(screen.getByRole("img", { name: "Evolución" })).toBeInTheDocument();
    expect(screen.getByText("Cerradas")).toBeInTheDocument();
    rerender(<GraficoLineas etiquetas={[]} series={series} titulo="Evolución" />);
    expect(screen.getByText("No hay datos en el período.")).toBeInTheDocument();
    rerender(<GraficoColumnas datos={[{ etiqueta: "Hasta 3", valor: 0 }]} titulo="Edad" unidad="órdenes" />);
    expect(screen.getByText("No hay datos en el período.")).toBeInTheDocument();
    rerender(<GraficoColumnas datos={[{ etiqueta: "Más de 90", valor: 2, severidad: "critico" }]} titulo="Edad" unidad="órdenes" />);
    expect(screen.getByRole("img", { name: "Edad" })).toBeInTheDocument();
  });

  it("las mini columnas dibujan una columna por intervalo", () => {
    const { container } = render(<MiniColumnas titulo="Intervalos" valores={[30, 20, 10]} />);
    expect(container.querySelectorAll("rect")).toHaveLength(3);
  });

  it("el contenedor alterna entre la gráfica y la tabla y explica el cálculo", () => {
    render(<ContenedorGrafico ayuda="Se calcula así." grafico={<p>Gráfica</p>} tabla={<p>Tabla</p>} titulo="Mi gráfica" />);
    expect(screen.getByText("Gráfica")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Ver como tabla" }));
    expect(screen.getByText("Tabla")).toBeVisible();
    expect(screen.getByText("Gráfica")).not.toBeVisible();
    expect(screen.getByRole("button", { name: "Ver gráfica" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Cómo se calcula")).toBeInTheDocument();
  });
});

describe("sección plegable", () => {
  it("monta su contenido recién al abrirla, recuerda la apertura en la URL y la abre desde el enlace con ancla", () => {
    render(
      <SeccionPlegable id="proceso" resumen="Resumen" titulo="Proceso">
        <p>Contenido del proceso</p>
      </SeccionPlegable>,
    );
    const cabecera = screen.getByRole("button", { name: /Proceso/ });
    expect(cabecera).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Contenido del proceso")).not.toBeInTheDocument();

    fireEvent.click(cabecera);
    expect(cabecera).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Contenido del proceso")).toBeVisible();
    expect(window.location.search).toContain("abiertas=proceso");

    fireEvent.click(cabecera);
    expect(screen.getByText("Contenido del proceso")).not.toBeVisible();
    expect(window.location.search).not.toContain("abiertas");

    window.location.hash = "#seccion-proceso";
    fireEvent(window, new HashChangeEvent("hashchange"));
    expect(cabecera).toHaveAttribute("aria-expanded", "true");
  });

  it("empieza abierta si se lo piden o si la URL ya la lista", async () => {
    window.history.replaceState(null, "", "/reportes?abiertas=a,otra");
    render(
      <>
        <SeccionPlegable abiertaInicial id="uno" resumen="r" titulo="Uno"><p>uno</p></SeccionPlegable>
        <SeccionPlegable id="otra" resumen="r" titulo="Otra"><p>otra</p></SeccionPlegable>
      </>,
    );
    expect(screen.getByRole("button", { name: /Uno/ })).toHaveAttribute("aria-expanded", "true");
    await waitFor(() => expect(screen.getByRole("button", { name: /Otra/ })).toHaveAttribute("aria-expanded", "true"));
  });
});

const metrica = (extra: Partial<MetricaComparada>): MetricaComparada => ({
  codigo: "preventivas_porcentaje", nombre: "Preventivas sobre el total", unidad: "porcentaje", actual: 40, anterior: 30,
  anioAnterior: null, variacionPorcentual: 33.3, mejorSiSube: true, muestra: 10,
  serie: [{ periodo: "2026-05-01", valor: 20 }, { periodo: "2026-06-01", valor: 40 }], ...extra,
});

describe("tarjetas de indicadores", () => {
  it("el tono de la variación depende de si subir es bueno o malo", () => {
    expect(tonoDeLaVariacion({ variacionPorcentual: 10, mejorSiSube: true })).toBe("grafico-tono-bueno");
    expect(tonoDeLaVariacion({ variacionPorcentual: 10, mejorSiSube: false })).toBe("grafico-tono-malo");
    expect(tonoDeLaVariacion({ variacionPorcentual: -10, mejorSiSube: false })).toBe("grafico-tono-bueno");
    expect(tonoDeLaVariacion({ variacionPorcentual: 0, mejorSiSube: true })).toBe("grafico-tono-neutro");
    expect(tonoDeLaVariacion({ variacionPorcentual: 5, mejorSiSube: null })).toBe("grafico-tono-neutro");
    expect(tonoDeLaVariacion({ variacionPorcentual: null, mejorSiSube: true })).toBe("grafico-tono-neutro");
  });

  it("muestra tres tarjetas con su cifra, su variación y el enlace a la sección", async () => {
    const comparativa: Comparativa = {
      periodo: { desde: "a", hasta: "b" }, periodoAnterior: { desde: "a", hasta: "b" }, periodoAnioAnterior: { desde: "a", hasta: "b" },
      metricas: [
        metrica({}),
        metrica({ codigo: "cumplimiento_preventivo", nombre: "Preventivos cerrados en fecha", actual: null, variacionPorcentual: null }),
        metrica({ codigo: "tiempo_reparacion_horas", nombre: "Tiempo medio de reparación", unidad: "horas", actual: 12.5, variacionPorcentual: -20, mejorSiSube: false }),
        metrica({ codigo: "ordenes_creadas", nombre: "Órdenes creadas" }),
      ],
    };
    render(await TarjetasKpi({ consulta: anticiparConsulta(Promise.resolve(comparativa)) }));
    const tarjetas = screen.getAllByRole("link");
    expect(tarjetas).toHaveLength(3);
    expect(within(tarjetas[0]).getByText(/33,3 % frente al período anterior/)).toHaveClass("grafico-tono-bueno");
    expect(tarjetas[0]).toHaveAttribute("href", "#seccion-maquinaria");
    expect(within(tarjetas[1]).getByText("Sin datos")).toBeInTheDocument();
    expect(tarjetas[1]).toHaveAttribute("href", "#seccion-proceso");
    expect(within(tarjetas[2]).getByText(/▼ 20 %/)).toHaveClass("grafico-tono-bueno");
  });

  it("si la comparativa falla, no ocupa lugar", async () => {
    expect(await TarjetasKpi({ consulta: anticiparConsulta(Promise.reject(new Error("x"))) })).toBeNull();
  });
});

describe("franja de avisos", () => {
  const avisos: Avisos = {
    total: 2, criticos: 1,
    avisos: [
      { regla: "R1", severidad: "critico", titulo: "Retro 1 tuvo 6 correctivas", detalle: "Detalle uno", evidencia: { valor: 6, umbral: 3, unidad: "correctivas", ventanaDias: 730, muestra: 6 }, activoId: 5, enlaceEstado: null },
      { regla: "R8", severidad: "atencion", titulo: "3 órdenes esperan validación", detalle: "Detalle dos", evidencia: { valor: 3, umbral: 7, unidad: "órdenes", ventanaDias: null, muestra: 3 }, activoId: null, enlaceEstado: "en_revision" },
    ],
  };

  it("resume la cantidad, lista cada aviso con su evidencia y enlaza a las órdenes", async () => {
    render(await FranjaAvisos({ consulta: anticiparConsulta(Promise.resolve(avisos)) }));
    expect(screen.getByText("2 avisos")).toBeInTheDocument();
    expect(screen.getByText("Retro 1 tuvo 6 correctivas")).toBeInTheDocument();
    expect(screen.getByText("Detalle dos")).toBeInTheDocument();
    const enlaces = screen.getAllByRole("link", { name: /Ver las órdenes/ });
    expect(enlaces[0]).toHaveAttribute("href", "/ordenes-trabajo?activoId=5&tipo=correctivo");
    expect(enlaces[1]).toHaveAttribute("href", "/ordenes-trabajo?estado=en_revision");
    expect(enlaceDelAviso({ ...avisos.avisos[1], enlaceEstado: null })).toBeNull();
  });

  it("sin avisos o con error no muestra nada", async () => {
    expect(await FranjaAvisos({ consulta: anticiparConsulta(Promise.resolve({ total: 0, criticos: 0, avisos: [] })) })).toBeNull();
    expect(await FranjaAvisos({ consulta: anticiparConsulta(Promise.reject(new Error("x"))) })).toBeNull();
  });
});

describe("secciones del tablero", () => {
  it("Maquinaria muestra el Pareto, el tiempo de reparación y lo planificado frente a lo reactivo", async () => {
    api.apiObtenerDesempeno.mockResolvedValue(desempeno);
    render(<SeccionMaquinaria filtros={filtros} />);
    expect(await screen.findByRole("img", { name: "Pareto de horas de parada por activo" })).toBeInTheDocument();
    expect(screen.getByText("Los primeros 2 activos concentran el 100 % de la parada.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tiempo medio de reparación por tipo de máquina" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tiempo medio de reparación por modelo" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Trabajo planificado frente a reactivo" })).toBeInTheDocument();
    expect(screen.getAllByText("25 %").length).toBeGreaterThan(0);
  });

  it("Maquinaria muestra el error con su botón de reintento", async () => {
    api.apiObtenerDesempeno.mockRejectedValueOnce(new Error("No se pudo obtener el desempeño operativo."));
    api.apiObtenerDesempeno.mockResolvedValue(desempeno);
    render(<SeccionMaquinaria filtros={filtros} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo obtener el desempeño operativo.");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByRole("img", { name: "Pareto de horas de parada por activo" })).toBeInTheDocument();
  });

  it("Proceso muestra creadas frente a cerradas, la antigüedad, el cumplimiento y las pausas por motivo", async () => {
    const tendencias = { agrupacion: "mes", puntos: [{ periodo: "2026-09-01", preventivas: 1, correctivas: 2, total: 3, cerradas: 1 }, { periodo: "2026-10-01", preventivas: 0, correctivas: 2, total: 2, cerradas: 4 }], totalPeriodo: 5, totalPeriodoAnterior: null } as Tendencias;
    const envejecimiento: Envejecimiento = {
      abiertas: 3, rangos: [{ rango: "hasta_3", etiqueta: "Hasta 3 días", cantidad: 2 }, { rango: "mas_de_90", etiqueta: "Más de 90 días", cantidad: 1 }],
      cierresPorSemana: 1.5, backlogEnSemanas: 2, masAntiguas: [{ ordenId: 12, nombreActivo: "Retro 1", cliente: "ACME", estado: "pendiente", edadDias: 120 }],
    };
    const tiempos = {
      duracion: {}, etapas: [], cumplimiento: { evaluadas: 2, enPlazo: 1, porcentajeEnPlazo: 50, atrasoPromedioDias: 3 },
      cumplimientoPorTipoDeOrden: [], cumplimientoPreventivoPorTipoDeMaquina: [{ id: 7, nombre: "Retroexcavadora", evaluadas: 2, enPlazo: 1, porcentajeEnPlazo: 50 }],
    } as unknown as Tiempos;
    api.apiObtenerTendencias.mockResolvedValue(tendencias);
    api.apiObtenerEnvejecimiento.mockResolvedValue(envejecimiento);
    api.apiObtenerTiempos.mockResolvedValue(tiempos);
    api.apiObtenerDesempeno.mockResolvedValue(desempeno);
    render(<SeccionProceso filtros={filtros} />);
    expect(await screen.findByRole("img", { name: "Órdenes creadas frente a cerradas por mes" })).toBeInTheDocument();
    expect(screen.getByText("En el período se cerraron al menos tantas órdenes como se crearon.")).toBeInTheDocument();
    expect(await screen.findByText(/3 órdenes abiertas: al ritmo de cierre actual se vaciarían en 2 semanas/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Orden 12" })).toHaveAttribute("href", "/ordenes-trabajo/12");
    expect(await screen.findByText("50 % de las órdenes cerradas se cerró en fecha.")).toBeInTheDocument();
    expect(await screen.findByText("Horas en pausa por motivo")).toBeInTheDocument();
    expect(screen.getAllByText("10 h").length).toBeGreaterThan(0);
  });

  it("Análisis avanzado compara períodos y avisa cuando faltan datos de desgaste", async () => {
    const comparativa: Comparativa = {
      periodo: { desde: "2026-07-01", hasta: "2026-09-28" }, periodoAnterior: { desde: "2026-04-03", hasta: "2026-06-30" }, periodoAnioAnterior: { desde: "2025-07-01", hasta: "2025-09-28" },
      metricas: [metrica({})],
    };
    api.apiObtenerComparativa.mockResolvedValue(comparativa);
    api.apiObtenerDesgaste.mockResolvedValue({ minimoDeIntervalos: 3, activos: [], datosInsuficientes: true } as Desgaste);
    render(<SeccionAnalisisAvanzado filtros={filtros} />);
    expect(await screen.findByText("Este período frente al anterior")).toBeInTheDocument();
    expect(screen.getByText("+33,3 %")).toBeInTheDocument();
    expect(await screen.findByText(/Datos insuficientes: hacen falta al menos 4 correctivas/)).toBeInTheDocument();
  });

  it("Análisis avanzado muestra los intervalos cuando hay datos", async () => {
    api.apiObtenerComparativa.mockResolvedValue({ periodo: { desde: "a", hasta: "b" }, periodoAnterior: { desde: "a", hasta: "b" }, periodoAnioAnterior: { desde: "a", hasta: "b" }, metricas: [] });
    api.apiObtenerDesgaste.mockResolvedValue({
      minimoDeIntervalos: 3, datosInsuficientes: false,
      activos: [{ activoId: 5, nombreActivo: "Retro 1", cliente: "ACME", modelo: "BHL75", intervalosDias: [90, 60, 30], promedioDias: 60, pendienteDiasPorIntervalo: -30, seAcortan: true, unidadUso: "kilometros", usoPromedioEntreFallas: 1500 }],
    } as Desgaste);
    render(<SeccionAnalisisAvanzado filtros={filtros} />);
    expect(await screen.findByText("Se acortan")).toBeInTheDocument();
    expect(screen.getByText("1.500 km")).toBeInTheDocument();
    expect(screen.queryByText("Patrón de fallas por modelo")).not.toBeInTheDocument();
  });
});
