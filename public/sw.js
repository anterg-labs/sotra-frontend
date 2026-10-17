// Service worker mínimo (opción A del plan: instalable y solo en línea). No guarda datos de negocio ni respuestas
// de la API: solo la pantalla "sin conexión", para mostrar un aviso claro cuando falla la red al navegar.
const CACHE = "sotra-sin-conexion-v1";
const PAGINA_SIN_CONEXION = "/sin-conexion";

self.addEventListener("install", (evento) => {
  evento.waitUntil(caches.open(CACHE).then((cache) => cache.add(PAGINA_SIN_CONEXION)));
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys().then((claves) => Promise.all(claves.filter((clave) => clave !== CACHE).map((clave) => caches.delete(clave)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (evento) => {
  if (evento.request.mode !== "navigate") return;
  evento.respondWith(fetch(evento.request).catch(() => caches.match(PAGINA_SIN_CONEXION)));
});
