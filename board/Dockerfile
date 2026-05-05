# ── Stage 1: Install dependencies ──────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app/board

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# ── Stage 2: Build ─────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app/board

COPY --from=deps /app/board/node_modules ./node_modules
COPY . .

RUN npm run build

# ── Stage 3: Production ────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app/board

ENV NODE_ENV=production

# Don't run as root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 edith

# Copy built assets
COPY --from=builder /app/board/.next ./.next
COPY --from=builder /app/board/dist ./dist
COPY --from=builder /app/board/node_modules ./node_modules
COPY --from=builder /app/board/package.json ./
COPY --from=builder /app/board/server ./server
COPY --from=builder /app/board/next.config.js ./

USER edith

EXPOSE 3000 3001

# Start both frontend and API server
CMD ["sh", "-c", "node dist/server/index.js & npx next start --port 3000"]
