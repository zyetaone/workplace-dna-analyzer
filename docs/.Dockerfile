# --- builder ---
FROM node:24-alpine AS builder
WORKDIR /app

# Toolchain only for native deps (better-sqlite3, sharp, etc.)
RUN apk add --no-cache --virtual .build-deps python3 make g++

# Install deps (prepare may run; that's fine)
COPY package*.json ./
RUN npm ci

# Copy configs early so sync sees them
COPY svelte.config.* tsconfig.json vite.config.* ./

# Ensure .svelte-kit/tsconfig.json exists (fixes "Cannot find base config")
RUN npx svelte-kit sync

# Now copy the rest and build
COPY . .
RUN npm run build

# Keep only prod deps for runtime and drop toolchain
RUN npm prune --omit=dev && apk del .build-deps

# --- runtime ---
FROM node:24-alpine
WORKDIR /app

# PATH for local binaries
ENV PATH="/app/node_modules/.bin:${PATH}" \
    NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    DATABASE_URL=file:/app/data/local.db

# Copy built app + prod deps
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
# If you actually have this directory, keep it; otherwise remove the next line
COPY --from=builder /app/drizzle ./drizzle

# Safer runtime user + data dir
RUN addgroup -S nodegrp && adduser -S node -G nodegrp \
 && mkdir -p /app/data && chown -R node:nodegrp /app
USER node

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000').then(()=>process.exit(0)).catch(()=>process.exit(1))"

# SvelteKit adapter-node entry
CMD ["node", "build"]
