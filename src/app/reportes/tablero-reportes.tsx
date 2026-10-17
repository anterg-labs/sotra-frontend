"use client";

import { useState } from "react";
import { Combobox } from "@/componentes/combobox";
import { FiltroFecha, rangoDeFechasInvalido } from "@/componentes/filtro-fecha";
import { useFiltrosEnVivo } from "@/componentes/listado/use-filtros-en-vivo";
import { PanelAnalitica } from "@/componentes/panel-analitica";
import { listarActivosPaginados } from "@/servicios/servicio-activos";
import { listarClientesPaginados } from "@/servicios/servicio-clientes";
import { listarTecnicosPaginados, obtenerEtiquetaEstadoOrdenTrabajo } from "@/servicios/servicio-ordenes-trabajo";
import { obtenerUrlReporteCsv, obtenerUrlReportePdf, tiposDeReporte } from "@/servicios/servicio-reportes";
import type { Activo } from "@/tipos/activo";
import type { Cliente } from "@/tipos/cliente";
import { estadosOrdenTrabajo } from "@/tipos/orden-trabajo";
import type { FiltrosIndicadores } from "@/tipos/reporte";
import type { Usuario } from "@/tipos/usuario";
import { construirUrlReportes } from "./filtros";

const VACIOS: FiltrosIndicadores = { fechaDesde: "", fechaHasta: "", tecnicoId: "", clienteId: "", activoId: "", estado: "", tipo: "" };

function nombreVisibleDeActivo(activo: Activo) {
  return activo.nombre !== null && activo.nombre.trim() !== "" ? activo.nombre : activo.numSerie;
}

type PropiedadesTablero = {
  /** Filtros aplicados (los de la URL): el resumen y el análisis se calculan con ellos. */
  filtros: FiltrosIndicadores;
  clientes: Cliente[];
  activos: Activo[];
  tecnicos: Usuario[];
  /** Resumen de indicadores renderizado en el servidor. */
  children: React.ReactNode;
};

/**
 * Tablero de reportes: los filtros viven en la URL, el resumen llega renderizado del servidor, y las descargas PDF/CSV
 * y la pestaña de análisis (que se pide al abrirla) siguen siendo del navegador.
 */
