import versionDelFrontend from "../../version.json";
import { cleanup, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EstructuraAplicacion } from "./estructura-aplicacion";

const obtenerVersionSistema = vi.hoisted(() => vi.fn());

vi.mock("@/servicios/servicio-version", () => ({ obtenerVersionSistema }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/clientes",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("EstructuraAplicacion: versión del pie", () => {
  beforeEach(() => {
    cleanup();
    obtenerVersionSistema.mockReset();
  });

  it("muestra la versión que informa el backend", async () => {
    obtenerVersionSistema.mockResolvedValue("1.2.3");
    render(<EstructuraAplicacion>contenido</EstructuraAplicacion>);
    expect(await screen.findByText("Versión " + versionDelFrontend.version + " · API 1.2.3")).toBeInTheDocument();
  });

  it("indica que no está disponible si la consulta falla", async () => {
    obtenerVersionSistema.mockImplementation(async () => { throw new Error("fallo"); });
    render(<EstructuraAplicacion>contenido</EstructuraAplicacion>);
    expect(await screen.findByText("Versión " + versionDelFrontend.version + " · API no disponible")).toBeInTheDocument();
  });
});
