FROM dhi.io/node:26.12.1-alpine-sfw-dev AS dependencies

WORKDIR /app

# Copy package-related files first to leverage Docker's caching mechanism
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./

# Install project dependencies with frozen lockfile for reproducible builds
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/usr/local/share/.cache/yarn \
    --mount=type=cache,target=/root/.local/share/pnpm/store \
    npm ci --no-audit --no-fund
  
# ============================================
# Stage 2: Build Next.js application in standalone mode
# ============================================

FROM dhi.io/node:26.12.1-alpine-sfw-dev AS builder

# Set working directory
WORKDIR /app

# Copy project dependencies from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application source code
COPY . .

ARG API_URL
ENV API_URL=$API_URL

ENV NODE_ENV=production

RUN npm run build

# ============================================
# Stage 3: Run Next.js application
# ============================================

FROM dhi.io/node:26.12.1-alpine-sfw-dev AS runner

# Keep runtime packages at or above the versions that fix current HIGH findings.
RUN apk add --no-cache 'libexpat>=2.9.0-r0' 'pcre2>=10.49-r0'

# Set working directory
WORKDIR /app

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# Se define al ejecutar el contenedor (variable de entorno), no al construir la imagen.
ENV API_URL_INTERNA=""

# Copy production assets
COPY --from=builder --chown=node:node /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown node:node .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

# El volumen compartido conserva fallos de sesión mientras la API o la base están caídas.
RUN mkdir -p /var/lib/sotra/errores && chmod 1777 /var/lib/sotra/errores

# Switch to non-root user for security best practices
USER node

# Expose port 3000 to allow HTTP traffic
EXPOSE 3000

# Start Next.js standalone server
CMD ["node", "server.js"]