export function TableroReportes(props: PropiedadesTablero) {
  const { filtros, children } = props;
  const { valores, cambiar, aplicarAhora, limpiar, estaPendiente } = useFiltrosEnVivo<FiltrosIndicadores>({
    inicial: filtros,
    construirUrl: construirUrlReportes,
    sonValidos: (v) => !rangoDeFechasInvalido(v.fechaDesde, v.fechaHasta),
    alInvalido: () => document.getElementById("fechaReporte-hasta")?.focus(),
  });
  const { fechaDesde, fechaHasta, tecnicoId, clienteId, activoId, estado, tipo } = valores;
  const [tipoReporte, setTipoReporte] = useState("ordenes-trabajo");
  const [prioridadReporte, setPrioridadReporte] = useState("");
  const [pestanaActiva, setPestanaActiva] = useState<"resumen" | "analisis">("resumen");

  const activosDelCliente = props.activos.filter((activo) => clienteId === "" || String(activo.clienteId) === clienteId);
  const filtrosParaReporte: FiltrosIndicadores = valores;

  return (
    <>
      <form
        aria-busy={estaPendiente}
        aria-label="Filtros"
        className="barra-filtros"
        noValidate
        onSubmit={(evento) => {
          evento.preventDefault();
          aplicarAhora();
        }}
      >
        <FiltroFecha
          alCambiar={(desde, hasta) => cambiar({ fechaDesde: desde, fechaHasta: hasta })}
          etiqueta="Fecha"
          fechaDesde={fechaDesde}
          fechaHasta={fechaHasta}
          id="fechaReporte"
        />

        <Combobox
          alCambiar={(nuevo) => cambiar({ tecnicoId: nuevo })}
          buscarOpciones={async (consulta) => {
            const tecnicos = await listarTecnicosPaginados(consulta);
            return tecnicos.map((tecnico) => ({ valor: String(tecnico.id), etiqueta: `${tecnico.nombre} ${tecnico.apellido}` }));
          }}
          etiqueta="Técnico"
          id="tecnicoId"
          opciones={props.tecnicos.map((tecnico) => ({ valor: String(tecnico.id), etiqueta: `${tecnico.nombre} ${tecnico.apellido}` }))}
          textoVacio="Todos los técnicos"
          valor={tecnicoId}
        />

        <Combobox
          alCambiar={(nuevoId) => cambiar({ clienteId: nuevoId, activoId: "" })}
          buscarOpciones={async (consulta) => {
            const pagina = await listarClientesPaginados({ buscar: consulta, estado: "", pagina: 1 });
            return pagina.elementos.map((cliente) => ({ valor: String(cliente.id), etiqueta: cliente.razonSocial }));
          }}
          etiqueta="Cliente"
          id="clienteId"
          opciones={props.clientes.map((cliente) => ({ valor: String(cliente.id), etiqueta: cliente.razonSocial }))}
          textoVacio="Todos los clientes"
          valor={clienteId}
        />

        <Combobox
          alCambiar={(nuevo) => cambiar({ activoId: nuevo })}
          buscarOpciones={async (consulta) => {
            const pagina = await listarActivosPaginados({ buscar: consulta, clienteId, modeloMaquinaId: "", estado: "", pagina: 1 });
            return pagina.elementos.map((activo) => ({ valor: String(activo.id), etiqueta: nombreVisibleDeActivo(activo) }));
          }}
          etiqueta="Activo"
          id="activoId"
          opciones={activosDelCliente.map((activo) => ({ valor: String(activo.id), etiqueta: nombreVisibleDeActivo(activo) }))}
          textoVacio="Todos los activos"
          valor={activoId}
        />

        <div className="form-field">
          <label htmlFor="estado">Estado</label>
          <select id="estado" onChange={(evento) => cambiar({ estado: evento.target.value })} value={estado}>
            <option value="">Todos los estados</option>
            {estadosOrdenTrabajo.map((estadoOrden) => (
              <option key={estadoOrden} value={estadoOrden}>{obtenerEtiquetaEstadoOrdenTrabajo(estadoOrden)}</option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="tipo">Tipo de mantenimiento</label>
          <select id="tipo" onChange={(evento) => cambiar({ tipo: evento.target.value })} value={tipo}>
            <option value="">Todos los tipos</option>
            <option value="preventivo">Preventivo</option>
            <option value="correctivo">Correctivo</option>
          </select>
        </div>
        <div className="barra-filtros-acciones">
          <button className="secondary-button" onClick={() => limpiar(VACIOS)} type="button">
            Limpiar filtros
          </button>
          <span className="sr-only" role="status">
            {estaPendiente ? "Calculando indicadores…" : ""}
          </span>
        </div>
      </form>

      <section className="panel form-panel mb-6">
        <div className="panel-heading">
          <h2>Descarga de reportes</h2>
        </div>
        <p className="mb-4 mt-3 text-sm texto-tenue">
          Los reportes en PDF y CSV usan los criterios elegidos en los filtros de arriba, más la prioridad.
        </p>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="tipoReporte">Tipo de reporte</label>
            <select id="tipoReporte" onChange={(evento) => setTipoReporte(evento.target.value)} value={tipoReporte}>
              {tiposDeReporte.map((tipoDisponible) => (
                <option key={tipoDisponible.valor} value={tipoDisponible.valor}>{tipoDisponible.etiqueta}</option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="prioridadReporte">Prioridad</label>
            <select id="prioridadReporte" onChange={(evento) => setPrioridadReporte(evento.target.value)} value={prioridadReporte}>
              <option value="">Todas las prioridades</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>
        </div>
        <div className="form-actions">
          <a
            className="primary-button"
            href={obtenerUrlReportePdf(tipoReporte, filtrosParaReporte, prioridadReporte)}
            rel="noreferrer"
            target="_blank"
          >
            Descargar PDF
          </a>
          <a className="secondary-button" href={obtenerUrlReporteCsv(tipoReporte, filtrosParaReporte, prioridadReporte)} rel="noreferrer">
            Descargar CSV
          </a>
        </div>
      </section>

      <div aria-label="Secciones del tablero" className="pestanas" role="tablist">
        <button
          aria-controls="panel-resumen"
          aria-selected={pestanaActiva === "resumen"}
          className="pestana"
          id="pestana-resumen"
          onClick={() => setPestanaActiva("resumen")}
          role="tab"
          type="button"
        >
          Resumen
        </button>
        <button
          aria-controls="panel-analisis"
          aria-selected={pestanaActiva === "analisis"}
          className="pestana"
          id="pestana-analisis"
          onClick={() => setPestanaActiva("analisis")}
          role="tab"
          type="button"
        >
          Análisis y alertas
        </button>
      </div>

      <div aria-labelledby="pestana-resumen" hidden={pestanaActiva !== "resumen"} id="panel-resumen" role="tabpanel">
        {children}
      </div>
      <div aria-labelledby="pestana-analisis" hidden={pestanaActiva !== "analisis"} id="panel-analisis" role="tabpanel">
        {pestanaActiva === "analisis" ? <PanelAnalitica filtros={filtros} /> : null}
      </div>
    </>
  );
}
