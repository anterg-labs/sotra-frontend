"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Modal } from "@/componentes/modal";

const sinSuscripcion = () => () => undefined;

/** Ambos accesos se montan en el mismo lugar para conservar tamaño, tipografía y comportamiento. */
export function DialogoTerminos(props: { estaAbierto: boolean; alCerrar: () => void; obligatorio?: boolean; children: ReactNode }) {
  const esNavegador = useSyncExternalStore(sinSuscripcion, () => true, () => false);
  if (!esNavegador) return null;
  return createPortal(
    <Modal alCerrar={props.alCerrar} estaAbierto={props.estaAbierto} obligatorio={props.obligatorio} titulo="Términos y condiciones">
      {props.children}
    </Modal>, document.body,
  );
}

