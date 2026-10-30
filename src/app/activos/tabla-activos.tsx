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
  nombreTipoMaquina: (fila: Activo): ValorOrdenable => fila.nombreTipoMaquina ?? null,
  ubicacion: (fila: Activo): ValorOrdenable => fila.ubicacion ?? null,
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
      <ul aria-label="Activos" className="listado-tarjetas-tecnico">
        {activos.map((activo) => (
          <li key={activo.id}>
            <Link className="tecnico-tarjeta tarjeta-listado-tecnico" href={"/activos/" + activo.id}>
              <span className="tarjeta-listado-cabecera"><strong>{activo.nombre ?? activo.numSerie}</strong><EstadoRegistro estado={activo.estado} /></span>
              <span className="tarjeta-listado-dato"><span>Número de serie</span>{activo.numSerie}</span>
              <span className="tarjeta-listado-dato"><span>Cliente</span>{activo.nombreCliente ?? `Cliente ${activo.clienteId}`}</span>
              <span className="tarjeta-listado-dato"><span>Tipo de máquina</span>{activo.nombreTipoMaquina ?? "—"}</span>
              <span className="tarjeta-listado-dato"><span>Modelo</span>{activo.nombreModeloMaquina ?? `Modelo ${activo.modeloMaquinaId}`}</span>
              <span className="tarjeta-listado-dato"><span>Ubicación</span>{activo.ubicacion ?? "—"}</span>
              <span className="tarjeta-listado-ver">Ver detalle →</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="tabla-listado-tecnico">
      <ContenedorTabla etiqueta="Listado de activos">
        <table>
          <thead>
            <tr>
              {columna("nombre", "Nombre")}
              {columna("numSerie", "Número de serie")}
              {columna("nombreCliente", "Cliente")}
              {columna("nombreTipoMaquina", "Tipo de máquina")}
              {columna("nombreModeloMaquina", "Modelo")}
              {columna("ubicacion", "Ubicación")}
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
                  <td>{activo.nombreTipoMaquina ?? "—"}</td>
                  <td>{activo.nombreModeloMaquina ?? `Modelo ${activo.modeloMaquinaId}`}</td>
                  <td>{activo.ubicacion ?? "—"}</td>
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
      </div>

      {modales}
    </>
  );
}
