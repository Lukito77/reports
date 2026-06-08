# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# Install deps (cached unless package files change)
COPY package*.json ./
RUN npm ci

# Generate Prisma client + compile TS
COPY prisma ./prisma
RUN npx prisma generate
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Runtime stage ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# sharp needs libc compat on alpine for some platforms
RUN apk add --no-cache vips-dev || true

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Prisma client + schema (needed for migrate deploy & seed at boot)
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma
COPY --from=build /app/dist ./dist
# tsx runs the seed script; prisma CLI runs db push / migrate deploy at container start
RUN npm install -g tsx@4.16.0 prisma@5.16.0

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD wget -qO- http://localhost:4000/api/health || exit 1

CMD ["node", "dist/index.js"]
