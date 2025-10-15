# Use Node.js LTS version
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Build the application
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

# Don't run production as root - SECURITY FIX
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Copy built application
COPY --from=builder --chown=appuser:nodejs /app/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/package.json ./package.json

# Install only production dependencies
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules

# Switch to non-root user - SECURITY FIX
USER appuser

# Expose port
EXPOSE 5000

# Set NODE_ENV
ENV NODE_ENV=production

# Start the application
CMD ["node", "dist/index.js"]
