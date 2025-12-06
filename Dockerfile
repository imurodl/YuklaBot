# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

# Install ffmpeg and yt-dlp
RUN apk add --no-cache ffmpeg python3 py3-pip firefox && \
    pip3 install --break-system-packages yt-dlp

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy necessary files
COPY cookies.txt* ./

# Create temp directory
RUN mkdir -p /tmp/yuklabot && chmod 777 /tmp/yuklabot

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app /tmp/yuklabot

USER nodejs

EXPOSE 8000

CMD ["node", "dist/main"]
