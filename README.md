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

El servicio `sotra-frontend-prod` compila la aplicación con el `Dockerfile` de producción. La URL de la API se escribe en el momento de compilar, así que hay que indicarla antes de construir la imagen.

1. Iniciar sesión una vez en el registro de las imágenes base: `docker login dhi.io`.
2. Crear el archivo `.env` junto a `compose.yaml` con la URL del backend que se va a usar, por ejemplo:

```env
API_URL=http://localhost:8080
```

3. Construir y levantar:

```bash
docker compose up -d --build sotra-frontend-prod
```

Se abre en http://localhost (puerto 80). Usa el mismo puerto que `sotra-frontend-dev`, así que no pueden estar levantados a la vez; para pasar de uno a otro: `docker compose down`.

Si cambia `API_URL` hay que volver a construir con `--build`, porque la URL queda dentro de la imagen. Si la pantalla muestra "La URL de la API no está configurada", falta el `.env` o se construyó sin él.

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
