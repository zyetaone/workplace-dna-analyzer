# Simple Dockerfile for Coolify
FROM node:20-alpine

# Install SQLite
RUN apk add --no-cache sqlite

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create data directory for libsql
RUN mkdir -p /app/data && \
    chmod 755 /app/data

# Set environment variables
ENV NODE_ENV=production
ENV DATABASE_URL=file:/app/data/local.db

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Start the application
CMD ["node", "build"]