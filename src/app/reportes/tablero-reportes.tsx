"use client";

import { useState } from "react";
import { Combobox } from "@/componentes/combobox";
import { FiltroFecha, rangoDeFechasInvalido } from "@/componentes/filtro-fecha";
import { useFiltrosEnVivo } from "@/componentes/listado/use-filtros-en-vivo";
import { PanelAnalitica } from "@/componentes/panel-analitica";
import { listarActivosPaginados } from "@/servicios/servicio-activos";
import { listarClientesPaginados } from "@/servicios/servicio-clientes";
import { obtenerUrlReporteCsv, obtenerUrlReportePdf, tiposDeReporte } from "@/servicios/servicio-reportes";
import type { Activo } from "@/tipos/activo";
import type { Cliente } from "@/tipos/cliente";
import { useEstadosOrden } from "@/componentes/estados-orden";
import type { FiltrosIndicadores } from "@/tipos/reporte";
import { construirUrlReportes } from "./filtros";
import { SeccionAnalisisAvanzado } from "./seccion-analisis-avanzado";
import { SeccionMaquinaria } from "./seccion-maquinaria";
import { SeccionPlegable } from "./seccion-plegable";
import { SeccionProceso } from "./seccion-proceso";

const VACIOS: FiltrosIndicadores = { fechaDesde: "", fechaHasta: "", clienteId: "", activoId: "", estado: "", tipo: "" };

function nombreVisibleDeActivo(activo: Activo) {
  return activo.nombre !== null && activo.nombre.trim() !== "" ? activo.nombre : activo.numSerie;
}

type PropiedadesTablero = {
  /** Filtros aplicados (los de la URL): el resumen y el análisis se calculan con ellos. */
  filtros: FiltrosIndicadores;
  clientes: Cliente[];
  activos: Activo[];
  /** Tarjetas de indicadores clave (renderizadas en el servidor). */
  kpis: React.ReactNode;
  /** Franja de avisos de ineficiencia (renderizada en el servidor). */
  avisos: React.ReactNode;
  /** Resumen de indicadores renderizado en el servidor. */
  children: React.ReactNode;
};

/**
 * Tablero de reportes: los filtros viven en la URL, el resumen llega renderizado del servidor, y las descargas PDF/CSV
 * y la pestaña de análisis (que se pide al abrirla) siguen siendo del navegador.
 */
export function TableroReportes(props: PropiedadesTablero) {
  const estados = useEstadosOrden();
  const { filtros, children } = props;
  const { valores, cambiar, aplicarAhora, limpiar, estaPendiente } = useFiltrosEnVivo<FiltrosIndicadores>({
    inicial: filtros,
    construirUrl: construirUrlReportes,
    sonValidos: (v) => !rangoDeFechasInvalido(v.fechaDesde, v.fechaHasta),
    alInvalido: () => document.getElementById("fechaReporte")?.focus(),
  });
  const { fechaDesde, fechaHasta, clienteId, activoId, estado, tipo } = valores;
  const [tipoReporte, setTipoReporte] = useState("ordenes-trabajo");
  const [prioridadReporte, setPrioridadReporte] = useState("");

  const activosDelCliente = props.activos.filter((activo) => clienteId === "" || String(activo.clienteId) === clienteId);
  const filtrosParaReporte: FiltrosIndicadores = valores;

  return (
    <>
      <form
        aria-busy={estaPendiente}
        aria-label="Filtros"
        className="barra-filtros barra-filtros-reportes"
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
            {estados.map((estado) => (
              <option key={estado.valor} value={estado.valor}>{estado.etiqueta}</option>
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

      <details className="panel-descarga-plegable mb-6">
        <summary className="panel-descarga-resumen">
          <span>Descargar PDF o CSV</span>
        </summary>
        <div className="panel panel-descarga mt-2">
        <div className="panel-descarga-campos">
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
        <div className="panel-descarga-acciones">
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
      </div>
      </details>

      {props.kpis}
      {props.avisos}

      <SeccionPlegable abiertaInicial id="resumen" resumen="Totales, estados, prioridades, activos con más intervenciones y repuestos con bajo stock." titulo="Resumen general">
        {children}
      </SeccionPlegable>
      <SeccionPlegable id="alertas" resumen="Alertas de maquinaria, desempeño operativo, tiempos, repuestos más usados y reincidencias." titulo="Alertas y desempeño operativo">
        <PanelAnalitica filtros={filtros} />
      </SeccionPlegable>
      <SeccionPlegable id="maquinaria" resumen="Qué máquinas concentran la parada, cuánto tardan en repararse y cuánto del trabajo es preventivo." titulo="Maquinaria">
        <SeccionMaquinaria filtros={filtros} />
      </SeccionPlegable>
      <SeccionPlegable id="proceso" resumen="Si el trabajo se acumula, cuánto llevan abiertas las órdenes, el cumplimiento de fechas y las demoras por motivo." titulo="Proceso">
        <SeccionProceso filtros={filtros} />
      </SeccionPlegable>
      <SeccionPlegable id="analisis-avanzado" resumen="Comparación de períodos y desgaste por intervalos, edad y uso." titulo="Análisis avanzado">
        <SeccionAnalisisAvanzado filtros={filtros} />
      </SeccionPlegable>
    </>
  );
}
