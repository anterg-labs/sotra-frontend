"use client";

import { useState } from "react";
import { apiActualizarVisibilidadReporte } from "@/servicios/api/api-visibilidad-reportes";
import { CATALOGO_REPORTES } from "@/servicios/catalogo-elementos-reportes";
import type { VisibilidadReporte } from "@/tipos/visibilidad-reportes";

export function PanelVisibilidadReportes({ inicial }: { inicial: VisibilidadReporte[] }) {
  const [desactivados, cambiarDesactivados] = useState(() => new Set(inicial.filter(item => !item.visible).map(item => item.codigo)));
  const [guardando, cambiarGuardando] = useState(() => new Set<string>());
  const [guardandoTodos, cambiarGuardandoTodos] = useState(false);
  const [error, cambiarError] = useState("");
  const [mensaje, cambiarMensaje] = useState("");
  const categorias = [...new Set(CATALOGO_REPORTES.map(item => item.categoria))];
  const totalActivos = CATALOGO_REPORTES.filter(item => !desactivados.has(item.codigo)).length;
  const estaGuardando = guardandoTodos || guardando.size > 0;

  async function cambiar(codigo: string, visible: boolean) {
    cambiarError("");
    cambiarMensaje("");
    cambiarGuardando(actual => new Set(actual).add(codigo));
    try {
      await apiActualizarVisibilidadReporte(codigo, visible);
      cambiarDesactivados(actual => {
        const siguiente = new Set(actual);
        if (visible) siguiente.delete(codigo); else siguiente.add(codigo);
        return siguiente;
      });
      cambiarMensaje("Configuración guardada.");
    } catch (fallo) {
      cambiarError(fallo instanceof Error ? fallo.message : "No se pudo guardar el cambio.");
    } finally {
      cambiarGuardando(actual => {
        const siguiente = new Set(actual);
        siguiente.delete(codigo);
        return siguiente;
      });
    }
  }

  async function cambiarTodos(visible: boolean) {
    if (estaGuardando) return;
    const pendientes = CATALOGO_REPORTES.filter(item => !desactivados.has(item.codigo) !== visible);
    if (pendientes.length === 0) return;
    cambiarError("");
    cambiarMensaje("");
    cambiarGuardandoTodos(true);
    const guardados: string[] = [];
    const fallidos: string[] = [];
    let siguienteIndice = 0;

    async function guardarPendientes() {
      while (siguienteIndice < pendientes.length) {
        const item = pendientes[siguienteIndice++];
        try {
          await apiActualizarVisibilidadReporte(item.codigo, visible);
          guardados.push(item.codigo);
        } catch {
          fallidos.push(item.nombre);
        }
      }
    }

    await Promise.all(Array.from({ length: Math.min(4, pendientes.length) }, guardarPendientes));
    cambiarDesactivados(actual => {
      const siguiente = new Set(actual);
      for (const codigo of guardados) {
        if (visible) siguiente.delete(codigo); else siguiente.add(codigo);
      }
      return siguiente;
    });
    cambiarGuardandoTodos(false);
    if (fallidos.length > 0) {
      cambiarError(`No se pudieron guardar ${fallidos.length} opciones: ${fallidos.slice(0, 3).join(", ")}${fallidos.length > 3 ? "…" : ""}. Podés reintentar la acción.`);
    } else {
      cambiarMensaje(visible ? "Todos los elementos están activos." : "Todos los elementos están desactivados.");
    }
  }

  return <div className="reportes-configuracion">
    <div className="panel reportes-config-resumen">
      <div>
        <p className="reportes-config-resumen-titulo">Elementos visibles</p>
        <p className="reportes-config-resumen-cantidad"><strong>{totalActivos}</strong> de {CATALOGO_REPORTES.length}</p>
        <p className="texto-tenue">Cada cambio se guarda de forma permanente. Ocultar un elemento no elimina sus datos.</p>
      </div>
      <div className="reportes-config-acciones">
        <button className="secondary-button" disabled={estaGuardando || totalActivos === CATALOGO_REPORTES.length}
          onClick={() => void cambiarTodos(true)} type="button">Activar todos</button>
        <button className="secondary-button" disabled={estaGuardando || totalActivos === 0}
          onClick={() => void cambiarTodos(false)} type="button">Desactivar todos</button>
      </div>
    </div>
    {error && <p className="form-error-banner" role="alert">{error}</p>}
    {mensaje && <p className="sr-only" role="status">{mensaje}</p>}
    {guardandoTodos && <p className="reportes-config-guardando" role="status">Guardando configuración…</p>}
    {categorias.map(categoria => {
      const elementos = CATALOGO_REPORTES.filter(item => item.categoria === categoria);
      const activos = elementos.filter(item => !desactivados.has(item.codigo)).length;
      return <fieldset className="panel reportes-config-grupo" key={categoria}>
        <legend>{categoria} <span className="reportes-config-grupo-cuenta">{activos}/{elementos.length} activos</span></legend>
        <div className="reportes-config-opciones">
          {elementos.map(item => {
            const estaActivo = !desactivados.has(item.codigo);
            return <label className="reportes-config-opcion" data-activo={estaActivo} key={item.codigo}>
              <span className="reportes-config-opcion-nombre">{item.nombre}</span>
              <input checked={estaActivo} disabled={guardandoTodos || guardando.has(item.codigo)}
                onChange={evento => void cambiar(item.codigo, evento.target.checked)} role="switch" type="checkbox" />
            </label>;
          })}
        </div>
      </fieldset>;
    })}
  </div>;
}
