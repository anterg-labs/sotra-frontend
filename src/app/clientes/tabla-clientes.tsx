"use client";

import Link from "next/link";
import { IconoLapiz, IconoOjo, IconoPapelera, IconoReactivar } from "@/componentes/iconos";
import { EstadoRegistro } from "@/componentes/listado/estado-registro";
import { useCambioEstadoConfirmado } from "@/componentes/listado/use-cambio-estado-confirmado";
import { useUltimoCreado } from "@/componentes/listado/ultimo-creado";
import { EncabezadoOrdenable } from "@/componentes/listado/encabezado-ordenable";
import type { Cliente, FiltrosClientes } from "@/tipos/cliente";
import { useTienePermiso } from "@/componentes/sesion/contexto-sesion";
import { cambiarEstadoClienteAccion } from "./acciones";
import { construirUrlClientes } from "./filtros";
import { ContenedorTabla } from "@/componentes/contenedor-tabla";
import { useFilasConOrdenInstantaneo } from "@/componentes/listado/orden-instantaneo";
import type { ValorOrdenable } from "@/componentes/listado/orden-local";

/**
 * Tabla del listado: recibe los clientes ya cargados en el servidor y maneja baja y reactivación.
 * La fila queda marcada como en proceso de inmediato (actualización optimista); el estado nuevo aparece cuando el servidor lo confirma.
 */
/** Cómo ordenar las filas que ya están en pantalla (misma clave que `ordenarPor` de la API). */
const VALORES_ORDEN = {
  razonSocial: (fila: Cliente): ValorOrdenable => fila.razonSocial,
  nombreContacto: (fila: Cliente): ValorOrdenable => fila.nombreContacto,
  correo: (fila: Cliente): ValorOrdenable => fila.correo,
  telefono: (fila: Cliente): ValorOrdenable => fila.telefono,
  cantidadActivosAsociados: (fila: Cliente): ValorOrdenable => fila.cantidadActivosAsociados,
  cantidadOrdenesAsociadas: (fila: Cliente): ValorOrdenable => fila.cantidadOrdenesAsociadas,
  estado: (fila: Cliente): ValorOrdenable => fila.estado === "activo",
};

export function TablaClientes(props: { clientes: Cliente[]; filtros: FiltrosClientes; unaSolaPagina?: boolean }) {
  const puedeGestionar = useTienePermiso("cliente.gestionar");
  const { filtros } = props;
  const clientes = useFilasConOrdenInstantaneo(props.clientes, VALORES_ORDEN, props.unaSolaPagina ?? false);
  const columna = (clave: string, etiqueta: string) => (
    <EncabezadoOrdenable
      columna={clave}
      construirUrl={(orden) => construirUrlClientes({ ...filtros, ...orden, pagina: 1 })}
      etiqueta={etiqueta}
      orden={filtros}
    />
  );
  const { enProcesoId, pedirBaja, pedirReactivacion, modales } = useCambioEstadoConfirmado<Cliente>(cambiarEstadoClienteAccion, {
    mensajeBaja: "Cliente dado de baja.",
    tituloBaja: "Dar de baja cliente",
    descripcionBaja: (cliente) => "¿Confirmás la baja de " + cliente.razonSocial + "? El cliente quedará inactivo, pero sus datos seguirán disponibles.",
    reactivacion: {
      mensaje: "Cliente reactivado.",
      titulo: "Reactivar cliente",
      descripcion: (cliente) => "¿Confirmás la reactivación de " + cliente.razonSocial + "? El cliente volverá a estar activo.",
    },
  });
  const nuevoId = useUltimoCreado("clientes");

  return (
    <>
      <ul aria-label="Clientes" className="listado-tarjetas-tecnico">
        {clientes.map((cliente) => (
          <li key={cliente.id}>
            <Link className="tecnico-tarjeta tarjeta-listado-tecnico" href={"/clientes/" + cliente.id}>
              <span className="tarjeta-listado-cabecera"><strong>{cliente.razonSocial}</strong><EstadoRegistro estado={cliente.estado} /></span>
              <span className="tarjeta-listado-dato"><span>Contacto</span>{cliente.nombreContacto}</span>
              {cliente.correo ? <span className="tarjeta-listado-dato"><span>Correo</span>{cliente.correo}</span> : null}
              {cliente.telefono ? <span className="tarjeta-listado-dato"><span>Teléfono</span>{cliente.telefono}</span> : null}
              <span className="tarjeta-listado-dato"><span>Activos asociados</span>{cliente.cantidadActivosAsociados}</span>
              <span className="tarjeta-listado-ver">Ver detalle →</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="tabla-listado-tecnico">
      <ContenedorTabla etiqueta="Listado de clientes">
        <table>
          <thead>
            <tr>
              {columna("razonSocial", "Razón social")}
              {columna("nombreContacto", "Contacto")}
              {columna("correo", "Correo electrónico")}
              {columna("telefono", "Teléfono")}
              {columna("cantidadActivosAsociados", "Activos asociados")}
              {columna("cantidadOrdenesAsociadas", "Órdenes de trabajo")}
              {columna("estado", "Estado")}
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
                  <td className="celda-numerica">{cliente.cantidadActivosAsociados}</td>
                  <td className="celda-numerica">
                    {cliente.cantidadOrdenesAsociadas > 0 ? (
                      <Link
                        aria-label={"Ver las " + cliente.cantidadOrdenesAsociadas + " órdenes activas de " + cliente.razonSocial}
                        className="text-link"
                        href={"/ordenes-trabajo?clienteId=" + cliente.id + "&soloActivas=true"}
                      >
                        {cliente.cantidadOrdenesAsociadas}
                      </Link>
                    ) : (
                      0
                    )}
                  </td>
                  <td><EstadoRegistro estado={cliente.estado} /></td>
                  <td>
                    <div className="table-actions">
                      <Link aria-label="Ver detalle" className="boton-icono" href={"/clientes/" + cliente.id} title="Ver detalle">
                        <IconoOjo />
                      </Link>
                      {estaActivo ? (
                        puedeGestionar ? (
                          <Link
                            aria-label="Modificar cliente"
                            className="boton-icono"
                            href={"/clientes/" + cliente.id + "/editar"}
                            title="Modificar cliente"
                          >
                            <IconoLapiz />
                          </Link>
                        ) : null
                      ) : (
                        puedeGestionar ? (
                          <button
                            aria-label="Reactivar cliente"
                            className="boton-icono"
                            disabled={estaOcupado}
                            onClick={() => pedirReactivacion(cliente)}
                            title="Reactivar cliente"
                            type="button"
                          >
                            <IconoReactivar />
                          </button>
                        ) : null
                      )}
                      {estaActivo ? (
                        puedeGestionar ? (
                          <button
                            aria-label="Dar de baja"
                            className="boton-icono boton-icono-peligro"
                            disabled={estaOcupado}
                            onClick={() => pedirBaja(cliente)}
                            title="Dar de baja"
                            type="button"
                          >
                            <IconoPapelera />
                          </button>
                        ) : null
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ContenedorTabla>
      </div>

      {modales}
    </>
  );
}
