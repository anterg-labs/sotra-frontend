"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type TipoAviso = "exito" | "error" | "info";

type Aviso = {
  id: number;
  tipo: TipoAviso;
  texto: string;
};

type ContextoAvisos = {
  mostrarAviso: (tipo: TipoAviso, texto: string) => void;
};

const DURACION_MS = 5000;
const ContextoDeAvisos = createContext<ContextoAvisos>({ mostrarAviso: () => undefined });

export function ProveedorDeAvisos(props: { children: React.ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  const cerrarAviso = useCallback((id: number) => {
    setAvisos((actuales) => actuales.filter((aviso) => aviso.id !== id));
  }, []);

  const mostrarAviso = useCallback(
    (tipo: TipoAviso, texto: string) => {
      const id = Date.now() + Math.random();
      setAvisos((actuales) => [...actuales, { id, tipo, texto }]);
      window.setTimeout(() => cerrarAviso(id), DURACION_MS);
    },
    [cerrarAviso],
  );

  const valor = useMemo(() => ({ mostrarAviso }), [mostrarAviso]);

  return (
    <ContextoDeAvisos.Provider value={valor}>
      {props.children}
      <div aria-live="polite" className="avisos-contenedor" role="status">
        {avisos.map((aviso) => (
          <div className={"aviso aviso-" + aviso.tipo} key={aviso.id}>
            <span>{aviso.texto}</span>
            <button
              aria-label="Cerrar aviso"
              className="aviso-cerrar"
              onClick={() => cerrarAviso(aviso.id)}
              type="button"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ContextoDeAvisos.Provider>
  );
}

export function useAvisos() {
  return useContext(ContextoDeAvisos);
}
