import { act } from "@testing-library/react";
import { vi } from "vitest";
import { RETARDO_BUSQUEDA_MS } from "@/componentes/listado/use-filtros-en-vivo";

/** Avanza el reloj simulado lo que espera la búsqueda por texto antes de navegar. Requiere `vi.useFakeTimers()`. */
export async function esperarRetardoDeBusqueda() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(RETARDO_BUSQUEDA_MS + 10);
  });
}
