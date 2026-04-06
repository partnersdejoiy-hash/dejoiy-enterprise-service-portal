# -------- Base stage --------
FROM node:20-alpine AS base

WORKDIR /app

# Install required system packages
RUN apk add --no-cache libc6-compat openssl

# -------- Dependencies stage --------
FROM base AS deps

COPY package.json package-lock.json* ./
RUN npm install

# -------- Builder stage --------
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build

# -------- Production runner stage --------
FROM base AS runner

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.js ./next.config.js

EXPOSE 3000

CMD ["npm", "run", "start"]