"use client";

import Link from "next/link";
import { useState } from "react";
import { avisarStockActualizado } from "@/hooks/use-alertas-stock";
import { useAvisos } from "@/componentes/avisos";
import { IconoLapiz, IconoOjo, IconoPapelera, IconoReactivar } from "@/componentes/iconos";
import { BarraNivelStock, InsigniaStock } from "@/componentes/indicador-stock";
import { EstadoRegistro } from "@/componentes/listado/estado-registro";
import { useUltimoCreado } from "@/componentes/listado/ultimo-creado";
import { useCambioEstado } from "@/componentes/listado/use-cambio-estado";
import { ModalConfirmacion } from "@/componentes/modal-confirmacion";
import type { Repuesto } from "@/tipos/repuesto";
import { cambiarEstadoRepuestoAccion } from "./acciones";

/** Tabla del listado: recibe los repuestos ya cargados en el servidor y maneja baja y reactivación. */
export function TablaRepuestos(props: { repuestos: Repuesto[] }) {
  const { mostrarAviso } = useAvisos();
  const [repuestoPendienteBaja, setRepuestoPendienteBaja] = useState<Repuesto | null>(null);

  const { enProcesoId, error, ejecutar } = useCambioEstado(cambiarEstadoRepuestoAccion, (_id, estado) => {
    setRepuestoPendienteBaja(null);
    if (estado === "activo") mostrarAviso("exito", "Repuesto reactivado.");
    avisarStockActualizado();
  });
  const nuevoId = useUltimoCreado("repuestos");

  return (
    <>
      {error ? <p className="form-error-banner">{error}</p> : null}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Marca</th>
              <th>Ubicación</th>
              <th>Cantidad</th>
              <th>Mínima</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {props.repuestos.map((repuesto) => {
              const estaActivo = repuesto.estado === "activo";
              const estaOcupado = enProcesoId === repuesto.id;
              const clases = [
                repuesto.id === nuevoId ? "fila-nueva" : "",
                estaActivo && repuesto.estadoStock === "bajo" ? "fila-stock-bajo" : "",
                estaActivo && repuesto.estadoStock === "sin_stock" ? "fila-stock-sin-stock" : "",
                estaOcupado ? "opacity-60" : "",
              ].filter(Boolean).join(" ");
              return (
                <tr aria-busy={estaOcupado || undefined} className={clases || undefined} key={repuesto.id}>
                  <td><strong>{repuesto.codigo}</strong></td>
                  <td>{repuesto.nombre}</td>
                  <td>{repuesto.marca}</td>
                  <td>{repuesto.ubicacion}</td>
                  <td>
                    <strong>{repuesto.cantidad}</strong>
                    {estaActivo ? (
                      <>
                        {" "}
                        <InsigniaStock estadoStock={repuesto.estadoStock} />
                        <BarraNivelStock cantidad={repuesto.cantidad} cantidadMinima={repuesto.cantidadMinima} estadoStock={repuesto.estadoStock} />
                      </>
                    ) : null}
                  </td>
                  <td>{repuesto.cantidadMinima}</td>
                  <td><EstadoRegistro estado={repuesto.estado} /></td>
                  <td>
                    <div className="table-actions">
                      <Link aria-label="Ver detalle" className="boton-icono" href={"/repuestos/" + repuesto.id} title="Ver detalle">
                        <IconoOjo />
                      </Link>
                      <Link
                        aria-label="Modificar repuesto"
                        className="boton-icono"
                        href={"/repuestos/" + repuesto.id + "/editar"}
                        title="Modificar repuesto"
                      >
                        <IconoLapiz />
                      </Link>
                      {estaActivo ? (
                        <button
                          aria-label="Dar de baja"
                          className="boton-icono boton-icono-peligro"
                          disabled={estaOcupado}
                          onClick={() => setRepuestoPendienteBaja(repuesto)}
                          title="Dar de baja"
                          type="button"
                        >
                          <IconoPapelera />
                        </button>
                      ) : (
                        <button
                          aria-label="Reactivar repuesto"
                          className="boton-icono"
                          disabled={estaOcupado}
                          onClick={() => ejecutar(repuesto.id, "activo")}
                          title="Reactivar repuesto"
                          type="button"
                        >
                          <IconoReactivar />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {repuestoPendienteBaja ? (
        <ModalConfirmacion
          descripcion={
            "¿Confirmás la baja de " +
            repuestoPendienteBaja.nombre +
            "? El repuesto no se elimina, pero ya no se podrá asociar a nuevas órdenes de trabajo."
          }
          estaConfirmando={enProcesoId === repuestoPendienteBaja.id}
          etiquetaConfirmar="Dar de baja"
          onCancelar={() => setRepuestoPendienteBaja(null)}
          onConfirmar={() => ejecutar(repuestoPendienteBaja.id, "inactivo")}
          titulo="Dar de baja repuesto"
        />
      ) : null}
    </>
  );
}
