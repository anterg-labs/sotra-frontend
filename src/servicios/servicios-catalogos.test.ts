import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { paginaDe, simularFetch } from "@/pruebas/ayudas";
import { listarRoles, listarUsuarios, listarUsuariosPaginados, obtenerDetalleUsuario } from "@/servicios/servicio-usuarios";
import { listarModelosMaquinaPaginados } from "@/servicios/servicio-modelos-maquina";
import { listarTiposMaquinaPaginados } from "@/servicios/servicio-tipos-maquina";
import { cerrarSesion, obtenerUsuarioEnSesion } from "@/servicios/servicio-sesion";
import { listarActivosPaginados, obtenerDetalleActivo } from "@/servicios/servicio-activos";
import { listarClientesPaginados, obtenerDetalleCliente } from "@/servicios/servicio-clientes";
import { ErrorDeApi } from "@/servicios/api/solicitudes-http";

beforeEach(() => {
  vi.stubEnv("API_URL", "http://api.test/");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("servicio-usuarios (lecturas del navegador)", () => {
  it("arma los filtros del listado paginado omitiendo los vacíos y normaliza la barra final de API_URL", async () => {
    const { llamadas } = simularFetch(() => ({ cuerpo: paginaDe([]) }));
    await listarUsuariosPaginados({ buscar: " ana ", rolId: "2", estado: "activo", pagina: 3 });
    await listarUsuariosPaginados({ buscar: "  ", rolId: "", estado: "", pagina: 1 });
    expect(llamadas[0].url).toBe(
      "http://api.test/api/v1/usuarios?buscar=ana&rolId=2&estado=activo&direccionOrden=desc&pagina=3",
    );
    expect(llamadas[1].url).toBe("http://api.test/api/v1/usuarios?direccionOrden=desc&pagina=1");
  });

  it("recorre todas las páginas al listar todo", async () => {
    const { llamadas } = simularFetch(({ url }) => {
      const pagina = Number(new URL(url).searchParams.get("pagina"));
      return { cuerpo: paginaDe([{ id: pagina }], { pagina, totalPaginas: 3 }) };
    });
    const usuarios = await listarUsuarios();
    expect(usuarios).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    expect(llamadas).toHaveLength(3);
    expect(llamadas[0].url).toContain("tamanoPagina=100");
  });

  it("obtiene roles y detalle", async () => {
    const { llamadas } = simularFetch(({ url }) => ({
      cuerpo: url.endsWith("/roles") ? [{ id: 1, nombre: "Admin" }] : { id: 5 },
    }));
    expect(await listarRoles()).toEqual([{ id: 1, nombre: "Admin" }]);
    expect(await obtenerDetalleUsuario(5)).toEqual({ id: 5 });
    expect(llamadas[1].url).toBe("http://api.test/api/v1/usuarios/5");
  });

  it("propaga el código y el mensaje del error de la API", async () => {
    simularFetch(() => ({ estado: 409, cuerpo: { mensaje: "El correo ya existe.", codigo: "USUARIO_DUPLICADO" } }));
    const error = await obtenerDetalleUsuario(1).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ErrorDeApi);
    expect(error).toMatchObject({ message: "El correo ya existe.", codigo: "USUARIO_DUPLICADO", estadoHttp: 409 });
  });
});

describe("servicios de catálogos (lecturas del navegador)", () => {
  it("arma los filtros de modelos, tipos y activos", async () => {
    const { llamadas } = simularFetch(() => ({ cuerpo: paginaDe([]) }));
    await listarModelosMaquinaPaginados({ buscar: "x", tipoMaquinaId: "2", estado: "inactivo", pagina: 2 });
    await listarTiposMaquinaPaginados({ buscar: "", estado: "activo", pagina: 1 });
    await listarActivosPaginados({ buscar: "a", clienteId: "1", modeloMaquinaId: "2", estado: "activo", pagina: 4 });
    await obtenerDetalleActivo(9);
    expect(llamadas.map((l) => l.url.replace("http://api.test", ""))).toEqual([
      "/api/v1/modelos-maquina?buscar=x&tipoMaquinaId=2&estado=inactivo&pagina=2",
      "/api/v1/tipos-maquina?estado=activo&pagina=1",
      "/api/v1/activos?buscar=a&clienteId=1&modeloMaquinaId=2&estado=activo&pagina=4",
      "/api/v1/activos/9",
    ]);
  });
});

describe("servicio-clientes (lecturas del navegador)", () => {
  it("lista con filtros y orden descendente, y obtiene el detalle", async () => {
    const { llamadas } = simularFetch(() => ({ cuerpo: paginaDe([]) }));
    await listarClientesPaginados({ buscar: "x", estado: "inactivo", pagina: 2 });
    await obtenerDetalleCliente(3);
    expect(llamadas[0].url).toBe("http://api.test/api/v1/clientes?buscar=x&estado=inactivo&direccionOrden=desc&pagina=2");
    expect(llamadas[1]).toMatchObject({ metodo: "GET", url: "http://api.test/api/v1/clientes/3" });
  });
});

describe("servicio-sesion", () => {
  it("sin integración de identidad no hay usuario y cerrar sesión no falla", async () => {
    expect(obtenerUsuarioEnSesion()).toBeNull();
    await expect(cerrarSesion()).resolves.toBeUndefined();
  });
});
