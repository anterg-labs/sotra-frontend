"use client";

import { useEffect, useState } from "react";
import { obtenerIndicadores } from "@/servicios/servicio-reportes";
import type { CantidadPorGrupo, Indicadores } from "@/tipos/reporte";

export default function PaginaReportes() {
  const [indicadores, setIndicadores] = useState<Indicadores | null>(null);
  const [errorCarga, setErrorCarga] = useState("");

  useEffect(() => {
    async function cargarIndicadores() {
      setIndicadores(null);
      setErrorCarga("");

      try {
        const indicadoresObtenidos = await obtenerIndicadores();
        setIndicadores(indicadoresObtenidos);
      } catch {
        setErrorCarga("No se pudieron obtener los indicadores.");
      }
    }

    cargarIndicadores();
  }, []);

  function dibujarTablaGrupos(titulo: string, columna: string, grupos: CantidadPorGrupo[]) {
    let contenido = <p className="empty-state">No hay datos registrados.</p>;
    if (grupos.length > 0) {
      contenido = (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>{columna}</th>
                <th>Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {grupos.map((grupo) => (
                <tr key={grupo.nombre}>
                  <td>{grupo.nombre}</td>
                  <td>{grupo.cantidad}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <section className="panel">
        <div className="panel-heading">
          <h2>{titulo}</h2>
        </div>
        {contenido}
      </section>
    );
  }

  let mensajeError = null;
  if (errorCarga) {
    mensajeError = <p className="form-error-banner">{errorCarga}</p>;
  }

  let mensajeCargando = null;
  if (indicadores === null && !errorCarga) {
    mensajeCargando = <p className="empty-state">Cargando indicadores…</p>;
  }

  let contenidoIndicadores = null;
  if (indicadores !== null) {
    let tablaRepuestos = <p className="empty-state">No hay repuestos con bajo stock.</p>;
    if (indicadores.repuestosBajoStock.length > 0) {
      tablaRepuestos = (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Cantidad</th>
                <th>Mínima</th>
              </tr>
            </thead>
            <tbody>
              {indicadores.repuestosBajoStock.map((repuesto) => (
                <tr key={repuesto.id}>
                  <td><strong>{repuesto.codigo}</strong></td>
                  <td>{repuesto.nombre}</td>
                  <td>{repuesto.cantidad}</td>
                  <td>{repuesto.cantidadMinima}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    contenidoIndicadores = (
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel p-6">
          <h2>Órdenes de trabajo registradas</h2>
          <p className="mt-2 text-4xl font-bold">{indicadores.totalOrdenes}</p>
        </section>
        {dibujarTablaGrupos("Órdenes por estado", "Estado", indicadores.ordenesPorEstado)}
        {dibujarTablaGrupos("Órdenes por prioridad", "Prioridad", indicadores.ordenesPorPrioridad)}
        {dibujarTablaGrupos("Órdenes por tipo de mantenimiento", "Tipo", indicadores.ordenesPorTipo)}
        {dibujarTablaGrupos("Órdenes asignadas por técnico", "Técnico", indicadores.ordenesPorTecnico)}
        {dibujarTablaGrupos("Activos con más intervenciones", "Activo", indicadores.activosConMasIntervenciones)}
        <section className="panel">
          <div className="panel-heading">
            <h2>Repuestos con bajo stock</h2>
          </div>
          {tablaRepuestos}
        </section>
      </div>
    );
  }

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <h1>Reportes e indicadores</h1>
        </div>
      </header>

      {mensajeError}
      {mensajeCargando}
      {contenidoIndicadores}
    </main>
  );
}
