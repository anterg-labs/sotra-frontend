"use client";

import { EncabezadoOrdenable } from "@/componentes/listado/encabezado-ordenable";
import { construirUrlActivos } from "./filtros";

import Link from "next/link";
import { useState } from "react";
import { IconoLapiz, IconoOjo, IconoPapelera } from "@/componentes/iconos";
import { EstadoRegistro } from "@/componentes/listado/estado-registro";
import { useUltimoCreado } from "@/componentes/listado/ultimo-creado";
import { useCambioEstado } from "@/componentes/listado/use-cambio-estado";
import { ModalConfirmacion } from "@/componentes/modal-confirmacion";
import { useTienePermiso } from "@/componentes/sesion/contexto-sesion";
import type { Activo, FiltrosActivos } from "@/tipos/activo";
import { cambiarEstadoActivoAccion } from "./acciones";

/** Tabla del listado: recibe los activos ya cargados en el servidor y maneja la baja con confirmación. */
export function TablaActivos(props: { activos: Activo[]; filtros?: FiltrosActivos }) {
  const { filtros } = props;
  const columna = (clave: string, etiqueta: string) => (
    <EncabezadoOrdenable
      columna={clave}
      construirUrl={(orden) => construirUrlActivos({ ...filtros, ...orden, pagina: 1 } as FiltrosActivos)}
      etiqueta={etiqueta}
      orden={filtros}
    />
  );
  const puedeGestionar = useTienePermiso("activo.editar");
  const [activoPendienteBaja, setActivoPendienteBaja] = useState<Activo | null>(null);
  const { enProcesoId, error, ejecutar } = useCambioEstado(cambiarEstadoActivoAccion, () => setActivoPendienteBaja(null));
  const nuevoId = useUltimoCreado("activos");

  return (
    <>
      {error ? <p className="form-error-banner">{error}</p> : null}
      <div className="table-container">
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
            {props.activos.map((activo) => {
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
                            onClick={() => setActivoPendienteBaja(activo)}
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

      {activoPendienteBaja ? (
        <ModalConfirmacion
          descripcion={
            "¿Confirmás la baja de " +
            (activoPendienteBaja.nombre ?? "el activo seleccionado") +
            "? El activo quedará inactivo, pero sus datos seguirán disponibles."
          }
          estaConfirmando={enProcesoId === activoPendienteBaja.id}
          etiquetaConfirmar="Dar de baja"
          onCancelar={() => setActivoPendienteBaja(null)}
          onConfirmar={() => ejecutar(activoPendienteBaja.id, "inactivo")}
          titulo="Dar de baja activo"
        />
      ) : null}
    </>
  );
}
