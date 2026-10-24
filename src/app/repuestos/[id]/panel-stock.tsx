"use client";

import Link from "next/link";
import { useState } from "react";
import { EditorStockMinimo } from "@/componentes/editor-stock-minimo";
import { FormularioMovimientoStock } from "@/componentes/formulario-movimiento-stock";
import { BarraNivelStock, InsigniaStock } from "@/componentes/indicador-stock";
import { EstadoRegistro } from "@/componentes/listado/estado-registro";
import { useFormularioAccion } from "@/componentes/use-formulario-accion";
import { avisarStockActualizado } from "@/hooks/use-alertas-stock";
import type { IngresoStockInput, MovimientoStock } from "@/tipos/movimiento-stock";
import type { Repuesto } from "@/tipos/repuesto";
import { obtenerErroresIngresoStock } from "@/validaciones/movimiento-stock";
import { registrarIngresoStockAccion } from "../acciones";
import { AvisoEnLinea } from "@/componentes/aviso-en-linea";

const idsCamposIngreso: Record<string, string> = {
  cantidad: "cantidadIngreso",
};

/**
 * Datos del repuesto y operaciones de stock (ingreso, egreso, ajuste y stock mínimo). El repuesto y la tabla de
 * movimientos llegan del servidor; cada acción revalida la ruta y la pantalla se actualiza sola.
 */
