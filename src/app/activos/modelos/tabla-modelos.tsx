"use client";

import Link from "next/link";
import { useState } from "react";
import { IconoLapiz, IconoOjo, IconoPapelera } from "@/componentes/iconos";
import { EstadoRegistro } from "@/componentes/listado/estado-registro";
import { useUltimoCreado } from "@/componentes/listado/ultimo-creado";
import { useCambioEstado } from "@/componentes/listado/use-cambio-estado";
import { ModalConfirmacion } from "@/componentes/modal-confirmacion";
import type { ModeloMaquina } from "@/tipos/modelo-maquina";
import { cambiarEstadoModeloMaquinaAccion } from "./acciones";

/** Tabla del listado: recibe los modelos ya cargados en el servidor y maneja la baja con confirmación. */
export function TablaModelos(props: { modelos: ModeloMaquina[] }) {
  const [modeloPendienteBaja, setModeloPendienteBaja] = useState<ModeloMaquina | null>(null);
  const { enProcesoId, error, ejecutar } = useCambioEstado(cambiarEstadoModeloMaquinaAccion, () => setModeloPendienteBaja(null));
  const nuevoId = useUltimoCreado("modelos-maquina");

  return (
    <>
      {error ? <p className="form-error-banner">{error}</p> : null}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {props.modelos.map((modelo) => {
              const estaOcupado = enProcesoId === modelo.id;
              return (
                <tr
                  aria-busy={estaOcupado || undefined}
                  className={[modelo.id === nuevoId ? "fila-nueva" : "", estaOcupado ? "opacity-60" : ""].join(" ").trim() || undefined}
                  key={modelo.id}
                >
                  <td><strong>{modelo.nombre}</strong></td>
                  <td>{modelo.nombreTipoMaquina ?? `Tipo ${modelo.tipoMaquinaId}`}</td>
                  <td>{modelo.descripcion}</td>
                  <td><EstadoRegistro estado={modelo.estado} /></td>
                  <td>
                    <div className="table-actions">
                      <Link aria-label="Ver detalle" className="boton-icono" href={"/activos/modelos/" + modelo.id} title="Ver detalle">
                        <IconoOjo />
                      </Link>
                      <Link
                        aria-label="Modificar modelo de máquina"
                        className="boton-icono"
                        href={"/activos/modelos/" + modelo.id + "/editar"}
                        title="Modificar modelo de máquina"
                      >
                        <IconoLapiz />
                      </Link>
                      {modelo.estado === "activo" ? (
                        <button
                          aria-label="Dar de baja"
                          className="boton-icono boton-icono-peligro"
                          disabled={estaOcupado}
                          onClick={() => setModeloPendienteBaja(modelo)}
                          title="Dar de baja"
                          type="button"
                        >
                          <IconoPapelera />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modeloPendienteBaja ? (
        <ModalConfirmacion
          descripcion={
            "¿Confirmás la baja de " +
            modeloPendienteBaja.nombre +
            "? El modelo no se elimina, pero ya no se podrá usar en activos nuevos."
          }
          estaConfirmando={enProcesoId === modeloPendienteBaja.id}
          etiquetaConfirmar="Dar de baja"
          onCancelar={() => setModeloPendienteBaja(null)}
          onConfirmar={() => ejecutar(modeloPendienteBaja.id, "inactivo")}
          titulo="Dar de baja modelo de máquina"
        />
      ) : null}
    </>
  );
}
