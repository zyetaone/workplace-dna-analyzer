###STAGE 1 : DEPS###

FROM node:24-alpine AS deps

# Install SQLite
RUN apk add --no-cache sqlite curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev --no-audit --no-fund

###STAGE 2 : BUILD###
FROM node:24-alpine AS builder
# Set working directory
WORKDIR /app 

# Copy node modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all source code
COPY . .

# Generate Sveltekit Files for production
RUN npm run prepare

# Build the application - producrtion mode
RUN npm run build

###STAGE 3 : RUN###
FROM node:24-alpine AS runner
# Set working directory
WORKDIR /app

#env variables
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    DATABASE_URL=file:./local.db

    #Copy package files and node modules
COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules

RUN npm prune --omit=dev --no-audit --no-fund

# Copy built files from builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/drizzle ./drizzle


# Create database with WAL mode for better concurrency

RUN sqlite3 local.db "PRAGMA journal_mode=WAL; SELECT 'Database initialized';"

# DB permissions
RUN chmod 755 local.db
RUN chmod 755 local.db-shm
RUN chmod 755 local.db-wal

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Start the application
CMD ["node", "build"]