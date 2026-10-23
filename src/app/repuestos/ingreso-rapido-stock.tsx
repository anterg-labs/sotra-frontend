"use client";

import { useRef, useState } from "react";
import { useAvisos } from "@/componentes/avisos";
import { Combobox, type OpcionCombobox } from "@/componentes/combobox";
import { Modal } from "@/componentes/modal";
import { useFormularioAccion } from "@/componentes/use-formulario-accion";
import { avisarStockActualizado } from "@/hooks/use-alertas-stock";
import { listarRepuestosPaginados } from "@/servicios/servicio-repuestos";
import type { MovimientoStock } from "@/tipos/movimiento-stock";
import type { Repuesto } from "@/tipos/repuesto";
import { obtenerErroresIngresoStock } from "@/validaciones/movimiento-stock";
import { registrarIngresoStockAccion } from "./acciones";

type DatosIngresoRapido = { repuestoId: string; cantidad: number };

const IDS_CAMPOS: Record<string, string> = { repuestoId: "repuestoIngresoRapido", cantidad: "cantidadIngresoRapido" };

function etiquetaDelRepuesto(repuesto: Repuesto) {
  return `${repuesto.codigo} · ${repuesto.nombre} (stock: ${repuesto.cantidad})`;
}

/**
 * Ingreso directo de stock desde el listado: se elige el repuesto y la cantidad. La fecha la pone el sistema, el stock
 * se suma al existente y el movimiento queda en el historial del repuesto (el usuario se registrará con el inicio de sesión).
 */
export function IngresoRapidoStock() {
  const [estaAbierto, setEstaAbierto] = useState(false);
  const [repuestoId, setRepuestoId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const { mostrarAviso } = useAvisos();
  const repuestosVistos = useRef(new Map<string, Repuesto>());

  const { errores, errorGeneral, estaEnviando, enviar, referenciaErrorGeneral } = useFormularioAccion<DatosIngresoRapido, MovimientoStock>({
    validar: (datos) => ({
      ...(datos.repuestoId === "" ? { repuestoId: "Elegí el repuesto al que ingresa el stock." } : {}),
      ...obtenerErroresIngresoStock({ cantidad: datos.cantidad }),
    }),
    accion: (datos) => registrarIngresoStockAccion(Number(datos.repuestoId), { cantidad: datos.cantidad }),
    alExito: (movimiento) => {
      setEstaAbierto(false);
      setRepuestoId("");
      setCantidad("");
      mostrarAviso(
        "exito",
        `Ingresaron ${movimiento.cantidad} unidades de ${movimiento.nombreRepuesto}. Stock: ${movimiento.stockAnterior} → ${movimiento.stockPosterior}.`,
      );
      avisarStockActualizado();
    },
    mensajeGeneral: "No se pudo registrar el ingreso de stock.",
    idCampo: (campo) => IDS_CAMPOS[campo] ?? campo,
  });

  async function buscarRepuestos(consulta: string): Promise<OpcionCombobox[]> {
    const pagina = await listarRepuestosPaginados({
      buscar: consulta, estado: "activo", ubicacion: "", bajoStock: false, estadoStock: "", orden: "criticidad", pagina: 1,
    });
    for (const repuesto of pagina.elementos) repuestosVistos.current.set(String(repuesto.id), repuesto);
    return pagina.elementos.map((repuesto) => ({ valor: String(repuesto.id), etiqueta: etiquetaDelRepuesto(repuesto) }));
  }

  function abrir() {
    setRepuestoId("");
    setCantidad("");
    setEstaAbierto(true);
  }

  function confirmar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    enviar({ repuestoId, cantidad: cantidad.trim() === "" ? Number.NaN : Number(cantidad) });
  }

  return (
    <>
      <button className="primary-button" onClick={abrir} type="button">
        Ingresar stock
      </button>
      <Modal alCerrar={() => setEstaAbierto(false)} estaAbierto={estaAbierto} estaOcupado={estaEnviando} titulo="Ingresar stock">
        <form aria-busy={estaEnviando} className="form-panel" noValidate onSubmit={confirmar}>
          <div className="form-field">
            <Combobox
              alCambiar={setRepuestoId}
              buscarOpciones={buscarRepuestos}
              etiqueta="Repuesto"
              id={IDS_CAMPOS.repuestoId}
              idError={errores.repuestoId ? IDS_CAMPOS.repuestoId + "-error" : undefined}
              opciones={[]}
              requerido
              textoVacio="Buscá por código o nombre"
              tieneError={Boolean(errores.repuestoId)}
              valor={repuestoId}
            />
            {errores.repuestoId ? <p className="field-error" id={IDS_CAMPOS.repuestoId + "-error"} role="alert">{errores.repuestoId}</p> : null}
          </div>
          <div className="form-field">
            <label htmlFor={IDS_CAMPOS.cantidad}>Cantidad a ingresar</label>
            <input
              aria-describedby={errores.cantidad ? IDS_CAMPOS.cantidad + "-error" : IDS_CAMPOS.cantidad + "-ayuda"}
              aria-invalid={errores.cantidad ? true : undefined}
              id={IDS_CAMPOS.cantidad}
              inputMode="numeric"
              min={1}
              onChange={(evento) => setCantidad(evento.target.value)}
              required
              step={1}
              type="number"
              value={cantidad}
            />
            <p className="field-hint" id={IDS_CAMPOS.cantidad + "-ayuda"}>
              Se suma al stock existente. La fecha y la hora las registra el sistema.
            </p>
            {errores.cantidad ? <p className="field-error" id={IDS_CAMPOS.cantidad + "-error"} role="alert">{errores.cantidad}</p> : null}
          </div>
          {errorGeneral ? <p className="form-error-banner" ref={referenciaErrorGeneral} role="alert" tabIndex={-1}>{errorGeneral}</p> : null}
          <div className="form-actions">
            <button className="secondary-button" onClick={() => setEstaAbierto(false)} type="button">Cancelar</button>
            <button className="primary-button" disabled={estaEnviando} type="submit">
              {estaEnviando ? "Guardando…" : "Confirmar ingreso"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
