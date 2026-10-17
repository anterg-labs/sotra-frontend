"use client";

import Link from "next/link";
import { useState } from "react";
import { IconoLapiz, IconoOjo, IconoPapelera, IconoReactivar } from "@/componentes/iconos";
import { EstadoRegistro } from "@/componentes/listado/estado-registro";
import { useCambioEstado } from "@/componentes/listado/use-cambio-estado";
import { useUltimoCreado } from "@/componentes/listado/ultimo-creado";
import { ModalConfirmacion } from "@/componentes/modal-confirmacion";
import type { Cliente } from "@/tipos/cliente";
import { cambiarEstadoClienteAccion } from "./acciones";

/**
 * Tabla del listado: recibe los clientes ya cargados en el servidor y maneja baja y reactivación.
 * La fila queda marcada como en proceso de inmediato (actualización optimista); el estado nuevo aparece cuando el servidor lo confirma.
 */
export function TablaClientes(props: { clientes: Cliente[] }) {
  const { clientes } = props;
  const [clientePendienteBaja, setClientePendienteBaja] = useState<Cliente | null>(null);
  const { enProcesoId, error, ejecutar } = useCambioEstado(cambiarEstadoClienteAccion, () => setClientePendienteBaja(null));
  const nuevoId = useUltimoCreado("clientes");

  return (
    <>
      {error ? <p className="form-error-banner">{error}</p> : null}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Razón social</th>
              <th>Contacto</th>
              <th>Correo electrónico</th>
              <th>Teléfono</th>
              <th>Activos asociados</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente) => {
              const estaActivo = cliente.estado === "activo";
              const estaOcupado = enProcesoId === cliente.id;
              return (
                <tr
                  aria-busy={estaOcupado || undefined}
                  className={[cliente.id === nuevoId ? "fila-nueva" : "", estaOcupado ? "opacity-60" : ""].join(" ").trim() || undefined}
                  key={cliente.id}
                >
                  <td><strong>{cliente.razonSocial}</strong></td>
                  <td>{cliente.nombreContacto}</td>
                  <td>{cliente.correo}</td>
                  <td>{cliente.telefono}</td>
                  <td>{cliente.cantidadActivosAsociados}</td>
                  <td><EstadoRegistro estado={cliente.estado} /></td>
                  <td>
                    <div className="table-actions">
                      <Link aria-label="Ver detalle" className="boton-icono" href={"/clientes/" + cliente.id} title="Ver detalle">
                        <IconoOjo />
                      </Link>
                      {estaActivo ? (
                        <Link
                          aria-label="Modificar cliente"
                          className="boton-icono"
                          href={"/clientes/" + cliente.id + "/editar"}
                          title="Modificar cliente"
                        >
                          <IconoLapiz />
                        </Link>
                      ) : (
                        <button
                          aria-label="Reactivar cliente"
                          className="boton-icono"
                          disabled={estaOcupado}
                          onClick={() => ejecutar(cliente.id, "activo")}
                          title="Reactivar cliente"
                          type="button"
                        >
                          <IconoReactivar />
                        </button>
                      )}
                      {estaActivo ? (
                        <button
                          aria-label="Dar de baja"
                          className="boton-icono boton-icono-peligro"
                          disabled={estaOcupado}
                          onClick={() => setClientePendienteBaja(cliente)}
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

      {clientePendienteBaja ? (
        <ModalConfirmacion
          descripcion={
            "¿Confirmás la baja de " +
            clientePendienteBaja.razonSocial +
            "? El cliente quedará inactivo, pero sus datos seguirán disponibles."
          }
          estaConfirmando={enProcesoId === clientePendienteBaja.id}
          etiquetaConfirmar="Dar de baja"
          onCancelar={() => setClientePendienteBaja(null)}
          onConfirmar={() => ejecutar(clientePendienteBaja.id, "inactivo")}
          titulo="Dar de baja cliente"
        />
      ) : null}
    </>
  );
}
