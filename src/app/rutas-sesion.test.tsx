import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { leerTokensSesion } from "@/servicios/servidor/token-acceso";
import { GET as iniciarSesion } from "./login/route";
import PaginaErrorInicioSesion from "./login/error/page";
import { obtenerTokenAcceso } from "@/servicios/servidor/token-acceso";
import { render, screen } from "@testing-library/react";
import { POST as cerrarSesion } from "./logout/route";

const auth = vi.hoisted(() => ({ signIn: vi.fn(), signOut: vi.fn() }));
vi.mock("@/auth", () => auth);
const redirect = vi.hoisted(() => vi.fn((destino: string) => { throw Object.assign(new Error("NEXT_REDIRECT"), { destino }); }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("next/image", () => ({ default: (p: { alt: string }) => <span aria-label={p.alt} role="img" /> }));

beforeEach(() => {
  vi.stubEnv("KEYCLOAK_EMISOR", "http://localhost:9080/realms/sotra");
  vi.stubEnv("KEYCLOAK_CLIENTE", "sotra-frontend");
  auth.signIn.mockReset();
  auth.signOut.mockReset();
});

afterEach(() => vi.unstubAllEnvs());

describe("/login", () => {
  it("inicia sesión con Keycloak y vuelve a la página pedida", async () => {
    await iniciarSesion(new NextRequest("http://localhost/login?destino=%2Fclientes%3Fbuscar%3Dx"));
    expect(auth.signIn).toHaveBeenCalledWith("keycloak", { redirectTo: "/clientes?buscar=x" });
  });

  it.each(["https://otro.sitio/robar", "//otro.sitio", "/\\otro.sitio", ""])("no vuelve a destinos externos: %j", async (destino) => {
    await iniciarSesion(new NextRequest("http://localhost/login?destino=" + encodeURIComponent(destino)));
    expect(auth.signIn).toHaveBeenCalledWith("keycloak", { redirectTo: "/" });
  });
});

describe("/logout", () => {
  it("borra la sesión de SOTRA y termina la de Keycloak con id_token_hint, volviendo al inicio", async () => {
    vi.mocked(leerTokensSesion).mockResolvedValueOnce({ tokenId: "id-token" });
    const respuesta = await cerrarSesion(new NextRequest("http://localhost/logout", { method: "POST", headers: { origin: "http://localhost" } }));

    expect(auth.signOut).toHaveBeenCalledWith({ redirect: false });
    expect(respuesta.status).toBe(303);
    const destino = new URL(respuesta.headers.get("location") ?? "");
    expect(destino.origin + destino.pathname).toBe("http://localhost:9080/realms/sotra/protocol/openid-connect/logout");
    expect(destino.searchParams.get("id_token_hint")).toBe("id-token");
    expect(destino.searchParams.get("post_logout_redirect_uri")).toBe("http://localhost/");
  });
});

describe("/login/error (por ejemplo, «Atrás» hasta la pantalla de Keycloak ya usada)", () => {
  it("con la sesión vigente vuelve al inicio sin mostrar un error", async () => {
    await expect(PaginaErrorInicioSesion()).rejects.toMatchObject({ destino: "/" });
  });

  it("sin sesión explica el problema y ofrece volver a iniciar sesión", async () => {
    vi.mocked(obtenerTokenAcceso).mockResolvedValueOnce(null);
    render(await PaginaErrorInicioSesion());
    expect(screen.getByRole("heading", { name: "No se pudo completar el inicio de sesión" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver a iniciar sesión" })).toHaveAttribute("href", "/login");
  });
});
