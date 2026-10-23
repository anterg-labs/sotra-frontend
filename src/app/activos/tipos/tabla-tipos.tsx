"use client";

import { EncabezadoOrdenable } from "@/componentes/listado/encabezado-ordenable";
import { construirUrlTipos } from "./filtros";

import Link from "next/link";
import { useState } from "react";
import { IconoLapiz, IconoOjo, IconoPapelera } from "@/componentes/iconos";
import { EstadoRegistro } from "@/componentes/listado/estado-registro";
import { useUltimoCreado } from "@/componentes/listado/ultimo-creado";
import { useCambioEstado } from "@/componentes/listado/use-cambio-estado";
import { ModalConfirmacion } from "@/componentes/modal-confirmacion";
import { useTienePermiso } from "@/componentes/sesion/contexto-sesion";
import type { TipoMaquina, FiltrosTiposMaquina } from "@/tipos/tipo-maquina";
import { cambiarEstadoTipoMaquinaAccion } from "./acciones";

/** Tabla del listado: recibe los tipos ya cargados en el servidor y maneja la baja con confirmación. */
export function TablaTipos(props: { tipos: TipoMaquina[]; filtros?: FiltrosTiposMaquina }) {
  const { filtros } = props;
  const columna = (clave: string, etiqueta: string) => (
    <EncabezadoOrdenable
      columna={clave}
      construirUrl={(orden) => construirUrlTipos({ ...filtros, ...orden, pagina: 1 } as FiltrosTiposMaquina)}
      etiqueta={etiqueta}
      orden={filtros}
    />
  );
  const puedeGestionar = useTienePermiso("tipo_maquina.gestionar");
  const [tipoPendienteBaja, setTipoPendienteBaja] = useState<TipoMaquina | null>(null);
  const { enProcesoId, error, ejecutar } = useCambioEstado(cambiarEstadoTipoMaquinaAccion, () => setTipoPendienteBaja(null));
  const nuevoId = useUltimoCreado("tipos-maquina");

  return (
    <>
      {error ? <p className="form-error-banner">{error}</p> : null}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              {columna("nombre", "Nombre")}
              {columna("estado", "Estado")}
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {props.tipos.map((tipo) => {
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
                            onClick={() => setTipoPendienteBaja(tipo)}
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
      </div>

      {tipoPendienteBaja ? (
        <ModalConfirmacion
          descripcion={
            "¿Confirmás la baja de " +
            tipoPendienteBaja.nombre +
            "? El tipo no se elimina, pero ya no se podrá usar en modelos nuevos."
          }
          estaConfirmando={enProcesoId === tipoPendienteBaja.id}
          etiquetaConfirmar="Dar de baja"
          onCancelar={() => setTipoPendienteBaja(null)}
          onConfirmar={() => ejecutar(tipoPendienteBaja.id, "inactivo")}
          titulo="Dar de baja tipo de máquina"
        />
      ) : null}
    </>
  );
}
