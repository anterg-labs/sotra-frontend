"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo } from "react";
import { Modal } from "@/componentes/modal";

type ContextoModalDeRuta = { cerrar: () => void } | null;

const Contexto = createContext<ContextoModalDeRuta>(null);

/** Devuelve el cierre del modal de ruta que contiene al componente, o `null` si se muestra como página completa. */
export function useModalDeRuta() {
  return useContext(Contexto);
}

/**
 * Cómo sale un formulario: dentro de un modal de ruta vuelve a la pantalla desde la que se abrió (`router.back()`);
 * como página completa va a la ruta indicada.
 */
export function useSalidaDeFormulario() {
  const modal = useModalDeRuta();
  const enrutador = useRouter();
  return {
    estaEnModal: modal !== null,
    terminar: (ruta: string) => (modal ? modal.cerrar() : enrutador.push(ruta)),
  };
}

/** «Cancelar» de un formulario: cierra el modal si está en uno; si no, es un enlace a la ruta indicada. */
export function BotonCancelarFormulario(props: { href: string; alHacerClic?: () => void }) {
  const modal = useModalDeRuta();
  if (modal) {
    return (
      <button
        className="secondary-button"
        onClick={() => {
          props.alHacerClic?.();
          modal.cerrar();
        }}
        type="button"
      >
        Cancelar
      </button>
    );
  }
  return (
    <Link className="secondary-button" href={props.href} onClick={props.alHacerClic}>
      Cancelar
    </Link>
  );
}

type PropiedadesModalDeRuta = {
  titulo: string;
  descripcion?: string;
  tamano?: "normal" | "amplio";
  /**
   * Con la dirección abierta directamente (recarga o enlace) no hay pantalla anterior a la que volver: se indica la pantalla
   * de origen, que se muestra de fondo, y el modal se cierra yendo a ella.
   */
  rutaDeRetorno?: string;
  children: React.ReactNode;
};

/**
 * Modal de una ruta interceptada (alta o modificación abierta desde un listado o un detalle). La dirección es la misma
 * que la de la página completa: al recargar o abrirla directamente se ve la página; cerrar el modal vuelve atrás.
 */
export function ModalDeRuta(props: PropiedadesModalDeRuta) {
  const enrutador = useRouter();
  const { rutaDeRetorno } = props;
  const cerrar = useCallback(() => (rutaDeRetorno ? enrutador.replace(rutaDeRetorno) : enrutador.back()), [enrutador, rutaDeRetorno]);
  const valor = useMemo(() => ({ cerrar }), [cerrar]);
  const modal = (
    <Modal alCerrar={cerrar} descripcion={props.descripcion} estaAbierto tamano={props.tamano} titulo={props.titulo}>
      <div className="form-panel">{props.children}</div>
    </Modal>
  );

  // Con ruta de retorno los formularios se comportan como en una página (al guardar navegan a su destino).
  return rutaDeRetorno ? modal : <Contexto.Provider value={valor}>{modal}</Contexto.Provider>;
}

/** Marcador de posición del formulario mientras el servidor trae los datos del modal. */
export function EsqueletoFormulario() {
  return (
    <div aria-busy="true" aria-label="Cargando formulario" className="grid gap-4" role="status">
      <div className="form-grid">
        {Array.from({ length: 6 }, (_, campo) => (
          <span aria-hidden="true" className="block h-11 animate-pulse rounded bg-current opacity-10 motion-reduce:animate-none" key={campo} />
        ))}
      </div>
      <span aria-hidden="true" className="block h-24 animate-pulse rounded bg-current opacity-10 motion-reduce:animate-none" />
      <span className="sr-only">Cargando formulario…</span>
    </div>
  );
}
