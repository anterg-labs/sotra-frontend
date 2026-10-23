"use client";

import Link from "next/link";
import { IconoLapiz, IconoOjo, IconoPapelera, IconoReactivar } from "@/componentes/iconos";
import { EncabezadoOrdenable } from "@/componentes/listado/encabezado-ordenable";
import { EstadoRegistro } from "@/componentes/listado/estado-registro";
import { useUltimoCreado } from "@/componentes/listado/ultimo-creado";
import { useCambioEstadoConfirmado } from "@/componentes/listado/use-cambio-estado-confirmado";
import type { TipoMaquina, FiltrosTiposMaquina } from "@/tipos/tipo-maquina";
import { useTienePermiso } from "@/componentes/sesion/contexto-sesion";
import { cambiarEstadoTipoMaquinaAccion } from "./acciones";
import { construirUrlTipos } from "./filtros";
import { ContenedorTabla } from "@/componentes/contenedor-tabla";
import { useFilasConOrdenInstantaneo } from "@/componentes/listado/orden-instantaneo";
import type { ValorOrdenable } from "@/componentes/listado/orden-local";

/** Cómo ordenar las filas que ya están en pantalla (misma clave que `ordenarPor` de la API). */
const VALORES_ORDEN = {
  nombre: (fila: TipoMaquina): ValorOrdenable => fila.nombre,
  estado: (fila: TipoMaquina): ValorOrdenable => fila.estado === "activo",
};

/** Tabla del listado: recibe los tipos ya cargados en el servidor y maneja la baja con confirmación. */
export function TablaTipos(props: { tipos: TipoMaquina[]; filtros: FiltrosTiposMaquina; unaSolaPagina?: boolean }) {
  const tipos = useFilasConOrdenInstantaneo(props.tipos, VALORES_ORDEN, props.unaSolaPagina ?? false);
  const puedeGestionar = useTienePermiso("tipo_maquina.gestionar");
  const { filtros } = props;
  const columna = (clave: string, etiqueta: string) => (
    <EncabezadoOrdenable
      columna={clave}
      construirUrl={(orden) => construirUrlTipos({ ...filtros, ...orden, pagina: 1 })}
      etiqueta={etiqueta}
      orden={filtros}
    />
  );
  const { enProcesoId, pedirBaja, pedirReactivacion, modales } = useCambioEstadoConfirmado<TipoMaquina>(cambiarEstadoTipoMaquinaAccion, {
    mensajeBaja: "Tipo de máquina dado de baja.",
    tituloBaja: "Dar de baja tipo de máquina",
    descripcionBaja: (tipo) => "¿Confirmás la baja de " + tipo.nombre + "? El tipo no se elimina, pero ya no se podrá usar en modelos nuevos.",
    reactivacion: {
      mensaje: "Tipo de máquina reactivado.",
      titulo: "Reactivar tipo de máquina",
      descripcion: (tipo) => "¿Confirmás la reactivación de " + tipo.nombre + "? El tipo volverá a poder usarse en modelos nuevos.",
    },
  });
  const nuevoId = useUltimoCreado("tipos-maquina");

  return (
    <>
      <ContenedorTabla etiqueta="Listado de tipos de máquina">
        <table>
          <thead>
            <tr>
              {columna("nombre", "Nombre")}
              {columna("estado", "Estado")}
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tipos.map((tipo) => {
              const estaOcupado = enProcesoId === tipo.id;
              return (
                <tr
                  aria-busy={estaOcupado || undefined}
                  className={[tipo.id === nuevoId ? "fila-nueva" : "", estaOcupado ? "opacity-60" : ""].join(" ").trim() || undefined}
                  key={tipo.id}
                >
                  <td><strong>{tipo.nombre}</strong></td>
                  <td><EstadoRegistro estado={tipo.estado} /></td>
                  <td>
                    <div className="table-actions">
                      <Link aria-label="Ver detalle" className="boton-icono" href={"/activos/tipos/" + tipo.id} title="Ver detalle">
                        <IconoOjo />
                      </Link>
                      {puedeGestionar ? (
                        <Link
                          aria-label="Modificar tipo de máquina"
                          className="boton-icono"
                          href={"/activos/tipos/" + tipo.id + "/editar"}
                          title="Modificar tipo de máquina"
                        >
                          <IconoLapiz />
                        </Link>
                      ) : null}
                      {tipo.estado === "activo" ? (
                        puedeGestionar ? (
                          <button
                            aria-label="Dar de baja"
                            className="boton-icono boton-icono-peligro"
                            disabled={estaOcupado}
                            onClick={() => pedirBaja(tipo)}
                            title="Dar de baja"
                            type="button"
                          >
                            <IconoPapelera />
                          </button>
                        ) : null
                      ) : puedeGestionar ? (
                        <button
                          aria-label="Reactivar tipo de máquina"
                          className="boton-icono"
                          disabled={estaOcupado}
                          onClick={() => pedirReactivacion(tipo)}
                          title="Reactivar tipo de máquina"
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
