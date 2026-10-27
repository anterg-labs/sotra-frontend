"use client";

import Link from "next/link";
import { IconoLapiz, IconoOjo, IconoPapelera, IconoReactivar } from "@/componentes/iconos";
import { EncabezadoOrdenable } from "@/componentes/listado/encabezado-ordenable";
import { EstadoRegistro } from "@/componentes/listado/estado-registro";
import { useUltimoCreado } from "@/componentes/listado/ultimo-creado";
import { useCambioEstadoConfirmado } from "@/componentes/listado/use-cambio-estado-confirmado";
import type { ModeloMaquina, FiltrosModelosMaquina } from "@/tipos/modelo-maquina";
import { useTienePermiso } from "@/componentes/sesion/contexto-sesion";
import { cambiarEstadoModeloMaquinaAccion } from "./acciones";
import { construirUrlModelos } from "./filtros";
import { ContenedorTabla } from "@/componentes/contenedor-tabla";
import { useFilasConOrdenInstantaneo } from "@/componentes/listado/orden-instantaneo";
import type { ValorOrdenable } from "@/componentes/listado/orden-local";

/** Cómo ordenar las filas que ya están en pantalla (misma clave que `ordenarPor` de la API). */
const VALORES_ORDEN = {
  nombre: (fila: ModeloMaquina): ValorOrdenable => fila.nombre,
  nombreTipoMaquina: (fila: ModeloMaquina): ValorOrdenable => fila.nombreTipoMaquina ?? null,
  descripcion: (fila: ModeloMaquina): ValorOrdenable => fila.descripcion,
  estado: (fila: ModeloMaquina): ValorOrdenable => fila.estado === "activo",
};

/** Tabla del listado: recibe los modelos ya cargados en el servidor y maneja la baja con confirmación. */
export function TablaModelos(props: { modelos: ModeloMaquina[]; filtros: FiltrosModelosMaquina; unaSolaPagina?: boolean }) {
  const modelos = useFilasConOrdenInstantaneo(props.modelos, VALORES_ORDEN, props.unaSolaPagina ?? false);
  const puedeGestionar = useTienePermiso("modelo.editar");
  const { filtros } = props;
  const columna = (clave: string, etiqueta: string) => (
    <EncabezadoOrdenable
      columna={clave}
      construirUrl={(orden) => construirUrlModelos({ ...filtros, ...orden, pagina: 1 })}
      etiqueta={etiqueta}
      orden={filtros}
    />
  );
  const { enProcesoId, pedirBaja, pedirReactivacion, modales } = useCambioEstadoConfirmado<ModeloMaquina>(cambiarEstadoModeloMaquinaAccion, {
    mensajeBaja: "Modelo de máquina dado de baja.",
    tituloBaja: "Dar de baja modelo de máquina",
    descripcionBaja: (modelo) => "¿Confirmás la baja de " + modelo.nombre + "? El modelo no se elimina, pero ya no se podrá usar en activos nuevos.",
    reactivacion: {
      mensaje: "Modelo de máquina reactivado.",
      titulo: "Reactivar modelo de máquina",
      descripcion: (modelo) => "¿Confirmás la reactivación de " + modelo.nombre + "? El modelo volverá a poder usarse en activos nuevos.",
    },
  });
  const nuevoId = useUltimoCreado("modelos-maquina");

  return (
    <>
      <ContenedorTabla etiqueta="Listado de modelos de máquina">
        <table>
          <thead>
            <tr>
              {columna("nombre", "Nombre")}
              {columna("nombreTipoMaquina", "Tipo")}
              {columna("descripcion", "Descripción")}
              {columna("estado", "Estado")}
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {modelos.map((modelo) => {
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
                      {puedeGestionar ? (
                        <Link
                          aria-label="Modificar modelo de máquina"
                          className="boton-icono"
                          href={"/activos/modelos/" + modelo.id + "/editar"}
                          title="Modificar modelo de máquina"
                        >
                          <IconoLapiz />
                        </Link>
                      ) : null}
                      {modelo.estado === "activo" ? (
                        puedeGestionar ? (
                          <button
                            aria-label="Dar de baja"
                            className="boton-icono boton-icono-peligro"
                            disabled={estaOcupado}
                            onClick={() => pedirBaja(modelo)}
                            title="Dar de baja"
                            type="button"
                          >
                            <IconoPapelera />
                          </button>
                        ) : null
                      ) : puedeGestionar ? (
                        <button
                          aria-label="Reactivar modelo de máquina"
                          className="boton-icono"
                          disabled={estaOcupado}
                          onClick={() => pedirReactivacion(modelo)}
                          title="Reactivar modelo de máquina"
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
