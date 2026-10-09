# sotra-frontend

Frontend de SOTRA. Usa la API que indica `API_URL`; en desarrollo es el backend simulado: `http://localhost:8081`.

## Desarrollo

Copiar `.env.dev.example` como `.env.dev` (ya trae el valor por defecto) y luego:

```bash
docker compose up -d --build sotra-frontend-dev
```

La primera vez, `--build` construye la imagen. Las veces siguientes no hace falta: alcanza con `docker compose up -d sotra-frontend-dev`, salvo que cambies `package.json` o los Dockerfiles, en cuyo caso hay que volver a agregar `--build`.

Se abre en http://localhost (puerto 80). La carpeta del proyecto está montada dentro del contenedor, así que al guardar un cambio solo hay que refrescar la página; no hace falta reconstruir ni reiniciar el contenedor.

Las versiones de frontend y backend se muestran solamente en el pie de página. La versión del backend se consulta en `GET /api/v1/version` y muestra "Cargando..." o "No disponible" según corresponda.

El logo del menú se sirve desde `public/images/logo-cvm.png` mediante la ruta `/images/logo-cvm.png`. Sus dimensiones originales se indican en el componente para conservar la proporción; la ruta pública permite comprobar tipos antes de generar los archivos de Next.js en CI.

Sin Docker, con `npm run dev`, se abre en http://localhost:3000.

## Producción

Hacen falta el nombre y la etiqueta de la imagen. En PowerShell:

```powershell
$env:IMAGE_NAME = "sotra-frontend"
$env:IMAGE_TAG = "local"
docker compose up -d --build sotra-frontend-prod
```

Se abre en http://localhost:3100.

## Pruebas y lint

```bash
docker compose --profile tools run --rm sotra-frontend-test
docker compose --profile tools run --rm sotra-frontend-lint
docker exec sotra-frontend-dev npm run test:run
```

La imagen de desarrollo usa Node 26 con su Web Storage experimental desactivada para que las pruebas usen `localStorage` de jsdom. El navegador conserva su propio almacenamiento local.

## Detener

```bash
docker compose down
```
