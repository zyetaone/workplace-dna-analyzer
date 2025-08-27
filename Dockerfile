# Multi-stage Dockerfile for SvelteKit application
# This builds the app inside Docker to ensure compatibility with Coolify

########################################
# Stage 1: Install ALL dependencies
########################################
FROM node:24-alpine AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev deps needed for build)
RUN npm ci --no-audit --no-fund

########################################
# Stage 2: Build the application
########################################
FROM node:24-alpine AS builder
WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all source files
COPY . .

# Build the SvelteKit application
# This generates the build directory that will be used in production
RUN npm run build

########################################
# Stage 3: Production runtime
########################################
FROM node:24-alpine AS runner
WORKDIR /app

# Install SQLite and curl for database operations and healthcheck
RUN apk add --no-cache sqlite curl

# Set environment variables
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    DATABASE_URL=file:./local.db \
    ORIGIN=http://localhost:3000

# Copy package files for production install
COPY package*.json ./

# Copy dependencies from deps stage and prune dev dependencies
COPY --from=deps /app/node_modules ./node_modules
RUN npm prune --omit=dev

# Copy built application from builder stage
COPY --from=builder /app/build ./build

# Copy Drizzle migrations if they exist
COPY --from=builder /app/drizzle ./drizzle

# Create database with WAL mode for better concurrency
RUN sqlite3 local.db "PRAGMA journal_mode=WAL; SELECT 'Database initialized';"

# Create a startup script to handle database and start the app
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'set -e' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo 'echo "Starting application..."' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Ensure database has proper permissions' >> /app/start.sh && \
    echo 'chmod 644 local.db 2>/dev/null || true' >> /app/start.sh && \
    echo 'chmod 644 local.db-wal 2>/dev/null || true' >> /app/start.sh && \
    echo 'chmod 644 local.db-shm 2>/dev/null || true' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Start the application' >> /app/start.sh && \
    echo 'exec node build' >> /app/start.sh

RUN chmod +x /app/start.sh

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Run the application
CMD ["/app/start.sh"]