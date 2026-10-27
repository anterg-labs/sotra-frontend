"use client";

import Link from "next/link";
import { avisarStockActualizado } from "@/hooks/use-alertas-stock";
import { IconoLapiz, IconoOjo, IconoPapelera, IconoReactivar } from "@/componentes/iconos";
import { BarraNivelStock, InsigniaStock } from "@/componentes/indicador-stock";
import { EncabezadoOrdenable } from "@/componentes/listado/encabezado-ordenable";
import { EstadoRegistro } from "@/componentes/listado/estado-registro";
import { useUltimoCreado } from "@/componentes/listado/ultimo-creado";
import { useCambioEstadoConfirmado } from "@/componentes/listado/use-cambio-estado-confirmado";
import type { Repuesto } from "@/tipos/repuesto";
import { cambiarEstadoRepuestoAccion } from "./acciones";
import { construirUrlRepuestos, type FiltrosUrlRepuestos } from "./filtros";
import { ContenedorTabla } from "@/componentes/contenedor-tabla";
import { useFilasConOrdenInstantaneo } from "@/componentes/listado/orden-instantaneo";
import type { ValorOrdenable } from "@/componentes/listado/orden-local";

/** Cómo ordenar las filas que ya están en pantalla (misma clave que `ordenarPor` de la API). */
const VALORES_ORDEN = {
  codigo: (fila: Repuesto): ValorOrdenable => fila.codigo,
  nombre: (fila: Repuesto): ValorOrdenable => fila.nombre,
  marca: (fila: Repuesto): ValorOrdenable => fila.marca,
  ubicacion: (fila: Repuesto): ValorOrdenable => fila.ubicacion,
  cantidad: (fila: Repuesto): ValorOrdenable => fila.cantidad,
  cantidadMinima: (fila: Repuesto): ValorOrdenable => fila.cantidadMinima,
  cantidadReservada: (fila: Repuesto): ValorOrdenable => fila.cantidadReservada,
  cantidadEntregada: (fila: Repuesto): ValorOrdenable => fila.cantidadEntregada,
  cantidadDisponible: (fila: Repuesto): ValorOrdenable => fila.cantidadDisponible,
  estado: (fila: Repuesto): ValorOrdenable => fila.estado === "activo",
};

/** Tabla del listado: recibe los repuestos ya cargados en el servidor y maneja baja y reactivación. */
export function TablaRepuestos(props: { repuestos: Repuesto[]; filtros: FiltrosUrlRepuestos; unaSolaPagina?: boolean }) {
  const repuestos = useFilasConOrdenInstantaneo(props.repuestos, VALORES_ORDEN, props.unaSolaPagina ?? false);
  const { filtros } = props;
  const columna = (clave: string, etiqueta: string) => (
    <EncabezadoOrdenable
      columna={clave}
      construirUrl={(orden) => construirUrlRepuestos({ ...filtros, ...orden, pagina: 1 })}
      etiqueta={etiqueta}
      orden={filtros}
    />
  );

  const { enProcesoId, pedirBaja, pedirReactivacion, modales } = useCambioEstadoConfirmado<Repuesto>(cambiarEstadoRepuestoAccion, {
    mensajeBaja: "Repuesto dado de baja.",
    tituloBaja: "Dar de baja repuesto",
    descripcionBaja: (repuesto) =>
      "¿Confirmás la baja de " + repuesto.nombre + "? El repuesto no se elimina, pero ya no se podrá asociar a nuevas órdenes de trabajo.",
    reactivacion: {
      mensaje: "Repuesto reactivado.",
      titulo: "Reactivar repuesto",
      descripcion: (repuesto) => "¿Confirmás la reactivación de " + repuesto.nombre + "? Volverá a poder asociarse a órdenes de trabajo.",
    },
    alExito: () => avisarStockActualizado(),
  });
  const nuevoId = useUltimoCreado("repuestos");

  return (
    <>
      <ContenedorTabla etiqueta="Listado de repuestos">
        <table>
          <thead>
            <tr>
              {columna("codigo", "Código")}
              {columna("nombre", "Nombre")}
              {columna("marca", "Marca")}
              {columna("ubicacion", "Ubicación")}
              {columna("cantidad", "Stock")}
              {columna("cantidadMinima", "Mínima")}
              {columna("cantidadReservada", "Reservado")}
              {columna("cantidadEntregada", "Entregado")}
              {columna("cantidadDisponible", "Disponible")}
              {columna("estado", "Estado")}
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {repuestos.map((repuesto) => {
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
                  <td className="celda-numerica">
                    <strong>{repuesto.cantidad}</strong>
                    {estaActivo ? (
                      <>
                        {" "}
                        <InsigniaStock estadoStock={repuesto.estadoStock} />
                        <BarraNivelStock cantidad={repuesto.cantidad} cantidadMinima={repuesto.cantidadMinima} estadoStock={repuesto.estadoStock} />
                      </>
                    ) : null}
                  </td>
                  <td className="celda-numerica">{repuesto.cantidadMinima}</td>
                  <td className="celda-numerica">{repuesto.cantidadReservada}</td>
                  <td className="celda-numerica">{repuesto.cantidadEntregada}</td>
                  <td className="celda-numerica">{repuesto.cantidadDisponible}</td>
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
                          onClick={() => pedirBaja(repuesto)}
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
                          onClick={() => pedirReactivacion(repuesto)}
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
      </ContenedorTabla>

      {modales}
    </>
  );
}