export function PanelStock(props: { repuesto: Repuesto; abrirIngreso: boolean }) {
  const { repuesto } = props;
  const estaActivo = repuesto.estado === "activo";
  const [mostrarFormulario, setMostrarFormulario] = useState(props.abrirIngreso && estaActivo);
  const [accionStock, setAccionStock] = useState<"" | "egreso" | "ajuste">("");
  const [mensajeExito, setMensajeExito] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const { errores, errorGeneral, estaEnviando, enviar, referenciaErrorGeneral } = useFormularioAccion({
    validar: (datos: IngresoStockInput) => obtenerErroresIngresoStock(datos),
    accion: (datos: IngresoStockInput) => registrarIngresoStockAccion(repuesto.id, datos),
    alExito: () => {
      setCantidad("");
      setObservaciones("");
      setMostrarFormulario(false);
      setMensajeExito("Ingreso registrado correctamente. El stock se actualizó.");
      avisarStockActualizado();
    },
    mensajeGeneral: "No se pudo registrar el ingreso de stock.",
    idCampo: (campo) => idsCamposIngreso[campo] ?? campo,
  });

  function abrirFormulario() {
    setMostrarFormulario(true);
    setAccionStock("");
    setMensajeExito("");
  }

  function abrirAccionStock(accion: "egreso" | "ajuste") {
    setAccionStock(accion);
    setMostrarFormulario(false);
    setMensajeExito("");
  }

  function registrarMovimiento(movimiento: MovimientoStock) {
    setAccionStock("");
    setMensajeExito(
      movimiento.tipo === "egreso" ? "Egreso registrado correctamente. El stock se actualizó." : "Ajuste registrado correctamente. El stock se actualizó.",
    );
    avisarStockActualizado();
  }

  function confirmarIngreso(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    enviar({ cantidad: cantidad.trim() === "" ? Number.NaN : Number(cantidad), observaciones });
  }

  function campoConError(campo: string) {
    return {
      "aria-describedby": errores[campo] ? idsCamposIngreso[campo] + "-error" : undefined,
      "aria-invalid": errores[campo] ? true : undefined,
    };
  }

  function mensajeDeCampo(campo: string) {
    const mensaje = errores[campo];
    return mensaje ? <p className="field-error" id={idsCamposIngreso[campo] + "-error"} role="alert">{mensaje}</p> : null;
  }

  return (
    <section className="panel detail-panel">
      {estaActivo && repuesto.estadoStock !== "normal" ? (
        <p className={"aviso-stock mb-4 " + (repuesto.estadoStock === "sin_stock" ? "aviso-stock-critico" : "")} role="status">
          {repuesto.estadoStock === "sin_stock"
            ? "Sin stock: no quedan unidades disponibles de este repuesto."
            : "Stock bajo: la cantidad disponible es igual o menor al stock mínimo."}
        </p>
      ) : null}
      {mensajeExito ? <p className="mb-4 rounded-lg u-fondo-exito p-3 text-sm" role="status">{mensajeExito}</p> : null}
      <dl className="detail-list">
        <div>
          <dt>Código</dt>
          <dd>{repuesto.codigo}</dd>
        </div>
        <div>
          <dt>Nombre</dt>
          <dd>{repuesto.nombre}</dd>
        </div>
        <div>
          <dt>Marca</dt>
          <dd>{repuesto.marca}</dd>
        </div>
        <div className="detail-wide">
          <dt>Descripción</dt>
          <dd>{repuesto.descripcion}</dd>
        </div>
        <div>
          <dt>Ubicación</dt>
          <dd>{repuesto.ubicacion}</dd>
        </div>
        <div>
          <dt>Cantidad disponible</dt>
          <dd>
            <strong>{repuesto.cantidad}</strong>
            {estaActivo ? (
              <>
                {" "}
                <InsigniaStock estadoStock={repuesto.estadoStock} />
                <BarraNivelStock cantidad={repuesto.cantidad} cantidadMinima={repuesto.cantidadMinima} estadoStock={repuesto.estadoStock} />
              </>
            ) : null}
          </dd>
        </div>
        <div>
          <dt>Stock mínimo</dt>
          <dd>
            {estaActivo ? (
              <EditorStockMinimo
                alActualizar={() => {
                  setMensajeExito("Stock mínimo actualizado.");
                  avisarStockActualizado();
                }}
                cantidadMinima={repuesto.cantidadMinima}
                repuestoId={repuesto.id}
              />
            ) : (
              repuesto.cantidadMinima
            )}
          </dd>
        </div>
        <div>
          <dt>Estado</dt>
          <dd><EstadoRegistro estado={repuesto.estado} /></dd>
        </div>
      </dl>
      <div className="form-actions">
        <Link className="secondary-button" href={"/repuestos/" + repuesto.id + "/editar"}>
          Modificar
        </Link>
        {estaActivo && !mostrarFormulario ? (
          <button className="primary-button" onClick={abrirFormulario} type="button">
            Ingresar repuesto
          </button>
        ) : null}
        {estaActivo ? (
          <>
            <button className="secondary-button" disabled={repuesto.cantidad === 0} onClick={() => abrirAccionStock("egreso")} type="button">
              Registrar egreso
            </button>
            <button className="secondary-button" onClick={() => abrirAccionStock("ajuste")} type="button">
              Ajustar stock
            </button>
          </>
        ) : null}
      </div>

      {mostrarFormulario ? (
        <form aria-busy={estaEnviando} className="mt-4 rounded-lg border u-borde p-4" noValidate onSubmit={confirmarIngreso}>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="cantidadIngreso">Cantidad a ingresar</label>
              <input {...campoConError("cantidad")} id="cantidadIngreso" min={1} onChange={(evento) => setCantidad(evento.target.value)} required step={1} type="number" value={cantidad} />
              <p className="field-hint">La fecha y la hora las registra el sistema y el stock se suma al existente.</p>
              {mensajeDeCampo("cantidad")}
            </div>
          </div>
          <div className="form-field form-field-full">
            <label htmlFor="observacionesIngreso">Observaciones adicionales</label>
            <textarea id="observacionesIngreso" onChange={(evento) => setObservaciones(evento.target.value)} rows={2} value={observaciones} />
          </div>
          {errorGeneral ? <AvisoEnLinea ref={referenciaErrorGeneral}>{errorGeneral}</AvisoEnLinea> : null}
          <div className="form-actions">
            <button className="secondary-button" onClick={() => setMostrarFormulario(false)} type="button">
              Cancelar
            </button>
            <button className="primary-button" disabled={estaEnviando} type="submit">
              {estaEnviando ? "Guardando…" : "Confirmar ingreso"}
            </button>
          </div>
        </form>
      ) : null}

      {accionStock ? (
        <FormularioMovimientoStock
          alCancelar={() => setAccionStock("")}
          alRegistrar={registrarMovimiento}
          key={accionStock}
          repuestoId={repuesto.id}
          stockDisponible={repuesto.cantidad}
          tipo={accionStock}
        />
      ) : null}
    </section>
  );
}
