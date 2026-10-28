import { networkInterfaces } from "node:os";
import { existsSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

// Docker ve su red interna, no la Wi-Fi del equipo. Este archivo lo genera el host y se comparte por el volumen.
if (!existsSync("/.dockerenv")) {
  const interfaces = Object.entries(networkInterfaces())
    .filter(([nombre]) => !/docker|vethernet|wsl|virtualbox|vmware|vpn|loopback/i.test(nombre))
    .sort(([a], [b]) => Number(/wi-?fi|wlan|wireless/i.test(b)) - Number(/wi-?fi|wlan|wireless/i.test(a)));
  const ip = interfaces.flatMap(([, direcciones]) => direcciones ?? [])
    .find(direccion => direccion.family === "IPv4" && !direccion.internal && !direccion.address.startsWith("169.254."))?.address;
  writeFileSync(".ip-local.json", JSON.stringify({ ipLocal: ip ?? null }) + "\n");
  console.log(ip ? "Dirección local del QR actualizada." : "Sin IPv4 de red: el QR local quedará disponible al conectarse y actualizar la IP.");
}
if (process.argv.includes("--docker")) {
  const resultado = spawnSync("docker", ["compose", "up", "-d", "sotra-frontend-dev"], { stdio: "inherit" });
  process.exitCode = resultado.status ?? 1;
}
