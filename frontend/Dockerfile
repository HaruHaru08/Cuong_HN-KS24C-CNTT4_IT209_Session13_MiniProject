# ==========================================
# Multi-stage Dockerfile for Campus Hub Pro Frontend
# Stage 1: Build the Vite production bundle
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package.json package-lock.json ./

# Install clean dependencies
RUN npm ci

# Copy source code and config
COPY . .

# Build production bundle
RUN npm run build

# ==========================================
# Stage 2: High Performance Nginx Static Server
# ==========================================
FROM nginx:alpine AS runner

# Remove default nginx site
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copy custom reverse proxy config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built frontend assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port 80
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=20s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
