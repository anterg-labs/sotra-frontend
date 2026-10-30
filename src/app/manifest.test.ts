import { describe, expect, it } from "vitest";
import manifest from "./manifest";

describe("manifiesto de la PWA del técnico", () => {
  const datos = manifest();

  it("cumple lo que Chrome pide para ofrecer la instalación en Android", () => {
    expect(datos).toMatchObject({ display: "standalone", start_url: "/tecnico", scope: "/", id: "/tecnico" });
    expect(datos.name).toBeTruthy();
    expect(datos.short_name).toBeTruthy();
    const tamanos = datos.icons?.map((icono) => icono.sizes);
    expect(tamanos).toEqual(expect.arrayContaining(["192x192", "512x512"]));
  });

  it("incluye un icono adaptable (maskable) y el inicio dentro del alcance", () => {
    expect(datos.icons?.some((icono) => icono.purpose === "maskable")).toBe(true);
    expect(datos.start_url?.startsWith(datos.scope ?? "/")).toBe(true);
  });
});
