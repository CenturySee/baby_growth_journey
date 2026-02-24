# ================================
# Stage 1: Build Frontend
# ================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

COPY . .
RUN npm run build

# ================================
# Stage 2: Build Backend
# ================================
FROM node:20-alpine AS backend-builder

WORKDIR /app/server

COPY server/package.json server/package-lock.json ./
RUN npm ci --frozen-lockfile

COPY server/ .
RUN npm run build

# ================================
# Stage 3: Production
# ================================
FROM node:20-alpine AS production

RUN apk add --no-cache nginx

# Copy frontend build
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/http.d/default.conf

# Copy backend
WORKDIR /app/server
COPY --from=backend-builder /app/server/dist ./dist
COPY --from=backend-builder /app/server/node_modules ./node_modules
COPY --from=backend-builder /app/server/package.json ./

# Data directory for SQLite
RUN mkdir -p /app/data

ENV DATA_DIR=/app/data
ENV PORT=3001

# Start script
COPY <<EOF /app/start.sh
#!/bin/sh
nginx
node /app/server/dist/index.js
EOF
RUN chmod +x /app/start.sh

EXPOSE 80

CMD ["/app/start.sh"]
