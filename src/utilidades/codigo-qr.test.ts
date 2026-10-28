import { describe, expect, it } from "vitest";
import { generarCodigoQr } from "./codigo-qr";

describe("QR local para cualquier entorno", () => {
  it("genera códigos distintos para localhost, staging y producción", async () => {
    const urls = ["http://localhost/inicio", "https://staging.example.test/inicio", "https://example.test/inicio"];
    const codigos = await Promise.all(urls.map(generarCodigoQr));
    expect(new Set(codigos.map(codigo => codigo.trazado)).size).toBe(3);
    for (const codigo of codigos) {
      expect(codigo.lado).toBeGreaterThan(20);
      expect(codigo.trazado).toMatch(/^M4 4h1v1h-1z/);
    }
  });
});
