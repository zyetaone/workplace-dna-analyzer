# Alpine Docker with libsql (no compilation needed!)
FROM node:24-alpine
WORKDIR /app

# Install SQLite for database initialization
RUN apk add --no-cache sqlite curl

# Copy pre-built app from local build
COPY build ./build
COPY package*.json ./
COPY drizzle ./drizzle

# Install production dependencies only
# libsql has prebuilt binaries for Alpine!
RUN npm ci --omit=dev --ignore-scripts

# Create database with WAL mode
RUN sqlite3 local.db "PRAGMA journal_mode=WAL; SELECT 'Database initialized';"

# Set environment
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    DATABASE_URL=file:./local.db \
    ORIGIN=http://localhost:3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Run the app
CMD ["node", "build"]