# syntax=docker/dockerfile:1.7

########################################
# Stage 1: Build dependencies stage
########################################
FROM node:24-alpine AS deps
WORKDIR /app

# Install native build dependencies required for libsql and better-sqlite3
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    gcc \
    musl-dev \
    sqlite-dev \
    curl \
    git

# Copy package files
COPY package*.json ./

# Add better-sqlite3 as fallback dependency and move @libsql/client to dependencies
# This ensures better-sqlite3 is available during runtime for Alpine Linux compatibility
RUN npm pkg set dependencies.better-sqlite3="^11.5.0" && \
    npm pkg set dependencies."@libsql/client"="^0.15.12" && \
    npm pkg delete devDependencies."@libsql/client"

# Install ALL dependencies with platform-specific compilation
# Force rebuild native modules for Alpine Linux (musl)
RUN npm ci --no-audit --no-fund && \
    npm rebuild better-sqlite3 --build-from-source && \
    npm cache clean --force

########################################
# Stage 2: Build the application
########################################
FROM node:24-alpine AS builder
WORKDIR /app

# Install minimal build dependencies
RUN apk add --no-cache python3 make g++

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./

# Copy all source files
COPY . .

# Set build environment for native modules
ENV NODE_ENV=production \
    npm_config_build_from_source=true \
    npm_config_target_platform=linux \
    npm_config_target_arch=x64 \
    npm_config_target_libc=musl

# Generate .svelte-kit and build the app
RUN npm run prepare && npm run build

########################################
# Stage 3: Production runtime
########################################
FROM node:24-alpine
WORKDIR /app

# Install runtime dependencies for SQLite and native modules
RUN apk add --no-cache \
    sqlite \
    curl \
    dumb-init \
    ca-certificates

# Environment variables
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    DATABASE_URL=/app/data/local.db \
    DOCKER_ENV=true \
    # Force use of better-sqlite3 as fallback in Alpine
    USE_BETTER_SQLITE3=true

# Copy package files
COPY --from=builder /app/package*.json ./

# Copy production node_modules (already includes better-sqlite3)
COPY --from=deps /app/node_modules ./node_modules

# Prune dev dependencies but keep better-sqlite3
RUN npm prune --omit=dev --ignore-scripts || true

# Copy built application
COPY --from=builder /app/build ./build

# Copy Drizzle migrations if they exist
COPY --from=builder /app/drizzle ./drizzle 2>/dev/null || mkdir -p ./drizzle

# Create data directory for SQLite with proper permissions
RUN mkdir -p /app/data && \
    chmod 755 /app/data && \
    chown node:node /app/data

# Switch to non-root user for security
USER node

# Expose port
EXPOSE 3000

# Enhanced health check that works better with Alpine
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/health 2>/dev/null || \
      curl -f http://localhost:3000/ 2>/dev/null || \
      exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "build/index.js"]