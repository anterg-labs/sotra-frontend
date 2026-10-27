"use client";

import Link from "next/link";
import { IconoLapiz, IconoOjo, IconoPapelera, IconoReactivar } from "@/componentes/iconos";
import { EncabezadoOrdenable } from "@/componentes/listado/encabezado-ordenable";
import { EstadoRegistro } from "@/componentes/listado/estado-registro";
import { useUltimoCreado } from "@/componentes/listado/ultimo-creado";
import { useCambioEstadoConfirmado } from "@/componentes/listado/use-cambio-estado-confirmado";
import type { Activo, FiltrosActivos } from "@/tipos/activo";
import { useTienePermiso } from "@/componentes/sesion/contexto-sesion";
import { cambiarEstadoActivoAccion } from "./acciones";
import { construirUrlActivos } from "./filtros";
import { ContenedorTabla } from "@/componentes/contenedor-tabla";
import { useFilasConOrdenInstantaneo } from "@/componentes/listado/orden-instantaneo";
import type { ValorOrdenable } from "@/componentes/listado/orden-local";

/** Cómo ordenar las filas que ya están en pantalla (misma clave que `ordenarPor` de la API). */
const VALORES_ORDEN = {
  nombre: (fila: Activo): ValorOrdenable => fila.nombre,
  numSerie: (fila: Activo): ValorOrdenable => fila.numSerie,
  nombreCliente: (fila: Activo): ValorOrdenable => fila.nombreCliente ?? null,
  nombreModeloMaquina: (fila: Activo): ValorOrdenable => fila.nombreModeloMaquina ?? null,
  estado: (fila: Activo): ValorOrdenable => fila.estado === "activo",
};

/** Tabla del listado: recibe los activos ya cargados en el servidor y maneja la baja con confirmación. */
export function TablaActivos(props: { activos: Activo[]; filtros: FiltrosActivos; unaSolaPagina?: boolean }) {
  const activos = useFilasConOrdenInstantaneo(props.activos, VALORES_ORDEN, props.unaSolaPagina ?? false);
  const puedeGestionar = useTienePermiso("activo.editar");
  const { filtros } = props;
  const columna = (clave: string, etiqueta: string) => (
    <EncabezadoOrdenable
      columna={clave}
      construirUrl={(orden) => construirUrlActivos({ ...filtros, ...orden, pagina: 1 })}
      etiqueta={etiqueta}
      orden={filtros}
    />
  );
  const { enProcesoId, pedirBaja, pedirReactivacion, modales } = useCambioEstadoConfirmado<Activo>(cambiarEstadoActivoAccion, {
    mensajeBaja: "Activo dado de baja.",
    tituloBaja: "Dar de baja activo",
    descripcionBaja: (activo) =>
      "¿Confirmás la baja de " + (activo.nombre ?? "el activo seleccionado") + "? El activo quedará inactivo, pero sus datos seguirán disponibles.",
    reactivacion: {
      mensaje: "Activo reactivado.",
      titulo: "Reactivar activo",
      descripcion: (activo) =>
        "¿Confirmás la reactivación de " + (activo.nombre ?? "el activo seleccionado") + "? El activo volverá a estar activo.",
    },
  });
  const nuevoId = useUltimoCreado("activos");

  return (
    <>
      <ContenedorTabla etiqueta="Listado de activos">
        <table>
          <thead>
            <tr>
              {columna("nombre", "Nombre")}
              {columna("numSerie", "Número de serie")}
              {columna("nombreCliente", "Cliente")}
              {columna("nombreModeloMaquina", "Modelo")}
              {columna("estado", "Estado")}
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {activos.map((activo) => {
              const estaOcupado = enProcesoId === activo.id;
              return (
                <tr
                  aria-busy={estaOcupado || undefined}
                  className={[activo.id === nuevoId ? "fila-nueva" : "", estaOcupado ? "opacity-60" : ""].join(" ").trim() || undefined}
                  key={activo.id}
                >
                  <td><strong>{activo.nombre ?? "Sin nombre"}</strong></td>
                  <td>{activo.numSerie}</td>
                  <td>{activo.nombreCliente ?? `Cliente ${activo.clienteId}`}</td>
                  <td>{activo.nombreModeloMaquina ?? `Modelo ${activo.modeloMaquinaId}`}</td>
                  <td><EstadoRegistro estado={activo.estado} /></td>
                  <td>
                    <div className="table-actions">
                      <Link aria-label="Ver detalle" className="boton-icono" href={"/activos/" + activo.id} title="Ver detalle">
                        <IconoOjo />
                      </Link>
                      {puedeGestionar ? (
                        <Link
                          aria-label="Modificar activo"
                          className="boton-icono"
                          href={"/activos/" + activo.id + "/editar"}
                          title="Modificar activo"
                        >
                          <IconoLapiz />
                        </Link>
                      ) : null}
                      {activo.estado === "activo" ? (
                        puedeGestionar ? (
                          <button
                            aria-label="Dar de baja"
                            className="boton-icono boton-icono-peligro"
                            disabled={estaOcupado}
                            onClick={() => pedirBaja(activo)}
                            title="Dar de baja"
                            type="button"
                          >
                            <IconoPapelera />
                          </button>
                        ) : null
                      ) : puedeGestionar ? (
                        <button
                          aria-label="Reactivar activo"
                          className="boton-icono"
                          disabled={estaOcupado}
                          onClick={() => pedirReactivacion(activo)}
                          title="Reactivar activo"
                          type="button"
                        >
                          <IconoReactivar />
                        </button>
                      ) : null}
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
