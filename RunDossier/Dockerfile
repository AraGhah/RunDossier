FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

FROM node:22-alpine
WORKDIR /app

RUN apk add --no-cache ca-certificates wget && update-ca-certificates

# Dedicated non-root user — prevents container escape from writing to FS as root
RUN addgroup -S preframe && adduser -S -G preframe preframe

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

RUN mkdir -p /app/data/deliveries && chown -R preframe:preframe /app/data

# Drop to non-root before the process starts
USER preframe

ENV NODE_ENV=production
EXPOSE 3000

# Fail fast if health check doesn't respond — orchestrators (k8s, ECS) use this
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
